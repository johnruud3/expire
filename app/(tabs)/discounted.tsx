import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ItemRow } from '@/components/items/ItemRow';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { formatSaleDay, itemUrgency, toDateKey } from '@/lib/dates';
import { accentFor, colors } from '@/lib/theme';
import type { Item } from '@/lib/types';

export default function DiscountedScreen() {
  const { t } = useTranslation();
  const { accountMode, language, items, spaces, setItemDiscounted } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const groups = groupBySaleDay(
    items.filter((item) => item.discounted)
  );

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('appName')}</Text>
      <Text style={styles.title}>{t('discounted.title')}</Text>
      <Text style={styles.hint}>{t('discounted.hint')}</Text>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('discounted.empty')}</Text>
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.day} style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>
                {formatSaleDay(group.day, language, {
                  today: t('discounted.today'),
                  yesterday: t('discounted.yesterday'),
                })}
              </Text>
              <View style={styles.dayLine} />
            </View>
            {group.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                language={language}
                room={spaces.find((space) => space.id === item.spaceId)}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                onPressPhoto={item.imageUri ? () => setPhotoUri(item.imageUri) : undefined}
                onToggleDiscount={() => void setItemDiscounted(item.id, !item.discounted)}
              />
            ))}
          </View>
        ))
      )}

      {groups.length === 0 ? (
        <Pressable
          onPress={() => router.push('/(tabs)')}
          style={({ pressed }) => [styles.cta, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}>
          <Text style={styles.ctaText}>{t('discounted.cta')}</Text>
        </Pressable>
      ) : null}

      <PhotoViewer uri={photoUri} onClose={() => setPhotoUri(null)} />
    </Screen>
  );
}

function saleDay(item: Item) {
  return item.discountedOn ?? item.expiresOn ?? toDateKey(new Date(item.createdAt));
}

function groupBySaleDay(items: Item[]) {
  const buckets = new Map<string, Item[]>();
  for (const item of items) {
    const day = saleDay(item);
    const list = buckets.get(day) ?? [];
    list.push(item);
    buckets.set(day, list);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, groupItems]) => ({
      day,
      items: groupItems.sort((a, b) => {
        const order = { expired: 0, today: 1, week: 2, later: 3 };
        const urgencyDiff = order[itemUrgency(a.expiresOn)] - order[itemUrgency(b.expiresOn)];
        if (urgencyDiff !== 0) return urgencyDiff;
        return (a.expiresOn ?? '').localeCompare(b.expiresOn ?? '');
      }),
    }));
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  dayGroup: {
    gap: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  dayLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.line,
  },
  empty: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
