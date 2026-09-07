export type AccountMode = 'family' | 'business';
export type AppLanguage = 'en' | 'nb';

export const STANDARD_SPACE_TYPES = ['freezer', 'warehouse'] as const;
export const FAMILY_SPACE_TYPES = ['fridge', 'freezer', 'pantry'] as const;
export const BUSINESS_SPACE_TYPES = ['warehouse', 'cold_room', 'shop', 'shelf'] as const;

export type StandardSpaceType = (typeof STANDARD_SPACE_TYPES)[number];
export type SpaceType =
  | StandardSpaceType
  | 'fridge'
  | 'pantry'
  | 'cold_room'
  | 'shop'
  | 'shelf'
  | 'custom';

export type Space = {
  id: string;
  name: string;
  type: SpaceType;
  accountMode: AccountMode;
  createdAt: string;
};

export type Item = {
  id: string;
  spaceId: string;
  name: string;
  barcode: string | null;
  imageUri: string | null;
  expiresOn: string | null;
  quantity: number;
  createdAt: string;
};

export type ProductRecord = {
  barcode: string;
  name: string | null;
  imageUri: string | null;
  source: 'off' | 'own';
};

export function spaceTypesFor(_mode?: AccountMode): readonly StandardSpaceType[] {
  return STANDARD_SPACE_TYPES;
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
