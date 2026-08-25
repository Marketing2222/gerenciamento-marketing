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
let _configPromise: Promise<FirebaseConfig> | null = null

function fetchConfig(): Promise<FirebaseConfig> {
  if (_config) return Promise.resolve(_config)
  if (!_configPromise) {
    _configPromise = fetch('/api/firebase-config')
      .then((r) => r.json())
      .then((c: FirebaseConfig) => {
        _config = c
        return c
      })
  }
  return _configPromise
}

export function isFirebaseConfigured(): boolean {
  return !!(_config?.apiKey && _config?.projectId)
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
  await fetchConfig()
  return initSync()
}

export function dbSync(): Firestore | null {
  return _db
}

export function waitForConfig(): Promise<FirebaseConfig> {
  return fetchConfig()
}
