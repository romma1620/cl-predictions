import { readStore, writeStore } from 'lib/storage';

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const avatar = body.avatar?.trim();

  if (!name || !avatar) {
    return Response.json({ error: 'Name and avatar are required.' }, { status: 400 });
  }

  const store = readStore();
  const user = store.users.find((entry) => entry.name === name);

  if (!user) {
    return Response.json({ error: 'User not found. Please login first.' }, { status: 404 });
  }

  user.avatar = avatar;
  writeStore(store);

  return Response.json({ name, avatar });
}
