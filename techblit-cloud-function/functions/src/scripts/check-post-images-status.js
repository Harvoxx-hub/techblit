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

async function checkPostImagesStatus() {
  console.log('📋 Checking Posts for Image Migration Status\n');
  console.log('='.repeat(70));

  try {
    const snapshot = await db.collection('posts').limit(10).get();
    
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

    snapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      totalPosts++;
      
      console.log(`\n[${idx + 1}] Post: ${data.title || doc.id}`);
      console.log(`    Slug: ${data.slug || 'N/A'}`);

      // Check featured image
      if (data.featuredImage) {
        postsWithFeaturedImages++;
        let featuredUrl = null;
        let hasPublicId = false;

        if (typeof data.featuredImage === 'string') {
          featuredUrl = data.featuredImage;
          hasPublicId = featuredUrl.includes('cloudinary');
        } else if (data.featuredImage.url) {
          featuredUrl = data.featuredImage.url;
          hasPublicId = !!data.featuredImage.public_id || featuredUrl.includes('cloudinary');
        } else if (data.featuredImage.original && data.featuredImage.original.url) {
          featuredUrl = data.featuredImage.original.url;
          hasPublicId = !!data.featuredImage.original.public_id || featuredUrl.includes('cloudinary');
        }

        if (featuredUrl) {
          const isFirebaseStorage = featuredUrl.includes('firebasestorage.googleapis.com');
          const isCloudinary = featuredUrl.includes('cloudinary') || hasPublicId;
          
          console.log(`    Featured Image: ${featuredUrl.substring(0, 70)}...`);
          
          if (isCloudinary || hasPublicId) {
            console.log(`    ✅ Featured Image: MIGRATED (Cloudinary)`);
            featuredImagesMigrated++;
          } else if (isFirebaseStorage) {
            console.log(`    ❌ Featured Image: NOT MIGRATED (Firebase Storage)`);
            featuredImagesNotMigrated++;
          } else {
            console.log(`    ⚠️  Featured Image: Unknown source`);
          }
        }
      } else {
        console.log('    Featured Image: None');
      }

      // Check content images
      if (data.contentHtml) {
        const imgMatches = data.contentHtml.match(/<img[^>]+src=["']([^"']+)["']/gi);
        if (imgMatches && imgMatches.length > 0) {
          postsWithContentImages++;
          let cloudinaryCount = 0;
          let firebaseCount = 0;

          imgMatches.forEach(imgTag => {
            const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
              const url = srcMatch[1];
              if (url.includes('cloudinary')) {
                cloudinaryCount++;
              } else if (url.includes('firebasestorage.googleapis.com')) {
                firebaseCount++;
              }
            }
          });

          console.log(`    Content Images: ${imgMatches.length} total`);
          if (cloudinaryCount > 0) {
            console.log(`    ✅ Cloudinary: ${cloudinaryCount}`);
            contentImagesMigrated += cloudinaryCount;
          }
          if (firebaseCount > 0) {
            console.log(`    ❌ Firebase Storage: ${firebaseCount}`);
            contentImagesNotMigrated += firebaseCount;
          }
        } else {
          console.log('    Content Images: None');
        }
      }
    });

    // Get total count
    const totalSnapshot = await db.collection('posts').count().get();
    const totalPostsCount = totalSnapshot.data().count;

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Migration Status Summary\n');
    console.log(`Total Posts: ${totalPostsCount}`);
    console.log(`Posts Checked: ${totalPosts}`);
    console.log(`\nFeatured Images:`);
    console.log(`  Posts with featured images: ${postsWithFeaturedImages}`);
    console.log(`  ✅ Migrated: ${featuredImagesMigrated}`);
    console.log(`  ❌ Not Migrated: ${featuredImagesNotMigrated}`);
    console.log(`\nContent Images:`);
    console.log(`  Posts with content images: ${postsWithContentImages}`);
    console.log(`  ✅ Migrated: ${contentImagesMigrated}`);
    console.log(`  ❌ Not Migrated: ${contentImagesNotMigrated}`);

    if (featuredImagesNotMigrated > 0 || contentImagesNotMigrated > 0) {
      console.log(`\n⚠️  Migration Needed: ${featuredImagesNotMigrated + contentImagesNotMigrated} images still need migration`);
    } else {
      console.log(`\n✅ All images appear to be migrated!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

checkPostImagesStatus();

