import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function getCredentials() {
  if (clientEmail && privateKey && projectId) {
    return cert({
      projectId,
      clientEmail,
      privateKey
    });
  }

  return applicationDefault();
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: getCredentials(),
      projectId
    });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
