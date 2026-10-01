import { initializeApp, getApp as getDefaultApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

let _config: FirebaseConfig | null = null

function getConfig(): FirebaseConfig {
  if (_config) return _config
  _config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }
  return _config
}

export function isFirebaseConfigured(): boolean {
  const c = getConfig()
  return !!(c.apiKey && c.projectId)
}

let _app: FirebaseApp | null = null
let _db: Firestore | null = null

function initSync(): Firestore {
  if (!_db && _config?.apiKey) {
    try {
      _app = getDefaultApp()
    } catch {
      _app = initializeApp({
        apiKey: _config.apiKey,
        authDomain: _config.authDomain,
        projectId: _config.projectId,
        storageBucket: _config.storageBucket,
        messagingSenderId: _config.messagingSenderId,
        appId: _config.appId,
      })
    }
    _db = getFirestore(_app)
  }
  return _db!
}

export async function db(): Promise<Firestore> {
  if (_db) return _db
  getConfig()
  return initSync()
}

export function dbSync(): Firestore | null {
  return _db
}

export function waitForConfig(): FirebaseConfig {
  return getConfig()
}
