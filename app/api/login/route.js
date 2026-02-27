import { readStore, writeStore } from '@/lib/storage';

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const password = body.password?.trim();

  if (!name || !password) {
    return Response.json({ error: 'Name and password are required.' }, { status: 400 });
  }

  const store = readStore();
  const existingUser = store.users.find((user) => user.name === name);

  if (existingUser && existingUser.password !== password) {
    return Response.json({ error: 'Wrong password for this name.' }, { status: 401 });
  }

  if (!existingUser) {
    store.users.push({
      name,
      password,
      avatar: ''
    });
    writeStore(store);
  }

  return Response.json({ name });
}
