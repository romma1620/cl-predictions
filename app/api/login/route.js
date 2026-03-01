const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function requireFirebaseConfig() {
  if (!firebaseApiKey || !firebaseProjectId) {
    throw new Error('Missing Firebase config. Set FIREBASE_WEB_API_KEY and FIREBASE_PROJECT_ID.');
  }
}

function firestoreDocUrl(collectionName, documentId) {
  return `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collectionName}/${documentId}`;
}

function toFirebaseEmail(name) {
  const safeName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
  return `${safeName}@cl-predictions.local`;
}

function toFirestoreFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (typeof value === 'string') {
        return [key, { stringValue: value }];
      }
      return [key, { stringValue: JSON.stringify(value) }];
    })
  );
}

function fromFirestoreFields(fields) {
  if (!fields) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, raw]) => [key, raw.stringValue || ''])
  );
}

async function firebaseRequest(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Firebase request failed.');
  }

  return data;
}

async function getFirestoreDoc(collectionName, documentId, idToken) {
  const response = await fetch(firestoreDocUrl(collectionName, documentId), {
    headers: { Authorization: `Bearer ${idToken}` }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load Firestore document.');
  }

  const data = await response.json();
  return fromFirestoreFields(data.fields);
}

async function saveFirestoreDoc(collectionName, documentId, data, idToken) {
  const response = await fetch(firestoreDocUrl(collectionName, documentId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields: toFirestoreFields({ ...data, updatedAt: new Date().toISOString() }) })
  });

  if (!response.ok) {
    throw new Error('Failed to save Firestore document.');
  }
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const password = body.password?.trim();

  if (!name || !password) {
    return Response.json({ error: 'Name and password are required.' }, { status: 400 });
  }

  try {
    requireFirebaseConfig();
    const email = toFirebaseEmail(name);
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;

    let authData;

    try {
      authData = await firebaseRequest(signInUrl, { email, password, returnSecureToken: true });
    } catch (error) {
      if (!String(error.message).includes('EMAIL_NOT_FOUND')) {
        throw error;
      }
      authData = await firebaseRequest(signUpUrl, { email, password, returnSecureToken: true });
    }

    const uid = authData.localId;
    const userDoc = await getFirestoreDoc('users', uid, authData.idToken);
    const avatar = userDoc?.avatar || '';

    await saveFirestoreDoc('users', uid, { uid, name, avatar }, authData.idToken);

    return Response.json({ name, avatar, idToken: authData.idToken });
  } catch (error) {
    return Response.json({ error: error.message || 'Login failed.' }, { status: 401 });
  }
}
