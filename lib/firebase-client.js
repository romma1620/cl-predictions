import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_WEB_API_KEY;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!firebaseApiKey || !firebaseProjectId) {
  throw new Error('Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: firebaseApiKey,
      projectId: firebaseProjectId,
      authDomain: `${firebaseProjectId}.firebaseapp.com`
    });

export const firebaseAuth = getAuth(app);
