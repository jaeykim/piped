import {
  initializeApp,
  getApps,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

let _app: App | undefined;
let _db: Firestore | undefined;
let _auth: Auth | undefined;
let _storage: Storage | undefined;
let _settingsApplied = false;

function getAdminApp(): App {
  if (!_app) {
    _app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert({
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
                /\\n/g,
                "\n"
              ),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
  }
  return _app;
}

function getAdminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getAdminApp());
    try {
      _db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings already applied
    }
  }
  return _db;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    return Reflect.get(getAdminDb(), prop);
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return Reflect.get(_auth, prop);
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(getAdminApp());
    return Reflect.get(_storage, prop);
  },
});
