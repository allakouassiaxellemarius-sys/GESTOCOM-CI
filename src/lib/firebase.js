import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let app = null
let db = null

export function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Config manquante — sync cloud désactivée')
    return false
  }
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    return true
  } catch (e) {
    console.error('[Firebase] Erreur init:', e)
    return false
  }
}

export function getDb() {
  if (!db) initFirebase()
  return db
}

export function isFirebaseReady() {
  return db !== null
}
