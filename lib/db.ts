import { toDateKey } from '@/lib/dates';
import {
  createId,
  type AccountMode,
  type AppLanguage,
  type Item,
  type ProductRecord,
  type Space,
  type SpaceType,
} from '@/lib/types';

const WEB_KEY = 'expire.local.v1';

type WebDump = {
  settings: Record<string, string>;
  spaces: Space[];
  items: Item[];
  products: ProductRecord[];
};

type SettingKey = 'accountMode' | 'language';

let webStore: WebDump | null = null;

function emptyDump(): WebDump {
  return { settings: {}, spaces: [], items: [], products: [] };
}

function loadWeb(): WebDump {
  if (webStore) return webStore;
  if (typeof localStorage === 'undefined') {
    webStore = emptyDump();
    return webStore;
  }
  try {
    const raw = localStorage.getItem(WEB_KEY);
    webStore = raw ? (JSON.parse(raw) as WebDump) : emptyDump();
    webStore.products ??= [];
  } catch {
    webStore = emptyDump();
  }
  return webStore;
}

function saveWeb() {
  if (!webStore || typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_KEY, JSON.stringify(webStore));
}

export async function getSetting(key: SettingKey): Promise<string | null> {
  return loadWeb().settings[key] ?? null;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  loadWeb().settings[key] = value;
  saveWeb();
}

export async function listSpaces(mode: AccountMode): Promise<Space[]> {
  return loadWeb()
    .spaces.filter((space) => space.accountMode === mode)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listItems(spaceIds: string[]): Promise<Item[]> {
  if (spaceIds.length === 0) return [];
  const idSet = new Set(spaceIds);
  return loadWeb()
    .items.filter((item) => idSet.has(item.spaceId))
    .map((item) => ({
      ...item,
      notes: item.notes ?? null,
      discounted: Boolean(item.discounted),
      discountedOn: item.discountedOn ?? null,
    }));
}

export async function getProduct(barcode: string): Promise<ProductRecord | null> {
  return loadWeb().products.find((product) => product.barcode === barcode) ?? null;
}

export async function upsertProduct(product: ProductRecord): Promise<void> {
  const dump = loadWeb();
  const index = dump.products.findIndex((entry) => entry.barcode === product.barcode);
  if (index >= 0) dump.products[index] = product;
  else dump.products.push(product);
  saveWeb();
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
  loadWeb().items.push(item);
  saveWeb();
  return item;
}

export async function updateItemSpace(itemId: string, spaceId: string): Promise<void> {
  const item = loadWeb().items.find((entry) => entry.id === itemId);
  if (item) item.spaceId = spaceId;
  saveWeb();
}

export async function updateItemNotes(itemId: string, notes: string | null): Promise<void> {
  const item = loadWeb().items.find((entry) => entry.id === itemId);
  if (item) item.notes = notes;
  saveWeb();
}

export async function updateItemDiscounted(itemId: string, discounted: boolean): Promise<void> {
  const item = loadWeb().items.find((entry) => entry.id === itemId);
  if (item) {
    item.discounted = discounted;
    item.discountedOn = discounted ? toDateKey(new Date()) : null;
  }
  saveWeb();
}

export async function deleteSpace(spaceId: string): Promise<void> {
  const dump = loadWeb();
  dump.items = dump.items.filter((item) => item.spaceId !== spaceId);
  dump.spaces = dump.spaces.filter((space) => space.id !== spaceId);
  saveWeb();
}

export async function insertSpace(mode: AccountMode, type: SpaceType, name: string): Promise<Space> {
  const space: Space = {
    id: createId(),
    name,
    type,
    accountMode: mode,
    createdAt: new Date().toISOString(),
  };
  loadWeb().spaces.push(space);
  saveWeb();
  return space;
}

export async function resetLocalData(): Promise<void> {
  webStore = emptyDump();
  saveWeb();
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
