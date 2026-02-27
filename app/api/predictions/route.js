import { readStore, writeStore } from '@/lib/storage';

export async function GET() {
  const store = readStore();
  const usersByName = Object.fromEntries(store.users.map((user) => [user.name, user]));

  const predictions = store.predictions.map((entry) => ({
    ...entry,
    avatar: usersByName[entry.name]?.avatar || '🙂'
  }));

  return Response.json({ predictions });
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const picks = Array.isArray(body.picks) ? body.picks : [];

  if (!name || picks.length !== 8) {
    return Response.json({ error: 'Name and all 8 predictions are required.' }, { status: 400 });
  }

  const store = readStore();
  const user = store.users.find((entry) => entry.name === name);

  if (!user) {
    return Response.json({ error: 'User not found. Please login first.' }, { status: 404 });
  }

  const prediction = {
    name,
    picks,
    updatedAt: new Date().toISOString()
  };

  const index = store.predictions.findIndex((entry) => entry.name === name);

  if (index >= 0) {
    store.predictions[index] = prediction;
  } else {
    store.predictions.push(prediction);
  }

  writeStore(store);

  return Response.json({ ok: true, prediction });
}
