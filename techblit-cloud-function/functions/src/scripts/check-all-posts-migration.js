require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../../../techblit-firebase-adminsdk-fbsvc-1395c2bee0.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'techblit.firebasestorage.app',
    projectId: 'techblit',
  });
} else {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkAllPosts() {
  console.log('🔍 Checking ALL Posts for Migration Status\n');
  console.log('='.repeat(70));

  try {
    const snapshot = await db.collection('posts').get();
    
    if (snapshot.empty) {
      console.log('❌ No posts found');
      return;
    }

    let totalPosts = 0;
    let postsWithFeaturedImages = 0;
    let featuredImagesMigrated = 0;
    let featuredImagesNotMigrated = 0;
    let postsWithContentImages = 0;
    let contentImagesMigrated = 0;
    let contentImagesNotMigrated = 0;
    const postsNeedingMigration = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalPosts++;
      
      let needsMigration = false;

      // Check featured image
      if (data.featuredImage) {
        postsWithFeaturedImages++;
        let hasPublicId = false;
        let isFirebaseStorage = false;

        if (typeof data.featuredImage === 'string') {
          isFirebaseStorage = data.featuredImage.includes('firebasestorage.googleapis.com');
          hasPublicId = data.featuredImage.includes('cloudinary');
        } else if (data.featuredImage.public_id || data.featuredImage.image_id) {
          hasPublicId = true;
        } else if (data.featuredImage.url) {
          isFirebaseStorage = data.featuredImage.url.includes('firebasestorage.googleapis.com');
          hasPublicId = data.featuredImage.url.includes('cloudinary');
        } else if (data.featuredImage.original) {
          hasPublicId = !!(data.featuredImage.original.public_id || data.featuredImage.original.image_id);
          if (data.featuredImage.original.url) {
            isFirebaseStorage = data.featuredImage.original.url.includes('firebasestorage.googleapis.com');
          }
        }

        if (hasPublicId) {
          featuredImagesMigrated++;
        } else if (isFirebaseStorage) {
          featuredImagesNotMigrated++;
          needsMigration = true;
        }
      }

      // Check content images
      if (data.contentHtml) {
        const imgMatches = data.contentHtml.match(/<img[^>]+src=["']([^"']+)["']/gi);
        if (imgMatches && imgMatches.length > 0) {
          postsWithContentImages++;
          
          imgMatches.forEach(imgTag => {
            const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
              const url = srcMatch[1];
              // Skip data URLs
              if (url.startsWith('data:')) return;
              
              if (url.includes('cloudinary')) {
                contentImagesMigrated++;
              } else if (url.includes('firebasestorage.googleapis.com')) {
                contentImagesNotMigrated++;
                needsMigration = true;
              }
            }
          });
        }
      }

      if (needsMigration) {
        postsNeedingMigration.push({
          id: doc.id,
          slug: data.slug || 'N/A',
          title: data.title || 'N/A',
        });
      }
    });

    console.log(`\n📊 Complete Migration Status\n`);
    console.log(`Total Posts: ${totalPosts}`);
    console.log(`\nFeatured Images:`);
    console.log(`  Posts with featured images: ${postsWithFeaturedImages}`);
    console.log(`  ✅ Migrated (has public_id): ${featuredImagesMigrated}`);
    console.log(`  ❌ Not Migrated (Firebase Storage): ${featuredImagesNotMigrated}`);
    console.log(`\nContent Images:`);
    console.log(`  Posts with content images: ${postsWithContentImages}`);
    console.log(`  ✅ Migrated (Cloudinary URLs): ${contentImagesMigrated}`);
    console.log(`  ❌ Not Migrated (Firebase Storage): ${contentImagesNotMigrated}`);

    if (postsNeedingMigration.length > 0) {
      console.log(`\n⚠️  Posts Needing Migration: ${postsNeedingMigration.length}`);
      console.log('\nFirst 10 posts needing migration:');
      postsNeedingMigration.slice(0, 10).forEach((post, idx) => {
        console.log(`  [${idx + 1}] ${post.title} (${post.slug})`);
      });
    } else {
      console.log(`\n✅ All images have been migrated!`);
      console.log(`\nNote: Featured images still have Firebase Storage URLs in the 'url' field,`);
      console.log(`but they also have 'public_id' fields which the frontend uses for Cloudinary.`);
      console.log(`This is expected behavior - the old URL is kept for backward compatibility.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

checkAllPosts();

