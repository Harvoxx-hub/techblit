/**
 * WordPress Data Uploader to Firebase
 * Uploads exported WordPress data to Firebase Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { CollectionNames, PostStatus } = require('../types/constants');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

/**
 * Load JSON data from file
 * @param {string} filename - Name of the file to load
 * @returns {Promise<Array>} - Parsed JSON data
 */
function loadData(filename) {
  const filepath = path.join(OUTPUT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return [];
  }

  const data = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(data);
}

/**
 * Generate a unique slug from title
 * @param {string} title - The title to convert to slug
 * @returns {Promise<string>} - Unique slug
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
 * Upload users to Firebase
 * @param {Array} users - Array of user data
 * @returns {Promise<Object>} - Upload statistics
 */
async function uploadUsers(users) {
  console.log('\n📤 Uploading users...');
  
  let uploaded = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Create a document reference using the WordPress user ID
      const userRef = db.collection(CollectionNames.USERS).doc(`wp_${user.id}`);
      
      // Check if user already exists
      const existing = await userRef.get();
      
      if (existing.exists) {
        console.log(`  ⏭️  Skipping existing user: ${user.name}`);
        skipped++;
        continue;
      }

      // Convert WordPress user to Firebase user format
      const firebaseUser = {
        name: user.name,
        email: user.email,
        bio: user.description || '',
        avatar: user.avatar || '',
        website: user.url || '',
        role: 'author', // Default role for imported users
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: user.meta || {}
      };

      await userRef.set(firebaseUser);
      uploaded++;
      console.log(`  ✅ Uploaded user: ${user.name}`);
    } catch (error) {
      console.error(`  ❌ Error uploading user ${user.name}:`, error.message);
    }
  }

  return { uploaded, skipped, total: users.length };
}

/**
 * Upload categories to Firebase
 * @param {Array} categories - Array of category data
 * @returns {Promise<Object>} - Upload statistics
 */
async function uploadCategories(categories) {
  console.log('\n📤 Uploading categories...');
  
  let uploaded = 0;
  let skipped = 0;

  for (const category of categories) {
    try {
      const categoryRef = db.collection('categories').doc(`wp_${category.id}`);
      
      const existing = await categoryRef.get();
      
      if (existing.exists) {
        console.log(`  ⏭️  Skipping existing category: ${category.name}`);
        skipped++;
        continue;
      }

      await categoryRef.set({
        name: category.name,
        slug: category.slug,
        description: category.description,
        count: category.count,
        parent: category.parent,
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: category.meta || {}
      });

      uploaded++;
      console.log(`  ✅ Uploaded category: ${category.name}`);
    } catch (error) {
      console.error(`  ❌ Error uploading category ${category.name}:`, error.message);
    }
  }

  return { uploaded, skipped, total: categories.length };
}

/**
 * Upload tags to Firebase
 * @param {Array} tags - Array of tag data
 * @returns {Promise<Object>} - Upload statistics
 */
async function uploadTags(tags) {
  console.log('\n📤 Uploading tags...');
  
  let uploaded = 0;
  let skipped = 0;

  for (const tag of tags) {
    try {
      const tagRef = db.collection('tags').doc(`wp_${tag.id}`);
      
      const existing = await tagRef.get();
      
      if (existing.exists) {
        console.log(`  ⏭️  Skipping existing tag: ${tag.name}`);
        skipped++;
        continue;
      }

      await tagRef.set({
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        count: tag.count,
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: tag.meta || {}
      });

      uploaded++;
      console.log(`  ✅ Uploaded tag: ${tag.name}`);
    } catch (error) {
      console.error(`  ❌ Error uploading tag ${tag.name}:`, error.message);
    }
  }

  return { uploaded, skipped, total: tags.length };
}

/**
 * Upload media to Firebase
 * @param {Array} media - Array of media data
 * @returns {Promise<Object>} - Upload statistics
 */
