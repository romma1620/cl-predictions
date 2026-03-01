import { adminAuth, adminDb } from 'lib/firebase-admin';

function readBearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const idToken = readBearerToken(request);

  if (!name || !idToken) {
    return Response.json({ error: 'Name and auth token are required.' }, { status: 400 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const existing = await userRef.get();
    const avatar = existing.exists ? existing.data()?.avatar || '' : '';

    await userRef.set(
      {
        uid,
        name,
        avatar,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return Response.json({ name, avatar, idToken });
  } catch (error) {
    return Response.json({ error: error.message || 'Login failed.' }, { status: 401 });
  }
}
