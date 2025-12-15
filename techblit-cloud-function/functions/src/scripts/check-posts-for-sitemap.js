/**
 * Check posts in database for sitemap generation
 * Run: node src/scripts/check-posts-for-sitemap.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../../../techblit-firebase-adminsdk-fbsvc-1395c2bee0.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    // Try default initialization
    admin.initializeApp();
  }
}

const db = admin.firestore();
const { CollectionNames, PostStatus } = require('../types/constants');

async function checkPosts() {
  console.log('🔍 Checking posts for sitemap generation...\n');
  console.log('PostStatus constant:', PostStatus);
  console.log('CollectionNames:', CollectionNames);
  console.log('\n');

  try {
    // Check posts collection
    console.log('1️⃣ Checking posts collection:');
    try {
      const postsSnapshot = await db.collection(CollectionNames.POSTS)
        .where('status', '==', PostStatus.PUBLISHED)
        .limit(10)
        .get();
      
      console.log(`   Found ${postsSnapshot.size} published posts`);
      
      if (postsSnapshot.empty) {
        console.log('   ⚠️  No published posts found with status:', PostStatus.PUBLISHED);
        
        // Check for any posts
        const anyPosts = await db.collection(CollectionNames.POSTS).limit(5).get();
        console.log(`   Total posts in collection: ${anyPosts.size}`);
        if (!anyPosts.empty) {
          console.log('   Sample statuses found:');
          anyPosts.docs.forEach(doc => {
            const data = doc.data();
            console.log(`     - ${doc.id}: status="${data.status}" (type: ${typeof data.status})`);
          });
        }
      } else {
        postsSnapshot.docs.forEach((doc, idx) => {
          const data = doc.data();
          console.log(`   ${idx + 1}. ${data.slug || doc.id} | publishedAt: ${data.publishedAt ? 'Yes' : 'No'}`);
        });
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
      if (e.message.includes('index')) {
        console.log('   💡 Tip: Firestore index might be missing. Check Firebase Console > Firestore > Indexes');
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('   Expected status value:', PostStatus.PUBLISHED);
    console.log('   Collections checked:', CollectionNames.POSTS);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

checkPosts();


