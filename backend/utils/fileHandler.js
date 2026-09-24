import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'db', 'db.json');

/**
 * Read the entire database
 */
export async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error.message);
    throw new Error('Failed to read database');
  }
}

/**
 * Write the entire database
 */
export async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error.message);
    throw new Error('Failed to write database');
  }
}

/**
 * Get all items from a collection
 */
export async function getAll(collection) {
  const db = await readDB();
  return db[collection] || [];
}

/**
 * Get a single item by ID
 */
export async function getById(collection, id) {
  const db = await readDB();
  const items = db[collection] || [];
  return items.find((item) => item.id === id) || null;
}

/**
 * Create a new item
 */
export async function create(collection, item) {
  const db = await readDB();
  if (!db[collection]) db[collection] = [];
  db[collection].push(item);
  await writeDB(db);
  return item;
}

/**
 * Update an item
 */
export async function update(collection, id, updates) {
  const db = await readDB();
  const items = db[collection] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await writeDB(db);
  return items[index];
}

/**
 * Delete an item
 */
export async function remove(collection, id) {
  const db = await readDB();
  const items = db[collection] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  await writeDB(db);
  return true;
}