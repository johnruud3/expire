import * as SQLite from 'expo-sqlite';

import {
  createId,
  type AccountMode,
  type AppLanguage,
  type Item,
  type ProductRecord,
  type Space,
  type SpaceType,
} from '@/lib/types';
import { toDateKey } from '@/lib/dates';

type SettingKey = 'accountMode' | 'language';

let sqlite: SQLite.SQLiteDatabase | null = null;
let opening: Promise<SQLite.SQLiteDatabase> | null = null;

async function getSqlite() {
  if (sqlite) return sqlite;
  opening ??= (async () => {
    const db = await SQLite.openDatabaseAsync('expire.db');
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      account_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      household_id TEXT,
      organization_id TEXT
    );
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      space_id TEXT NOT NULL,
      name TEXT NOT NULL,
      barcode TEXT,
      image_uri TEXT,
      expires_on TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      discounted INTEGER NOT NULL DEFAULT 0,
      discounted_on TEXT,
      created_at TEXT NOT NULL,
      household_id TEXT,
      organization_id TEXT,
      FOREIGN KEY (space_id) REFERENCES spaces(id)
    );
    CREATE TABLE IF NOT EXISTS products (
      barcode TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      image_uri TEXT,
      source TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
    await migrateItems(db);
    sqlite = db;
    return db;
  })();
  try {
    return await opening;
  } catch (error) {
    opening = null;
    throw error;
  }
}

async function migrateItems(db: SQLite.SQLiteDatabase) {
  await addItemColumn(db, 'notes', 'ALTER TABLE items ADD COLUMN notes TEXT');
  await addItemColumn(db, 'discounted', 'ALTER TABLE items ADD COLUMN discounted INTEGER NOT NULL DEFAULT 0');
  await addItemColumn(db, 'discounted_on', 'ALTER TABLE items ADD COLUMN discounted_on TEXT');
}

async function addItemColumn(db: SQLite.SQLiteDatabase, name: string, sql: string) {
  const columns = await db.getAllAsync<Record<string, unknown>>('PRAGMA table_info(items)');
  const exists = columns.some((column) => String(column.name ?? column.NAME ?? '') === name);
  if (exists) return;
  try {
    await db.execAsync(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column/i.test(message)) throw error;
  }
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  const db = await getSqlite();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const db = await getSqlite();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export async function listSpaces(mode: AccountMode): Promise<Space[]> {
  const db = await getSqlite();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    type: SpaceType;
    account_mode: AccountMode;
    created_at: string;
  }>(
    'SELECT id, name, type, account_mode, created_at FROM spaces WHERE account_mode = ? ORDER BY created_at ASC',
    mode
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    accountMode: row.account_mode,
    createdAt: row.created_at,
  }));
}

export async function listItems(spaceIds: string[]): Promise<Item[]> {
  if (spaceIds.length === 0) return [];
  const db = await getSqlite();
  const placeholders = spaceIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{
    id: string;
    space_id: string;
    name: string;
    barcode: string | null;
    image_uri: string | null;
    expires_on: string | null;
    quantity: number;
    notes: string | null;
    discounted: number | null;
    discounted_on: string | null;
    created_at: string;
  }>(
    `SELECT id, space_id, name, barcode, image_uri, expires_on, quantity, notes, discounted, discounted_on, created_at FROM items WHERE space_id IN (${placeholders})`,
    ...spaceIds
  );
  return rows.map((row) => ({
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    barcode: row.barcode,
    imageUri: row.image_uri,
    expiresOn: row.expires_on,
    quantity: row.quantity,
    notes: row.notes,
    discounted: Boolean(row.discounted),
    discountedOn: row.discounted_on,
    createdAt: row.created_at,
  }));
}

