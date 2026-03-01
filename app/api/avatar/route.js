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
  const avatar = body.avatar?.trim();
  const idToken = readBearerToken(request);

  if (!name || !avatar || !idToken) {
    return Response.json({ error: 'Name, avatar and auth token are required.' }, { status: 400 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    await adminDb.collection('users').doc(uid).set(
      {
        uid,
        name,
        avatar,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return Response.json({ name, avatar });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not save avatar.' }, { status: 401 });
  }
}
