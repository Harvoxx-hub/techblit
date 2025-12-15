/**
 * Migrate Post Images to Cloudinary
 * 
 * Migrates images directly from posts (featured images and content images)
 * to Cloudinary, bypassing the media collection.
 * 
 * Usage:
 *   node functions/src/scripts/migrate-post-images-to-cloudinary.js
 *   OR
 *   node functions/src/scripts/migrate-post-images-to-cloudinary.js --dry-run
 *   OR
 *   node functions/src/scripts/migrate-post-images-to-cloudinary.js --limit=10
 *   OR
 *   node functions/src/scripts/migrate-post-images-to-cloudinary.js --featured-only  (only migrate featured images)
 *   OR
 *   node functions/src/scripts/migrate-post-images-to-cloudinary.js --content-only  (only migrate content images)
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
const FEATURED_ONLY = process.argv.includes('--featured-only');
const CONTENT_ONLY = process.argv.includes('--content-only');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

// Statistics
const stats = {
  total: 0,
  postsProcessed: 0,
  featuredImagesMigrated: 0,
  contentImagesMigrated: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

// Track unique images to avoid duplicate uploads
const uploadedImages = new Map(); // URL -> public_id mapping

/**
 * Extract file path from Firebase Storage URL
 */
function extractStoragePath(url) {
  try {
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
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${storagePath}`);
    }
    
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    logger.error(`Error downloading from storage: ${storagePath}`, error);
    throw error;
  }
}

/**
 * Download file from URL
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
 * Upload image to Cloudinary (with deduplication)
 */
async function uploadImageToCloudinary(imageUrl, postSlug, imageType = 'content') {
  try {
    // Check if already uploaded
    if (uploadedImages.has(imageUrl)) {
      return uploadedImages.get(imageUrl);
    }
    
    // Skip if already Cloudinary URL
    if (imageUrl.includes('res.cloudinary.com') || imageUrl.includes('cloudinary.com')) {
      return { public_id: null, alreadyCloudinary: true };
    }
    
    // Skip WordPress URLs
    if (imageUrl.includes('wp-content/uploads')) {
      return { public_id: null, skipped: true, reason: 'wordpress_url' };
    }
    
    // Download image
    let imageBuffer;
    let mimeType = 'image/jpeg';
    
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      const storagePath = extractStoragePath(imageUrl);
      if (!storagePath) {
        throw new Error('Could not extract storage path');
      }
      imageBuffer = await downloadFromStorage(storagePath);
      
      const extension = storagePath.split('.').pop()?.toLowerCase();
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';
      else if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
    } else {
      imageBuffer = await downloadFromUrl(imageUrl);
    }
    
    // Determine folder (always 'posts' for post images)
    const folder = 'posts';
    
    // Create file object
    const filename = imageUrl.split('/').pop()?.split('?')[0] || `post-${postSlug}-${imageType}.jpg`;
    const fileObject = {
      buffer: imageBuffer,
      mimetype: mimeType,
      originalname: filename,
      size: imageBuffer.length
    };
    
    // Upload to Cloudinary
    if (DRY_RUN) {
      logger.info(`🔍 [DRY RUN] Would upload to Cloudinary: ${imageUrl.substring(0, 60)}...`);
      return { public_id: `techblit/posts/${filename}`, dryRun: true };
    }
    
    const uploadResult = await cloudinaryService.uploadImage(fileObject, folder);
    
    // Cache the result
    uploadedImages.set(imageUrl, uploadResult.public_id);
    
    return { public_id: uploadResult.public_id };
  } catch (error) {
    logger.error(`Error uploading image ${imageUrl}:`, error.message);
    throw error;
  }
}

/**
 * Extract image URLs from HTML content
 */
function extractImageUrlsFromHtml(html) {
  if (!html) return [];
  
  const imageUrls = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    // Skip data URLs and already Cloudinary URLs
    if (!url.startsWith('data:') && 
        !url.includes('res.cloudinary.com') && 
        !url.includes('cloudinary.com')) {
      imageUrls.push(url);
    }
  }
  
  return [...new Set(imageUrls)]; // Remove duplicates
}

/**
 * Replace image URLs in HTML with Cloudinary URLs
 */
function replaceImageUrlsInHtml(html, urlMap) {
  if (!html) return html;
  
  let updatedHtml = html;
  
  Object.entries(urlMap).forEach(([oldUrl, publicId]) => {
    if (publicId) {
      // Use inline preset for content images (800px width)
      const cloudinaryUrl = cloudinaryService.getCloudinaryUrl(publicId, { 
        width: 800,
        fetch_format: 'auto',
        quality: 'auto'
      });
      // Replace all occurrences of the old URL
      updatedHtml = updatedHtml.replace(new RegExp(escapeRegExp(oldUrl), 'g'), cloudinaryUrl);
    }
  });
  
  return updatedHtml;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Migrate featured image for a post
 */
async function migrateFeaturedImage(postId, postData) {
  try {
    if (!postData.featuredImage) {
      return null;
    }
    
    let imageUrl = null;
    
    // Handle different featuredImage formats
    if (typeof postData.featuredImage === 'string') {
      imageUrl = postData.featuredImage;
    } else if (postData.featuredImage.url) {
      imageUrl = postData.featuredImage.url;
    } else if (postData.featuredImage.original?.url) {
      imageUrl = postData.featuredImage.original.url;
    }
    
    if (!imageUrl) {
      return null;
    }
    
    // Skip if already Cloudinary
    if (imageUrl.includes('res.cloudinary.com')) {
      return null;
    }
    
    const result = await uploadImageToCloudinary(imageUrl, postData.slug, 'featured');
    
    if (result.public_id) {
      stats.featuredImagesMigrated++;
      return result.public_id;
    }
    
    return null;
  } catch (error) {
    logger.error(`Error migrating featured image for ${postId}:`, error.message);
    stats.errors.push({ postId, type: 'featured', error: error.message });
    return null;
  }
}

/**
 * Migrate content images for a post
 */
async function migrateContentImages(postId, postData) {
  try {
    if (!postData.contentHtml) {
      return { updatedHtml: postData.contentHtml, imageCount: 0 };
    }
    
    const imageUrls = extractImageUrlsFromHtml(postData.contentHtml);
    
    if (imageUrls.length === 0) {
      return { updatedHtml: postData.contentHtml, imageCount: 0 };
    }
    
    const urlMap = {};
    
    // Upload each image
    for (const imageUrl of imageUrls) {
      try {
        const result = await uploadImageToCloudinary(imageUrl, postData.slug, 'content');
        if (result.public_id) {
          urlMap[imageUrl] = result.public_id;
          stats.contentImagesMigrated++;
        }
      } catch (error) {
        logger.warn(`Failed to migrate content image ${imageUrl}:`, error.message);
        // Continue with other images
      }
    }
    
    // Replace URLs in HTML
    const updatedHtml = replaceImageUrlsInHtml(postData.contentHtml, urlMap);
    
    return { updatedHtml, imageCount: Object.keys(urlMap).length };
  } catch (error) {
    logger.error(`Error migrating content images for ${postId}:`, error.message);
    stats.errors.push({ postId, type: 'content', error: error.message });
    return { updatedHtml: postData.contentHtml, imageCount: 0 };
  }
}

/**
 * Migrate a single post
 */
async function migratePost(docId, postData) {
  try {
    stats.postsProcessed++;
    logger.info(`📝 Processing post: ${postData.title || docId}`);
    
    const updates = {};
    let hasUpdates = false;
    
    // Migrate featured image
    if (!CONTENT_ONLY && postData.featuredImage) {
      const featuredPublicId = await migrateFeaturedImage(docId, postData);
      
      if (featuredPublicId) {
        // Update featuredImage structure
        if (typeof postData.featuredImage === 'object' && postData.featuredImage.url) {
          // Simple format
          updates['featuredImage.public_id'] = featuredPublicId;
          updates['featuredImage.image_id'] = featuredPublicId;
          // Keep original URL for reference
        } else if (postData.featuredImage.original) {
          // ProcessedImage format
          updates['featuredImage.original.public_id'] = featuredPublicId;
          updates['featuredImage.original.image_id'] = featuredPublicId;
        }
        hasUpdates = true;
      }
    }
    
    // Migrate content images
    if (!FEATURED_ONLY && postData.contentHtml) {
      const { updatedHtml, imageCount } = await migrateContentImages(docId, postData);
      
      if (imageCount > 0) {
        updates.contentHtml = updatedHtml;
        hasUpdates = true;
        logger.info(`  ✅ Migrated ${imageCount} content image(s)`);
      }
    }
    
    // Update Firestore if there are changes
    if (hasUpdates && !DRY_RUN) {
      updates.updatedAt = new Date();
      updates.imageMigratedAt = new Date();
      
      await db.collection(CollectionNames.POSTS).doc(docId).update(updates);
      logger.info(`✅ Updated post: ${docId}`);
    } else if (DRY_RUN && hasUpdates) {
      logger.info(`🔍 [DRY RUN] Would update post: ${docId}`);
    }
    
    return { success: true, featuredMigrated: !!updates['featuredImage.public_id'], contentImagesMigrated: 0 };
  } catch (error) {
    logger.error(`❌ Failed to migrate post ${docId}:`, error.message);
    stats.failed++;
    stats.errors.push({
      postId: docId,
      title: postData.title,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('\n🚀 Post Images Migration to Cloudinary\n');
  console.log('='.repeat(60) + '\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  if (FEATURED_ONLY) {
    console.log('📸 FEATURED ONLY MODE - Only migrating featured images\n');
  }
  
  if (CONTENT_ONLY) {
    console.log('📄 CONTENT ONLY MODE - Only migrating content images\n');
  }
  
  if (LIMIT) {
    console.log(`📊 LIMIT MODE - Processing only ${LIMIT} posts\n`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  try {
    // Fetch all posts
    console.log('📋 Fetching posts...\n');
    
    let query = db.collection(CollectionNames.POSTS);
    
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    
    const snapshot = await query.get();
    stats.total = snapshot.size;
    
    console.log(`Found ${stats.total} posts\n`);
    console.log('='.repeat(60) + '\n');
    
    if (stats.total === 0) {
      console.log('✅ No posts found. Migration complete.\n');
      return;
    }
    
    // Process each post
    console.log('🔄 Starting migration...\n');
    
    for (let i = 0; i < snapshot.docs.length; i++) {
      const doc = snapshot.docs[i];
      const postData = doc.data();
      
      console.log(`[${i + 1}/${stats.total}] Processing: ${postData.title || doc.id}`);
      await migratePost(doc.id, postData);
      
      // Small delay to avoid rate limiting
      if (i < snapshot.docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📊 Migration Summary\n');
    console.log(`Total posts: ${stats.total}`);
    console.log(`Posts processed: ${stats.postsProcessed}`);
    console.log(`✅ Featured images migrated: ${stats.featuredImagesMigrated}`);
    console.log(`✅ Content images migrated: ${stats.contentImagesMigrated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`📦 Unique images uploaded: ${uploadedImages.size}`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    if (stats.errors.length > 0) {
      console.log('❌ Errors:\n');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err.postId} (${err.title || 'unknown'}): ${err.error}`);
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
      console.log('2. Check posts have public_id fields');
      console.log('3. Test image displays on frontend');
      console.log('4. Verify content HTML has Cloudinary URLs\n');
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

