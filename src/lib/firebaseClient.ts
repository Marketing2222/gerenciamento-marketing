import { initializeApp, getApp as getDefaultApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

export function isFirebaseConfigured(): boolean {
  return !!(apiKey && projectId)
}

let _app: FirebaseApp | null = null

function firebaseApp(): FirebaseApp {
  if (!_app) {
    try {
      _app = getDefaultApp()
    } catch {
      _app = initializeApp({
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      })
    }
  }
  return _app
}

let _db: Firestore | null = null

export function db(): Firestore {
  if (!_db) {
    _db = getFirestore(firebaseApp())
  }
  return _db
}