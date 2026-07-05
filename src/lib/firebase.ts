// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBZMikgSM6h0_WXGrc296Iul8o2C6PlBZY",
  authDomain: "techblit.firebaseapp.com",
  projectId: "techblit",
  storageBucket: "techblit.firebasestorage.app",
  messagingSenderId: "164687436773",
  appId: "1:164687436773:web:c6db864b0010f6ef0eed0c",
  measurementId: "G-HGMXCFDD9N"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
export const auth = getAuth(app)

export const getAnalyticsInstance = () => {
  if (typeof window === 'undefined') return null

  try {
    return getAnalytics(app)
  } catch (error) {
    console.warn('Analytics not supported in this environment:', error)
    return null
  }
}

export default app
