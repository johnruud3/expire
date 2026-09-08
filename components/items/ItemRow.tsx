import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDateBlock, formatDateKey, itemUrgency, type Urgency } from '@/lib/dates';
import { colors } from '@/lib/theme';
import type { Item, Space } from '@/lib/types';

const urgencyColor: Record<Urgency, string> = {
  today: colors.today,
  week: colors.week,
  expired: colors.expired,
  later: colors.later,
};

export function ItemRow({
  item,
  language,
  room,
  onPress,
  onPressPhoto,
  onToggleDiscount,
}: {
  item: Item;
  language: string;
  room?: Space;
  onPress: () => void;
  onPressPhoto?: () => void;
  onToggleDiscount?: () => void;
}) {
  const { t } = useTranslation();
  const urgency = itemUrgency(item.expiresOn);
  const block = item.expiresOn ? formatDateBlock(item.expiresOn, language) : null;
  const onYellow = urgency === 'week';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.itemRow, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.dateBlock, { backgroundColor: urgencyColor[urgency] }]}>
        <Text style={[styles.dateDay, { color: onYellow ? colors.ink : colors.white }]}>
          {block?.day ?? '—'}
        </Text>
        <Text style={[styles.dateMonth, { color: onYellow ? colors.ink : colors.white }]}>
          {block?.month ?? ''}
        </Text>
      </View>
      {item.imageUri ? (
        <Pressable
          onPress={onPressPhoto}
          accessibilityRole="imagebutton"
          accessibilityLabel={t('photo.open')}>
          <Image source={{ uri: item.imageUri }} style={styles.thumb} />
        </Pressable>
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.cream }]} />
      )}
      <View style={styles.itemCopy}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          {room?.name ?? '—'}
          {item.expiresOn ? ` · ${formatDateKey(item.expiresOn, language)}` : ''}
          {` · ×${item.quantity}`}
        </Text>
        {item.notes ? (
          <Text style={styles.itemNote} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>
      {onToggleDiscount ? (
        <Pressable
          onPress={onToggleDiscount}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={item.discounted ? t('item.discountedOn') : t('item.discountedOff')}
          style={[
            styles.saleButton,
            {
              backgroundColor: item.discounted ? colors.week : colors.saleSoft,
            },
          ]}>
          <Text style={styles.saleButtonText}>%</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dateBlock: {
    width: 52,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  saleButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  itemNote: {
    fontSize: 13,
    color: colors.ink,
  },
});
