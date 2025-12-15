/**
 * Migrate Images to Cloudinary
 * 
 * Migrates existing images from Firebase Storage to Cloudinary
 * 
 * Usage:
 *   node functions/src/scripts/migrate-images-to-cloudinary.js
 *   OR
 *   node functions/src/scripts/migrate-images-to-cloudinary.js --dry-run  (preview only, no changes)
 *   OR
 *   node functions/src/scripts/migrate-images-to-cloudinary.js --limit=10  (migrate only 10 records)
 *   OR
 *   node functions/src/scripts/migrate-images-to-cloudinary.js --skip-existing  (skip records that already have public_id)
 */

// Load environment variables FIRST before requiring Cloudinary service
require('dotenv').config();

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { CollectionNames } = require('../types/constants');
const cloudinaryService = require('../services/cloudinary');
const https = require('https');
const http = require('http');
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin SDK for local scripts
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../../techblit-firebase-adminsdk-fbsvc-1395c2bee0.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'techblit.firebasestorage.app',
      projectId: process.env.GCLOUD_PROJECT || 'techblit'
    });
    console.log('✅ Initialized Firebase with service account credentials');
  } else {
    // Fallback to default initialization
    console.log('⚠️  Service account file not found, using default initialization');
    admin.initializeApp({
      storageBucket: 'techblit.firebasestorage.app',
      projectId: process.env.GCLOUD_PROJECT || 'techblit'
    });
  }
}

const db = admin.firestore();
const storage = admin.storage();

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_EXISTING = process.argv.includes('--skip-existing');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

// Statistics
const stats = {
  total: 0,
  skipped: 0,
  migrated: 0,
  failed: 0,
  errors: []
};

/**
 * Extract file path from Firebase Storage URL
 */
function extractStoragePath(url) {
  try {
    // Pattern: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=xxx
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
  } catch (error) {
    logger.warn('Failed to extract storage path from URL:', url);
  }
  return null;
}

/**
 * Download file from Firebase Storage
 */
