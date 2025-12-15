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

async function inspectPost() {
  try {
    const snapshot = await db.collection('posts').limit(1).get();
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log('📋 Post Structure Inspection\n');
    console.log('Title:', data.title);
    console.log('Slug:', data.slug);
    console.log('\nFeatured Image Structure:');
    console.log(JSON.stringify(data.featuredImage, null, 2));
    
    if (data.contentHtml) {
      const imgMatches = data.contentHtml.match(/<img[^>]+src=["']([^"']+)["']/gi);
      if (imgMatches && imgMatches.length > 0) {
        console.log('\nContent Images (first 2):');
        imgMatches.slice(0, 2).forEach((img, idx) => {
          const srcMatch = img.match(/src=["']([^"']+)["']/);
          if (srcMatch) {
            const url = srcMatch[1];
            console.log(`\n[${idx + 1}] Full URL:`);
            console.log(`    ${url}`);
            console.log(`    Is Cloudinary: ${url.includes('cloudinary') ? 'YES ✅' : 'NO ❌'}`);
            console.log(`    Is Firebase Storage: ${url.includes('firebasestorage') ? 'YES' : 'NO'}`);
          }
        });
      } else {
        console.log('\nContent Images: None');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

inspectPost();

