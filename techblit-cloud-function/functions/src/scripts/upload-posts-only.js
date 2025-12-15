/**
 * Upload Posts Only
 * Uploads just the posts data to Firebase
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { promisify } = require('util');
const { CollectionNames, PostStatus } = require('../types/constants');

const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

// Initialize Firebase with service account credentials for local scripts
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../../techblit-firebase-adminsdk-fbsvc-1395c2bee0.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'techblit.firebasestorage.app' // Firebase Storage bucket
    });
    console.log('✅ Initialized Firebase with service account credentials');
  } else {
    // Fallback to default initialization
    console.log('⚠️  Service account file not found, using default initialization');
    admin.initializeApp({
      storageBucket: 'techblit.firebasestorage.app'
    });
  }
}

const db = admin.firestore();
const storage = admin.storage();

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extract image URLs from content
 */
function extractImageUrls(content) {
  const imageUrls = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    imageUrls.push(match[1]);
  }
  
  return [...new Set(imageUrls)]; // Remove duplicates
}

/**
 * Upload image to Firebase Storage
 */
async function uploadImageToStorage(imageUrl, postId) {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop().split('?')[0];
    const fileExtension = filename.split('.').pop();
    const timestamp = Date.now();
    const sanitizedFilename = `posts-images/${postId}/${timestamp}.${fileExtension}`;
    
    // Download image (handle both http and https)
    const imageBuffer = await new Promise((resolve, reject) => {
      const isHttps = imageUrl.startsWith('https');
      const client = isHttps ? https : http;
      
      client.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
    
    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(sanitizedFilename);
    
    await file.save(imageBuffer, {
      metadata: { contentType: 'image/' + fileExtension }
    });
    
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading image ${imageUrl}:`, error.message);
    return imageUrl; // Return original URL if upload fails
  }
}

/**
 * Replace image URLs in content with Firebase Storage URLs
 */
async function processContentImages(content, postId) {
  const imageUrls = extractImageUrls(content);
  
  if (imageUrls.length === 0) {
    return content;
  }
  
  console.log(`    🔄 Processing ${imageUrls.length} images...`);
  
  for (const imageUrl of imageUrls) {
    try {
      if (imageUrl.startsWith('http')) {
        const newUrl = await uploadImageToStorage(imageUrl, postId);
        content = content.replace(new RegExp(imageUrl, 'g'), newUrl);
      }
    } catch (error) {
      console.error(`    ⚠️  Failed to process image ${imageUrl}:`, error.message);
    }
  }
  
  return content;
}

/**
 * Generate a unique slug from title
 */
async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const doc = await db.collection(CollectionNames.POSTS)
      .where('slug', '==', slug)
      .limit(1)
      .get();
    
    if (doc.empty) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Upload posts to Firebase
 */
async function uploadPosts(forceUpdate = false) {
  const filepath = path.join(OUTPUT_DIR, 'posts.json');
  
  if (!fs.existsSync(filepath)) {
    console.error('❌ posts.json not found in migration-data directory');
    process.exit(1);
  }

  console.log('📂 Loading posts from file...');
  const data = fs.readFileSync(filepath, 'utf8');
  const posts = JSON.parse(data);
  console.log(`✅ Loaded ${posts.length} posts\n`);

  console.log('📤 Uploading posts to Firebase...\n');
  
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of posts) {
    try {
      // Generate unique slug
      const slug = await generateUniqueSlug(post.title);
      
      const postRef = db.collection(CollectionNames.POSTS).doc(`wp_${post.id}`);
      
      const existing = await postRef.get();
      
      if (existing.exists && !forceUpdate) {
        console.log(`  ⏭️  Skipping existing post: ${post.title}`);
        skipped++;
        continue;
      }
      
      if (existing.exists && forceUpdate) {
        console.log(`  🔄 Updating existing post: ${post.title}`);
      }

      // Ensure dates are properly formatted
      const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();
      const updatedAt = post.updatedAt ? new Date(post.updatedAt) : new Date();
      const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();

      // Process content to upload images to Firebase Storage
      let processedContent = post.content;
      
      // Only process images if not in fast mode (skip images for faster upload)
      const args = process.argv.slice(2);
      const skipImages = args.includes('--skip-images');
      
      if (!skipImages) {
        console.log(`  📸 Uploading images for: ${post.title}`);
        processedContent = await processContentImages(post.content, post.id);
      }

      // Strip HTML from excerpt for meta description
      const cleanExcerpt = stripHtml(post.excerpt);

      // Get first category only
      const primaryCategory = post.categories.length > 0 ? post.categories[0].name : 'Uncategorized';

      const firebasePost = {
        title: post.title,
        slug: slug,
        content: processedContent, // Content with Firebase Storage image URLs
        contentHtml: processedContent, // Store as contentHtml for public posts migration
        excerpt: post.excerpt, // Keep HTML in excerpt
        status: post.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT,
        author: post.author || { uid: 'unknown', name: 'Unknown Author' },
        featuredImage: post.featuredImage || null,
        tags: post.tags.map(t => t.name),
        category: primaryCategory, // Single category instead of array
        categories: post.categories.map(c => c.name), // Keep for backward compatibility
        publishedAt: post.status === 'published' ? publishedAt : null,
        updatedAt: updatedAt,
        createdAt: createdAt,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        metaTitle: post.metaTitle || post.title,
        metaDescription: cleanExcerpt.substring(0, 160), // Clean meta description without HTML
        canonical: post.canonical || '',
        visibility: post.visibility || 'public',
        meta: post.meta || {}
      };

      await postRef.set(firebasePost);
      uploaded++;
      console.log(`  ✅ (${uploaded}/${posts.length}) Uploaded: ${post.title}`);
    } catch (error) {
      errors++;
      console.error(`  ❌ Error uploading post ${post.title}:`, error.message);
    }
  }

  return { uploaded, skipped, errors, total: posts.length };
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const forceUpdate = args.includes('--force') || args.includes('-f');
    
    console.log('🚀 Starting post upload to Firebase...\n');
    if (forceUpdate) {
      console.log('⚠️  Force update mode: Will update existing posts\n');
    }
    console.log('=' .repeat(60) + '\n');

    const results = await uploadPosts(forceUpdate);

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 Upload complete!\n');
    console.log('Summary:');
    console.log(`  Total posts: ${results.total}`);
    console.log(`  Uploaded: ${results.uploaded}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors}\n`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadPosts, main };