async function downloadFromStorage(storagePath) {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${storagePath}`);
    }
    
    // Download file
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    logger.error(`Error downloading from storage: ${storagePath}`, error);
    throw error;
  }
}

/**
 * Download file from URL (for external URLs)
 */
async function downloadFromUrl(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Determine folder from storage path or filename
 */
function determineFolder(storagePath, filename) {
  if (!storagePath && !filename) return 'media';
  
  const path = storagePath || filename || '';
  
  if (path.includes('/posts/') || path.includes('posts-')) return 'posts';
  if (path.includes('/authors/') || path.includes('author-')) return 'authors';
  if (path.includes('/categories/') || path.includes('category-')) return 'categories';
  if (path.includes('/ui/') || path.includes('ui-')) return 'ui';
  
  return 'media'; // Default
}

/**
 * Migrate a single media record
 */
async function migrateMediaRecord(docId, mediaData) {
  try {
    // Skip if already has public_id
    if (SKIP_EXISTING && (mediaData.public_id || mediaData.image_id)) {
      stats.skipped++;
      logger.info(`⏭️  Skipping ${docId} - already has public_id`);
      return { success: false, reason: 'already_migrated' };
    }
    
    // Skip if no URL
    if (!mediaData.url) {
      stats.skipped++;
      logger.warn(`⏭️  Skipping ${docId} - no URL`);
      return { success: false, reason: 'no_url' };
    }
    
    // Skip if already Cloudinary URL
    if (mediaData.url.includes('res.cloudinary.com') || mediaData.url.includes('cloudinary.com')) {
      stats.skipped++;
      logger.info(`⏭️  Skipping ${docId} - already Cloudinary URL`);
      return { success: false, reason: 'already_cloudinary' };
    }
    
    // Skip WordPress URLs
    if (mediaData.url.includes('wp-content/uploads')) {
      stats.skipped++;
      logger.warn(`⏭️  Skipping ${docId} - WordPress URL (not migrated)`);
      return { success: false, reason: 'wordpress_url' };
    }
    
    logger.info(`📥 Processing ${docId}: ${mediaData.filename || 'unknown'}`);
    
    // Download image
    let imageBuffer;
    let mimeType = mediaData.mimeType || 'image/jpeg';
    
    if (mediaData.url.includes('firebasestorage.googleapis.com')) {
      // Download from Firebase Storage
      const storagePath = extractStoragePath(mediaData.url);
      if (!storagePath) {
        throw new Error('Could not extract storage path from URL');
      }
      imageBuffer = await downloadFromStorage(storagePath);
      
      // Try to determine MIME type from file extension
      const extension = storagePath.split('.').pop()?.toLowerCase();
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';
      else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
    } else {
      // Download from external URL
      imageBuffer = await downloadFromUrl(mediaData.url);
    }
    
    // Determine folder
    const folder = determineFolder(mediaData.storagePath, mediaData.filename);
    
    // Create a file-like object for Cloudinary upload
    const fileObject = {
      buffer: imageBuffer,
      mimetype: mimeType,
      originalname: mediaData.filename || `migrated-${docId}.jpg`,
      size: imageBuffer.length
    };
    
    // Upload to Cloudinary
    if (DRY_RUN) {
      logger.info(`🔍 [DRY RUN] Would upload to Cloudinary: folder=${folder}, size=${imageBuffer.length} bytes`);
      return { success: true, dryRun: true };
    }
    
    const uploadResult = await cloudinaryService.uploadImage(fileObject, folder);
    
    // Update Firestore document
    const updateData = {
      public_id: uploadResult.public_id,
      image_id: uploadResult.public_id, // Alias
      // Keep original URL for reference during migration period
      // url: uploadResult.url, // Optionally update URL
      updatedAt: new Date(),
      migratedAt: new Date(),
      migratedFrom: 'firebase_storage'
    };
    
    await db.collection(CollectionNames.MEDIA).doc(docId).update(updateData);
    
    logger.info(`✅ Migrated ${docId}: ${uploadResult.public_id}`);
    stats.migrated++;
    
    return { success: true, public_id: uploadResult.public_id };
  } catch (error) {
    logger.error(`❌ Failed to migrate ${docId}:`, error.message);
    stats.failed++;
    stats.errors.push({
      docId,
      filename: mediaData.filename,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('\n🚀 Cloudinary Image Migration Tool\n');
  console.log('='.repeat(60) + '\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  if (SKIP_EXISTING) {
    console.log('⏭️  SKIP EXISTING MODE - Records with public_id will be skipped\n');
  }
  
  if (LIMIT) {
    console.log(`📊 LIMIT MODE - Processing only ${LIMIT} records\n`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  try {
    // Fetch all media records
    console.log('📋 Fetching media records...\n');
    
    let query = db.collection(CollectionNames.MEDIA)
      .orderBy('createdAt', 'desc');
    
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    
    const snapshot = await query.get();
    stats.total = snapshot.size;
    
    console.log(`Found ${stats.total} media records\n`);
    console.log('='.repeat(60) + '\n');
    
    if (stats.total === 0) {
      console.log('✅ No media records found. Migration complete.\n');
      return;
    }
    
    // Process each record
    console.log('🔄 Starting migration...\n');
    
    for (let i = 0; i < snapshot.docs.length; i++) {
      const doc = snapshot.docs[i];
      const mediaData = doc.data();
      
      console.log(`[${i + 1}/${stats.total}] Processing: ${doc.id}`);
      await migrateMediaRecord(doc.id, mediaData);
      
      // Small delay to avoid rate limiting
      if (i < snapshot.docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📊 Migration Summary\n');
    console.log(`Total records: ${stats.total}`);
    console.log(`✅ Migrated: ${stats.migrated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    if (stats.errors.length > 0) {
      console.log('❌ Errors:\n');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err.docId} (${err.filename}): ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`);
      }
      console.log('');
    }
    
    if (DRY_RUN) {
      console.log('🔍 This was a DRY RUN - no changes were made\n');
      console.log('Run without --dry-run to perform actual migration\n');
    } else {
      console.log('✅ Migration complete!\n');
      console.log('Next steps:');
      console.log('1. Verify migrated images in Cloudinary dashboard');
      console.log('2. Check Firestore records have public_id field');
      console.log('3. Test image displays on frontend');
      console.log('4. Consider cleaning up Firebase Storage files (optional)\n');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  runMigration().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { runMigration };

