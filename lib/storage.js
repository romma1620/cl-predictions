import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const dataFilePath = join(process.cwd(), 'data', 'store.json');

const defaultData = {
  users: [],
  predictions: []
};

function ensureDataFile() {
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
