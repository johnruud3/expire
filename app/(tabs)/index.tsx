import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ItemRow } from '@/components/items/ItemRow';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { itemUrgency } from '@/lib/dates';
import { accentFor, accentSoftFor, colors } from '@/lib/theme';

export default function OverviewScreen() {
  const { t } = useTranslation();
  const { accountMode, language, items, spaces, setItemDiscounted } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const activeFilter =
    roomFilter === 'all' || spaces.some((space) => space.id === roomFilter) ? roomFilter : 'all';

  const visibleItems =
    activeFilter === 'all' ? items : items.filter((item) => item.spaceId === activeFilter);

  const counts = { today: 0, week: 0, expired: 0, later: 0 };
  for (const item of visibleItems) {
    counts[itemUrgency(item.expiresOn)] += 1;
  }

  const sorted = [...visibleItems].sort((a, b) => {
    const order = { expired: 0, today: 1, week: 2, later: 3 };
    const urgencyDiff = order[itemUrgency(a.expiresOn)] - order[itemUrgency(b.expiresOn)];
    if (urgencyDiff !== 0) return urgencyDiff;
    return (a.expiresOn ?? '').localeCompare(b.expiresOn ?? '');
  });

  const hero = heroCopy(counts, mode, t);

  return (
    <Screen>
      <Text style={styles.eyebrow}>
        {mode === 'family' ? t('overview.familyEyebrow') : t('overview.businessEyebrow')}
      </Text>
      <Text style={styles.hero}>{hero.title}</Text>
      {hero.detail ? <Text style={styles.heroDetail}>{hero.detail}</Text> : null}

      {spaces.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterChip
            label={t('overview.filterAll')}
            active={activeFilter === 'all'}
            accent={accent}
            soft={accentSoftFor(mode)}
            onPress={() => setRoomFilter('all')}
          />
          {spaces.map((space) => (
            <FilterChip
              key={space.id}
              label={space.name}
              active={activeFilter === space.id}
              accent={accent}
              soft={accentSoftFor(mode)}
              onPress={() => setRoomFilter(space.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {mode === 'family' ? t('overview.emptyFamily') : t('overview.emptyBusiness')}
          </Text>
          <Pressable
            onPress={() => router.push(spaces.length ? '/(tabs)/add' : '/(tabs)/spaces')}
            style={({ pressed }) => [styles.cta, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.ctaText}>{spaces.length ? t('overview.ctaAdd') : t('overview.ctaSpaces')}</Text>
          </Pressable>
        </View>
      ) : visibleItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('overview.filterEmpty')}</Text>
        </View>
      ) : (
        sorted.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            language={language}
            room={spaces.find((space) => space.id === item.spaceId)}
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
            onPressPhoto={item.imageUri ? () => setPhotoUri(item.imageUri) : undefined}
            onToggleDiscount={() => void setItemDiscounted(item.id, !item.discounted)}
          />
        ))
      )}

      <PhotoViewer uri={photoUri} onClose={() => setPhotoUri(null)} />
    </Screen>
  );
}

function heroCopy(
  counts: { today: number; week: number; expired: number; later: number },
  mode: 'family' | 'business',
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const prefix = mode === 'family' ? 'overview.heroFamily' : 'overview.heroBusiness';
  if (counts.expired > 0) {
    return {
      title: t(`${prefix}.expired`, { count: counts.expired }),
      detail: t('overview.heroRest', { today: counts.today, week: counts.week }),
    };
  }
  if (counts.today > 0) {
    return {
      title: t(`${prefix}.today`, { count: counts.today }),
      detail: counts.week > 0 ? t('overview.heroWeekExtra', { count: counts.week }) : null,
    };
  }
  if (counts.week > 0) {
    return { title: t(`${prefix}.week`, { count: counts.week }), detail: null };
  }
  if (counts.later > 0) {
    return { title: t(`${prefix}.fine`), detail: t('overview.heroLater', { count: counts.later }) };
  }
  return { title: t(`${prefix}.empty`), detail: null };
}

function FilterChip({
  label,
  active,
  accent,
  soft,
  onPress,
}: {
  label: string;
  active: boolean;
  accent: string;
  soft: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          borderColor: active ? accent : colors.line,
          backgroundColor: active ? soft : colors.paper,
        },
      ]}>
      <Text style={[styles.filterText, { color: active ? accent : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
    fontWeight: '700',
  },
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: colors.ink,
  },
  heroDetail: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: 4,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterText: {
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 16,
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
