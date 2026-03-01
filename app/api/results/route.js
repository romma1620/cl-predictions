import { adminDb } from 'lib/firebase-admin';
import { knockoutMatchIds } from 'lib/matches';

export async function GET() {
  try {
    const doc = await adminDb.collection('results').doc('current').get();
    const results = doc.exists ? doc.data() : {};
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to load results.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.password !== process.env.RESULTS_PASSWORD) {
      return Response.json({ error: 'Invalid password.' }, { status: 403 });
    }

    const picks = body.picks || {};
    const sanitized = {};
    for (const id of knockoutMatchIds) {
      if (picks[id]) {
        sanitized[id] = picks[id];
      }
    }

    await adminDb.collection('results').doc('current').set(sanitized, { merge: true });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to save results.' }, { status: 500 });
  }
}