async function uploadMedia(media) {
  console.log('\n📤 Uploading media...');
  
  let uploaded = 0;
  let skipped = 0;

  for (const item of media) {
    try {
      const mediaRef = db.collection(CollectionNames.MEDIA).doc(`wp_${item.id}`);
      
      const existing = await mediaRef.get();
      
      if (existing.exists) {
        console.log(`  ⏭️  Skipping existing media: ${item.title}`);
        skipped++;
        continue;
      }

      await mediaRef.set({
        url: item.url,
        title: item.title,
        alt: item.alt,
        caption: item.caption,
        description: item.description,
        mimeType: item.mimeType,
        width: item.width,
        height: item.height,
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: item.meta || {}
      });

      uploaded++;
      console.log(`  ✅ Uploaded media: ${item.title}`);
    } catch (error) {
      console.error(`  ❌ Error uploading media ${item.title}:`, error.message);
    }
  }

  return { uploaded, skipped, total: media.length };
}

/**
 * Upload posts to Firebase
 * @param {Array} posts - Array of post data
 * @returns {Promise<Object>} - Upload statistics
 */
async function uploadPosts(posts) {
  console.log('\n📤 Uploading posts...');
  
  let uploaded = 0;
  let skipped = 0;

  for (const post of posts) {
    try {
      // Generate unique slug
      const slug = await generateUniqueSlug(post.title);
      
      const postRef = db.collection(CollectionNames.POSTS).doc(`wp_${post.id}`);
      
      const existing = await postRef.get();
      
      if (existing.exists) {
        console.log(`  ⏭️  Skipping existing post: ${post.title}`);
        skipped++;
        continue;
      }

      // Ensure dates are properly formatted
      const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();
      const updatedAt = post.updatedAt ? new Date(post.updatedAt) : new Date();
      const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();

      const firebasePost = {
        title: post.title,
        slug: slug,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT,
        author: post.author || { uid: 'unknown', name: 'Unknown Author' },
        featuredImage: post.featuredImage || null,
        tags: post.tags.map(t => t.name),
        categories: post.categories.map(c => c.name),
        publishedAt: post.status === 'published' ? publishedAt : null,
        updatedAt: updatedAt,
        createdAt: createdAt,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        metaTitle: post.metaTitle || post.title,
        metaDescription: post.metaDescription || post.excerpt.substring(0, 160),
        canonical: post.canonical || '',
        visibility: post.visibility || 'public',
        meta: post.meta || {}
      };

      await postRef.set(firebasePost);
      uploaded++;
      console.log(`  ✅ Uploaded post: ${post.title}`);
    } catch (error) {
      console.error(`  ❌ Error uploading post ${post.title}:`, error.message);
    }
  }

  return { uploaded, skipped, total: posts.length };
}

/**
 * Main function to upload all data to Firebase
 */
async function main() {
  try {
    console.log('🚀 Starting data upload to Firebase...\n');

    // Load data from JSON files
    console.log('📂 Loading data from files...\n');
    
    const users = loadData('users.json');
    const categories = loadData('categories.json');
    const tags = loadData('tags.json');
    const media = loadData('media.json');
    const posts = loadData('posts.json');
    const pages = loadData('pages.json');

    console.log(`Loaded ${users.length} users`);
    console.log(`Loaded ${categories.length} categories`);
    console.log(`Loaded ${tags.length} tags`);
    console.log(`Loaded ${media.length} media items`);
    console.log(`Loaded ${posts.length} posts`);
    console.log(`Loaded ${pages.length} pages\n`);

    // Upload data in order
    const results = {
      users: await uploadUsers(users),
      categories: await uploadCategories(categories),
      tags: await uploadTags(tags),
      media: await uploadMedia(media),
      posts: await uploadPosts(posts),
      pages: pages.length > 0 ? await uploadPosts(pages) : { uploaded: 0, skipped: 0, total: 0 }
    };

    // Display summary
    console.log('\n🎉 Upload complete!\n');
    console.log('Summary:');
    console.log(`  Users: ${results.users.uploaded} uploaded, ${results.users.skipped} skipped`);
    console.log(`  Categories: ${results.categories.uploaded} uploaded, ${results.categories.skipped} skipped`);
    console.log(`  Tags: ${results.tags.uploaded} uploaded, ${results.tags.skipped} skipped`);
    console.log(`  Media: ${results.media.uploaded} uploaded, ${results.media.skipped} skipped`);
    console.log(`  Posts: ${results.posts.uploaded} uploaded, ${results.posts.skipped} skipped`);
    if (results.pages.total > 0) {
      console.log(`  Pages: ${results.pages.uploaded} uploaded, ${results.pages.skipped} skipped`);
    }

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  uploadUsers,
  uploadCategories,
  uploadTags,
  uploadMedia,
  uploadPosts
};

