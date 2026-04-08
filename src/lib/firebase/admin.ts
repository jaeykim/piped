import {
  initializeApp,
  getApps,
  cert,
  getApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

// We still use Firebase Auth for ID token verification — the rest of the
// data layer (Firestore, Storage) was migrated to Postgres + local disk.

let _app: App | undefined;
let _auth: Auth | undefined;

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
          });
  }
  return _app;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getAdminApp());
    return Reflect.get(_auth, prop);
  },
});
