import { knockoutMatchIds } from 'lib/matches';

const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function requireFirebaseConfig() {
  if (!firebaseApiKey || !firebaseProjectId) {
    throw new Error('Missing Firebase config. Set FIREBASE_WEB_API_KEY and FIREBASE_PROJECT_ID.');
  }
}

function normalizePicks(input) {
  if (Array.isArray(input)) {
    return input.reduce((acc, item) => {
      if (item?.matchId) {
        acc[item.matchId] = item.winner || '';
      }
      return acc;
    }, {});
  }

  if (input && typeof input === 'object') {
    return input;
  }

  return {};
}

function hasCompleteBracket(picks) {
  return knockoutMatchIds.every((matchId) => typeof picks[matchId] === 'string' && picks[matchId].trim());
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
    Object.entries(fields).map(([key, raw]) => {
      if (raw.stringValue === undefined) {
        return [key, ''];
      }
      try {
        return [key, JSON.parse(raw.stringValue)];
      } catch {
        return [key, raw.stringValue];
      }
    })
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

async function getFirestoreDoc(collectionName, documentId, idToken) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collectionName}/${documentId}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load Firestore document.');
  }

  const data = await response.json();
  return fromFirestoreFields(data.fields);
}

async function listPredictions(idToken) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'predictions' }],
          orderBy: [{ field: { fieldPath: 'updatedAt' }, direction: 'DESCENDING' }]
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to query Firestore documents.');
  }

  const rows = await response.json();
  return rows.filter((row) => row.document).map((row) => fromFirestoreFields(row.document.fields));
}

export async function GET(request) {
  const idToken = readBearerToken(request);
  if (!idToken) {
    return Response.json({ predictions: [] });
  }

  try {
    requireFirebaseConfig();
    const predictions = await listPredictions(idToken);
    return Response.json({ predictions });
  } catch {
    return Response.json({ predictions: [] });
  }
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const picks = normalizePicks(body.picks);
  const avatar = body.avatar?.trim() || '🙂';
  const idToken = readBearerToken(request);

  if (!name || !hasCompleteBracket(picks)) {
    return Response.json(
      { error: 'Name and complete predictions from Round of 16 through the final winner are required.' },
      { status: 400 }
    );
  }

  if (!idToken) {
    return Response.json({ error: 'Missing auth token. Please login first.' }, { status: 401 });
  }

  try {
    requireFirebaseConfig();
    const uid = await verifyFirebaseToken(idToken);
    const userDoc = await getFirestoreDoc('users', uid, idToken);

    await saveFirestoreDoc('predictions', uid, {
      uid,
      name,
      avatar: userDoc?.avatar || avatar,
      picks
    }, idToken);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not save predictions.' }, { status: 401 });
  }
}
