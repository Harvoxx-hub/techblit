import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to use service account from environment variables (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use default credentials (for local development with gcloud auth)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback: try to initialize with default credentials
      admin.initializeApp({
        projectId: 'techblit',
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Don't throw - allow the app to continue (will fall back to client SDK)
  }
}

export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export default admin;

