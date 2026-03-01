import { knockoutMatchIds } from 'lib/matches';
import { adminAuth, adminDb } from 'lib/firebase-admin';

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

async function verifyToken(request) {
  const idToken = readBearerToken(request);
  if (!idToken) {
    return null;
  }

  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return { uid: decodedToken.uid, idToken };
}

export async function GET(request) {
  try {
    const auth = await verifyToken(request);
    if (!auth) {
      return Response.json({ predictions: [] });
    }

    const snapshot = await adminDb.collection('predictions').orderBy('updatedAt', 'desc').get();
    const predictions = snapshot.docs.map((doc) => doc.data());
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

  if (!name || !hasCompleteBracket(picks)) {
    return Response.json(
      { error: 'Name and complete predictions from Round of 16 through the final winner are required.' },
      { status: 400 }
    );
  }

  try {
    const auth = await verifyToken(request);
    if (!auth) {
      return Response.json({ error: 'Missing auth token. Please login first.' }, { status: 401 });
    }

    const userRef = adminDb.collection('users').doc(auth.uid);
    const userDoc = await userRef.get();

    await adminDb.collection('predictions').doc(auth.uid).set(
      {
        uid: auth.uid,
        name,
        avatar: userDoc.exists ? userDoc.data()?.avatar || avatar : avatar,
        picks,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not save predictions.' }, { status: 401 });
  }
}
