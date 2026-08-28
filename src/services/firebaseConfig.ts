import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from '../firebase/app';
import { getFirestore, type Firestore } from '../firebase/firestore';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from '../firebase/auth';
import { getStorage, type FirebaseStorage } from '../firebase/storage';

const env = (import.meta as any).env || {};

export const firebaseConfig: FirebaseOptions = Object.freeze({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'rh-transforma.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'rh-transforma',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'rh-transforma.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:rh-transforma',
});

export function validateFirebaseConfig(): { valid: boolean; missingKeys: string[] } {
  const required = [
    ['VITE_FIREBASE_API_KEY', env.VITE_FIREBASE_API_KEY],
    ['VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN],
    ['VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID],
    ['VITE_FIREBASE_STORAGE_BUCKET', env.VITE_FIREBASE_STORAGE_BUCKET],
    ['VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID],
  ];
  const missingKeys = required.filter(([, value]) => !value).map(([key]) => String(key));
  return { valid: missingKeys.length === 0, missingKeys };
}

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseApp = app;
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
void setPersistence(auth, browserLocalPersistence).catch(() => undefined);

export default app;
