const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Storage is no longer used - migrated to Cloudinary
// If needed for legacy operations, initialize conditionally:
// const storage = admin.storage();

module.exports = {
  admin,
  db,
  auth,
  // storage, // Removed - using Cloudinary instead
};
