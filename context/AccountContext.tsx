import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  deleteSpace as removeSpace,
  getProduct,
  insertItem,
  insertSpace,
  listItems,
  listSpaces,
  loadAppState,
  resetLocalData,
  setSetting,
  updateItemSpace,
  upsertProduct,
} from '@/lib/db';
import { deviceLanguage } from '@/lib/i18n';
import type { AccountMode, AppLanguage, Item, ProductRecord, Space, SpaceType } from '@/lib/types';

type AccountContextValue = {
  ready: boolean;
  accountMode: AccountMode | null;
  language: AppLanguage;
  spaces: Space[];
  items: Item[];
  chooseAccount: (mode: AccountMode) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  addSpace: (type: SpaceType, name?: string) => Promise<void>;
  deleteSpace: (spaceId: string) => Promise<void>;
  addItem: (input: {
    spaceId: string;
    name: string;
    barcode: string | null;
    imageUri: string | null;
    expiresOn: string | null;
    quantity: number;
    product?: ProductRecord | null;
  }) => Promise<void>;
  lookupSavedProduct: (barcode: string) => Promise<ProductRecord | null>;
  moveItem: (itemId: string, spaceId: string) => Promise<void>;
  startOver: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [ready, setReady] = useState(false);
  const [accountMode, setAccountMode] = useState<AccountMode | null>(null);
  const [language, setLanguageState] = useState<AppLanguage>(deviceLanguage());
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const refresh = useCallback(async (mode: AccountMode | null) => {
    if (!mode) {
      setSpaces([]);
      setItems([]);
      return;
    }
    const nextSpaces = await listSpaces(mode);
    setSpaces(nextSpaces);
    setItems(await listItems(nextSpaces.map((space) => space.id)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await loadAppState();
      if (cancelled) return;
      const nextLanguage = state.language ?? deviceLanguage();
      setAccountMode(state.accountMode);
      setLanguageState(nextLanguage);
      await i18n.changeLanguage(nextLanguage);
      if (state.accountMode) {
        const existing = await listSpaces(state.accountMode);
        if (existing.length === 0) {
          await insertSpace(state.accountMode, 'freezer', i18n.t('spaceTypes.freezer'));
          await insertSpace(state.accountMode, 'warehouse', i18n.t('spaceTypes.warehouse'));
        }
      }
      await refresh(state.accountMode);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n, refresh]);

  const chooseAccount = useCallback(
    async (mode: AccountMode) => {
      await setSetting('accountMode', mode);
      setAccountMode(mode);
      const existing = await listSpaces(mode);
      if (existing.length === 0) {
        await insertSpace(mode, 'freezer', t('spaceTypes.freezer'));
        await insertSpace(mode, 'warehouse', t('spaceTypes.warehouse'));
      }
      await refresh(mode);
    },
    [refresh, t]
  );

  const changeLanguage = useCallback(async (next: AppLanguage) => {
    await setSetting('language', next);
    setLanguageState(next);
    await i18n.changeLanguage(next);
  }, [i18n]);

  const addSpace = useCallback(
    async (type: SpaceType, customName?: string) => {
      if (!accountMode) return;
      const trimmed = customName?.trim();
      if (type === 'custom') {
        if (!trimmed) return;
        await insertSpace(accountMode, 'custom', trimmed);
      } else {
        const existing = spaces.filter((space) => space.type === type).length;
        const label = t(`spaceTypes.${type}`);
        const name = trimmed ?? (existing === 0 ? label : `${label} ${existing + 1}`);
        await insertSpace(accountMode, type, name);
      }
      await refresh(accountMode);
    },
    [accountMode, refresh, spaces, t]
  );

  const deleteSpace = useCallback(
    async (spaceId: string) => {
      if (!accountMode) return;
      await removeSpace(spaceId);
      await refresh(accountMode);
    },
    [accountMode, refresh]
  );

  const addItem = useCallback(
    async (input: {
      spaceId: string;
      name: string;
      barcode: string | null;
      imageUri: string | null;
      expiresOn: string | null;
      quantity: number;
      product?: ProductRecord | null;
    }) => {
      if (!accountMode) return;
      await insertItem(input);
      if (input.product) {
        await upsertProduct(input.product);
      }
      await refresh(accountMode);
    },
    [accountMode, refresh]
  );

  const lookupSavedProduct = useCallback(async (barcode: string) => getProduct(barcode), []);

  const moveItem = useCallback(
    async (itemId: string, spaceId: string) => {
      if (!accountMode) return;
      await updateItemSpace(itemId, spaceId);
      await refresh(accountMode);
    },
    [accountMode, refresh]
  );

  const startOver = useCallback(async () => {
    await resetLocalData();
    setAccountMode(null);
    setSpaces([]);
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      accountMode,
      language,
      spaces,
      items,
      chooseAccount,
      setLanguage: changeLanguage,
      addSpace,
      deleteSpace,
      addItem,
      lookupSavedProduct,
      moveItem,
      startOver,
    }),
    [ready, accountMode, language, spaces, items, chooseAccount, changeLanguage, addSpace, deleteSpace, addItem, lookupSavedProduct, moveItem, startOver]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return value;
}
