import admin from 'firebase-admin';

let adminInitialized = false;
let adminDbInstance: admin.firestore.Firestore | null = null;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try to use service account from environment variables (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        adminInitialized = true;
        adminDbInstance = admin.firestore();
      } catch (parseError) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT, skipping Admin SDK initialization');
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use credentials file path
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        adminInitialized = true;
        adminDbInstance = admin.firestore();
      } catch (credError: any) {
        console.warn('Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS:', credError.message);
      }
    } else {
      // For local development without credentials, don't initialize Admin SDK
      // Will fall back to client SDK
      console.warn('Firebase Admin SDK not initialized - no credentials found. Using client SDK fallback for local development.');
    }
  } catch (error: any) {
    // Silently fail - will use client SDK fallback
    console.warn('Firebase Admin SDK initialization skipped:', error.message);
  }
} else {
  // Already initialized
  adminInitialized = true;
  adminDbInstance = admin.firestore();
}

export const adminDb = adminDbInstance;
export const isAdminInitialized = adminInitialized;
export default admin;

