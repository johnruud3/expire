import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { AccountMode, SpaceType } from '@/lib/types';

export const colors = {
  cream: '#F4EFE6',
  paper: '#FFFCF6',
  ink: '#1A2A22',
  muted: '#5C6B63',
  line: '#E4DDD0',
  family: '#2F6B4F',
  familySoft: '#DCE8E1',
  business: '#1E4D6B',
  businessSoft: '#D7E4ED',
  today: '#C2413B',
  week: '#F5C400',
  later: '#2F6B4F',
  expired: '#7F1D1D',
  white: '#FFFFFF',
  add: '#1E5A8A',
  saleSoft: '#E8F6EC',
};

export function accentFor(mode: AccountMode) {
  return mode === 'family' ? colors.family : colors.business;
}

export function accentSoftFor(mode: AccountMode) {
  return mode === 'family' ? colors.familySoft : colors.businessSoft;
}

export function spaceIcon(type: SpaceType): ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'fridge':
      return 'cube-outline';
    case 'freezer':
      return 'snow-outline';
    case 'pantry':
      return 'file-tray-stacked-outline';
    case 'warehouse':
      return 'business-outline';
    case 'cold_room':
      return 'thermometer-outline';
    case 'shop':
      return 'storefront-outline';
    case 'shelf':
    case 'custom':
      return 'grid-outline';
  }
}
