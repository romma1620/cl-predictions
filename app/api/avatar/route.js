const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function requireFirebaseConfig() {
  if (!firebaseApiKey || !firebaseProjectId) {
    throw new Error('Missing Firebase config. Set FIREBASE_WEB_API_KEY and FIREBASE_PROJECT_ID.');
  }
}

function readBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}

async function verifyFirebaseToken(idToken) {
  const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
  const response = await fetch(lookupUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  const data = await response.json().catch(() => ({}));
  const user = data.users?.[0];

  if (!response.ok || !user?.localId) {
    throw new Error('Invalid auth token. Please login again.');
  }

  return user.localId;
}

function toFirestoreFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, { stringValue: String(value) }])
  );
}

async function saveFirestoreDoc(collectionName, documentId, data, idToken) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collectionName}/${documentId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ fields: toFirestoreFields({ ...data, updatedAt: new Date().toISOString() }) })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to save Firestore document.');
  }
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const avatar = body.avatar?.trim();
  const idToken = readBearerToken(request);

  if (!name || !avatar) {
    return Response.json({ error: 'Name and avatar are required.' }, { status: 400 });
  }

  if (!idToken) {
    return Response.json({ error: 'Missing auth token. Please login again.' }, { status: 401 });
  }

  try {
    requireFirebaseConfig();
    const uid = await verifyFirebaseToken(idToken);

    await saveFirestoreDoc('users', uid, {
      uid,
      name,
      avatar
    }, idToken);

    return Response.json({ name, avatar });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not save avatar.' }, { status: 401 });
  }
}
