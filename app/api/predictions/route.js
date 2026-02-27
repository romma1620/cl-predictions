import { knockoutMatchIds } from '@/lib/matches';
import { readStore, writeStore } from '@/lib/storage';

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

export async function GET() {
  const store = readStore();
  const usersByName = Object.fromEntries(store.users.map((user) => [user.name, user]));

  const predictions = store.predictions.map((entry) => ({
    ...entry,
    picks: normalizePicks(entry.picks),
    avatar: usersByName[entry.name]?.avatar || '🙂'
  }));

  return Response.json({ predictions });
}

export async function POST(request) {
  const body = await request.json();
  const name = body.name?.trim();
  const picks = normalizePicks(body.picks);

  if (!name || !hasCompleteBracket(picks)) {
    return Response.json(
      { error: 'Name and complete predictions from Round of 16 through the final winner are required.' },
      { status: 400 }
    );
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
