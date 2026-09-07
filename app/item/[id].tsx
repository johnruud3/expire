import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { formatDateKey, itemUrgency } from '@/lib/dates';
import { accentFor, accentSoftFor, colors } from '@/lib/theme';

const urgencyLabel = {
  expired: 'overview.expired',
  today: 'overview.today',
  week: 'overview.thisWeek',
  later: 'overview.later',
} as const;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { accountMode, language, items, spaces, moveItem } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);
  const item = items.find((entry) => entry.id === id);
  const room = spaces.find((space) => space.id === item?.spaceId);

  if (!item) {
    return (
      <Screen>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={styles.backText}>{t('item.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('item.missing')}</Text>
      </Screen>
    );
  }

  const urgency = itemUrgency(item.expiresOn);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
        <Text style={styles.backText}>{t('item.back')}</Text>
      </Pressable>

      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoEmpty, { backgroundColor: accentSoftFor(mode) }]}>
          <Ionicons name="image-outline" size={36} color={accent} />
        </View>
      )}

      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.status}>{t(urgencyLabel[urgency])}</Text>

      <View style={styles.card}>
        <InfoRow label={t('add.expires')} value={item.expiresOn ? formatDateKey(item.expiresOn, language) : '—'} />
        <InfoRow label={t('add.quantity')} value={`×${item.quantity}`} />
        {item.barcode ? <InfoRow label={t('item.barcode')} value={item.barcode} /> : null}
        <InfoRow label={t('item.currentRoom')} value={room?.name ?? '—'} />
      </View>

      <Text style={styles.label}>{t('item.move')}</Text>
      <View style={styles.chips}>
        {spaces.map((space) => {
          const active = space.id === item.spaceId;
          return (
            <Pressable
              key={space.id}
              onPress={() => {
                if (!active) void moveItem(item.id, space.id);
              }}
              style={[
                styles.chip,
                {
                  borderColor: active ? accent : colors.line,
                  backgroundColor: active ? accentSoftFor(mode) : colors.paper,
                },
              ]}>
              <Text style={[styles.chipText, { color: active ? accent : colors.ink }]}>{space.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.ink,
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontWeight: '700',
  },
});
