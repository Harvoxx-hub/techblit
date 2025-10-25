// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZMikgSM6h0_WXGrc296Iul8o2C6PlBZY",
  authDomain: "techblit.firebaseapp.com",
  projectId: "techblit",
  storageBucket: "techblit.firebasestorage.app",
  messagingSenderId: "164687436773",
  appId: "1:164687436773:web:c6db864b0010f6ef0eed0c",
  measurementId: "G-HGMXCFDD9N"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics will be initialized client-side only
export const getAnalyticsInstance = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    return getAnalytics(app);
  } catch (error) {
    console.warn('Analytics not supported in this environment:', error);
    return null;
  }
};

export default app;