export async function getProduct(barcode: string): Promise<ProductRecord | null> {
  const db = await getSqlite();
  const row = await db.getFirstAsync<{
    barcode: string;
    name: string | null;
    image_uri: string | null;
    source: 'off' | 'own';
  }>('SELECT barcode, name, image_uri, source FROM products WHERE barcode = ?', barcode);
  if (!row) return null;
  return {
    barcode: row.barcode,
    name: row.name,
    imageUri: row.image_uri,
    source: row.source,
  };
}

export async function upsertProduct(product: ProductRecord): Promise<void> {
  const db = await getSqlite();
  await db.runAsync(
    `INSERT INTO products (barcode, name, image_uri, source, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET
       name = excluded.name,
       image_uri = excluded.image_uri,
       source = excluded.source,
       updated_at = excluded.updated_at`,
    product.barcode,
    product.name,
    product.imageUri,
    product.source,
    new Date().toISOString()
  );
}

export async function insertItem(input: {
  spaceId: string;
  name: string;
  barcode: string | null;
  imageUri: string | null;
  expiresOn: string | null;
  quantity: number;
  notes: string | null;
}): Promise<Item> {
  const item: Item = {
    id: createId(),
    spaceId: input.spaceId,
    name: input.name,
    barcode: input.barcode,
    imageUri: input.imageUri,
    expiresOn: input.expiresOn,
    quantity: input.quantity,
    notes: input.notes,
    discounted: false,
    discountedOn: null,
    createdAt: new Date().toISOString(),
  };
  const db = await getSqlite();
  await db.runAsync(
    'INSERT INTO items (id, space_id, name, barcode, image_uri, expires_on, quantity, notes, discounted, discounted_on, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    item.id,
    item.spaceId,
    item.name,
    item.barcode,
    item.imageUri,
    item.expiresOn,
    item.quantity,
    item.notes,
    0,
    null,
    item.createdAt
  );
  return item;
}

export async function updateItemSpace(itemId: string, spaceId: string): Promise<void> {
  const db = await getSqlite();
  await db.runAsync('UPDATE items SET space_id = ? WHERE id = ?', spaceId, itemId);
}

export async function updateItemNotes(itemId: string, notes: string | null): Promise<void> {
  const db = await getSqlite();
  await db.runAsync('UPDATE items SET notes = ? WHERE id = ?', notes, itemId);
}

export async function updateItemDiscounted(itemId: string, discounted: boolean): Promise<void> {
  const db = await getSqlite();
  await db.runAsync(
    'UPDATE items SET discounted = ?, discounted_on = ? WHERE id = ?',
    discounted ? 1 : 0,
    discounted ? toDateKey(new Date()) : null,
    itemId
  );
}

export async function deleteSpace(spaceId: string): Promise<void> {
  const db = await getSqlite();
  await db.runAsync('DELETE FROM items WHERE space_id = ?', spaceId);
  await db.runAsync('DELETE FROM spaces WHERE id = ?', spaceId);
}

export async function insertSpace(mode: AccountMode, type: SpaceType, name: string): Promise<Space> {
  const space: Space = {
    id: createId(),
    name,
    type,
    accountMode: mode,
    createdAt: new Date().toISOString(),
  };
  const db = await getSqlite();
  await db.runAsync(
    'INSERT INTO spaces (id, name, type, account_mode, created_at) VALUES (?, ?, ?, ?, ?)',
    space.id,
    space.name,
    space.type,
    space.accountMode,
    space.createdAt
  );
  return space;
}

export async function resetLocalData(): Promise<void> {
  const db = await getSqlite();
  await db.execAsync(`
    DELETE FROM items;
    DELETE FROM products;
    DELETE FROM spaces;
    DELETE FROM settings;
  `);
}

export async function loadAppState(): Promise<{
  accountMode: AccountMode | null;
  language: AppLanguage | null;
}> {
  const [accountMode, language] = await Promise.all([getSetting('accountMode'), getSetting('language')]);
  return {
    accountMode: accountMode === 'family' || accountMode === 'business' ? accountMode : null,
    language: language === 'en' || language === 'nb' ? language : null,
  };
}
