import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { accentFor, accentSoftFor, colors, spaceIcon } from '@/lib/theme';
import { STANDARD_SPACE_TYPES, type Space } from '@/lib/types';

export default function SpacesScreen() {
  const { t } = useTranslation();
  const { accountMode, spaces, items, addSpace, deleteSpace } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);
  const [newRoom, setNewRoom] = useState('');

  async function createCustomRoom() {
    const name = newRoom.trim();
    if (!name) return;
    await addSpace('custom', name);
    setNewRoom('');
  }

  function confirmDelete(space: Space, count: number) {
    Alert.alert(
      t('spaces.deleteTitle', { name: space.name }),
      count > 0 ? t('spaces.deleteWithItems', { count }) : t('spaces.deleteEmpty'),
      [
        { text: t('spaces.cancel'), style: 'cancel' },
        {
          text: t('spaces.delete'),
          style: 'destructive',
          onPress: () => {
            void deleteSpace(space.id);
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('appName')}</Text>
      <Text style={styles.title}>{t('spaces.title')}</Text>
      <Text style={styles.hint}>{t('spaces.hint')}</Text>

      {spaces.map((space) => {
        const count = items.filter((item) => item.spaceId === space.id).length;
        return (
          <View key={space.id} style={styles.spaceCard}>
            <View style={[styles.iconWrap, { backgroundColor: accentSoftFor(mode) }]}>
              <Ionicons name={spaceIcon(space.type)} size={22} color={accent} />
            </View>
            <View style={styles.spaceCopy}>
              <Text style={styles.spaceName}>{space.name}</Text>
              <Text style={styles.spaceMeta}>{t('spaces.count', { count })}</Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(space, count)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('spaces.deleteTitle', { name: space.name })}
              style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}>
              <Ionicons name="trash-outline" size={20} color={colors.expired} />
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.addLabel}>{t('spaces.standard')}</Text>
      <View style={styles.chips}>
        {STANDARD_SPACE_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => addSpace(type)}
            style={({ pressed }) => [styles.chip, { borderColor: accent, opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name={spaceIcon(type)} size={16} color={accent} />
            <Text style={[styles.chipText, { color: accent }]}>{t(`spaceTypes.${type}`)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.addLabel}>{t('spaces.newRoom')}</Text>
      <View style={styles.createRow}>
        <TextInput
          value={newRoom}
          onChangeText={setNewRoom}
          placeholder={t('spaces.newRoomPlaceholder')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={createCustomRoom}
        />
        <Pressable
          onPress={createCustomRoom}
          style={[styles.createButton, { backgroundColor: accent, opacity: newRoom.trim() ? 1 : 0.5 }]}>
          <Text style={styles.createText}>{t('spaces.create')}</Text>
        </Pressable>
      </View>
    </Screen>
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
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceCopy: {
    flex: 1,
    gap: 2,
  },
  spaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  spaceMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.paper,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 14,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  createButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  createText: {
    color: colors.white,
    fontWeight: '700',
  },
});
