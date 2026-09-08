import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PhotoViewer } from '@/components/ui/PhotoViewer';
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
  const { accountMode, language, items, spaces, moveItem, saveItemNotes, setItemDiscounted } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);
  const item = items.find((entry) => entry.id === id);
  const room = spaces.find((space) => space.id === item?.spaceId);
  const scrollRef = useRef<ScrollView>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(item?.notes ?? '');
  }, [item?.id, item?.notes]);

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
    <Screen ref={scrollRef}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
        <Text style={styles.backText}>{t('item.back')}</Text>
      </Pressable>

      {item.imageUri ? (
        <Pressable
          onPress={() => setPhotoOpen(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel={t('photo.open')}
          style={styles.photoWrap}>
          <Image source={{ uri: item.imageUri }} style={styles.photo} />
          <View style={styles.photoHint}>
            <Ionicons name="expand-outline" size={16} color={colors.white} />
          </View>
        </Pressable>
      ) : (
        <View style={[styles.photo, styles.photoEmpty, { backgroundColor: accentSoftFor(mode) }]}>
          <Ionicons name="image-outline" size={36} color={accent} />
        </View>
      )}

      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.status}>{t(urgencyLabel[urgency])}</Text>

      <Pressable
        onPress={() => void setItemDiscounted(item.id, !item.discounted)}
        style={[
          styles.discountButton,
          item.discounted
            ? { backgroundColor: colors.week, borderColor: colors.week }
            : { backgroundColor: colors.saleSoft, borderColor: colors.ink },
        ]}>
        <View style={[styles.discountIcon, { backgroundColor: item.discounted ? colors.ink : colors.white }]}>
          <Text style={[styles.discountPercent, { color: item.discounted ? colors.week : colors.family }]}>%</Text>
        </View>
        <Text style={[styles.discountLabel, { color: item.discounted ? colors.ink : colors.ink }]}>
          {item.discounted ? t('item.discountedOn') : t('item.discountedOff')}
        </Text>
      </Pressable>

      <View style={styles.card}>
        <InfoRow label={t('add.expires')} value={item.expiresOn ? formatDateKey(item.expiresOn, language) : '—'} />
        <InfoRow label={t('add.quantity')} value={`×${item.quantity}`} />
        {item.barcode ? <InfoRow label={t('item.barcode')} value={item.barcode} /> : null}
        <InfoRow label={t('item.currentRoom')} value={room?.name ?? '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>{t('add.notes')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={mode === 'family' ? t('add.notesPlaceholderFamily') : t('add.notesPlaceholderBusiness')}
          placeholderTextColor={colors.muted}
          style={styles.notesInput}
          multiline
          textAlignVertical="top"
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 280);
          }}
        />
        {notes.trim() !== (item.notes ?? '') ? (
          <Pressable
            onPress={async () => {
              setSavingNotes(true);
              try {
                await saveItemNotes(item.id, notes.trim() || null);
              } finally {
                setSavingNotes(false);
              }
            }}
            disabled={savingNotes}
            style={[styles.saveNotes, { backgroundColor: accent, opacity: savingNotes ? 0.7 : 1 }]}>
            <Text style={styles.saveNotesText}>{t('item.saveNotes')}</Text>
          </Pressable>
        ) : null}
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

      <PhotoViewer uri={photoOpen ? item.imageUri : null} onClose={() => setPhotoOpen(false)} />
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
  photoWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  discountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  discountIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  discountLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
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
  notesInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 88,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.cream,
  },
  saveNotes: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    color: colors.white,
    fontWeight: '700',
  },
});
