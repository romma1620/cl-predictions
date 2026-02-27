import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const localDataFilePath = join(process.cwd(), 'data', 'store.json');
const runtimeDataFilePath = process.env.STORE_PATH || '/tmp/cl-predictions-store.json';

function resolveDataFilePath() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return runtimeDataFilePath;
  }

  return localDataFilePath;
}

const dataFilePath = resolveDataFilePath();

const defaultData = {
  users: [],
  predictions: []
};

function ensureDataFile() {
  const targetDir = dirname(dataFilePath);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  if (!existsSync(dataFilePath)) {
    writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
  }
}

export function readStore() {
  ensureDataFile();
  try {
    const raw = readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

export function writeStore(data) {
  writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}
