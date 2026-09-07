import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { accentFor, accentSoftFor, colors } from '@/lib/theme';
import type { AccountMode } from '@/lib/types';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { accountMode, chooseAccount } = useAccount();
  const [selected, setSelected] = useState<AccountMode | null>(null);
  const [saving, setSaving] = useState(false);

  if (accountMode) {
    return <Redirect href="/(tabs)" />;
  }

  async function onContinue() {
    if (!selected || saving) return;
    setSaving(true);
    await chooseAccount(selected);
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('onboarding.eyebrow')}</Text>
      <Text style={styles.title}>{t('onboarding.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

      <AccountCard
        mode="family"
        icon="home-outline"
        title={t('onboarding.familyTitle')}
        body={t('onboarding.familyBody')}
        selected={selected === 'family'}
        onPress={() => setSelected('family')}
      />
      <AccountCard
        mode="business"
        icon="briefcase-outline"
        title={t('onboarding.businessTitle')}
        body={t('onboarding.businessBody')}
        selected={selected === 'business'}
        onPress={() => setSelected('business')}
      />

      <Pressable
        onPress={onContinue}
        disabled={!selected || saving}
        style={({ pressed }) => [
          styles.continue,
          {
            backgroundColor: selected ? accentFor(selected) : colors.line,
            opacity: pressed && selected ? 0.9 : 1,
          },
        ]}>
        <Text style={[styles.continueText, { color: selected ? colors.white : colors.muted }]}>
          {t('onboarding.continue')}
        </Text>
      </Pressable>
    </Screen>
  );
}

function AccountCard({
  mode,
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  mode: AccountMode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = accentFor(mode);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && { borderColor: accent, backgroundColor: accentSoftFor(mode) },
        pressed && { opacity: 0.92 },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: accentSoftFor(mode) }]}>
        <Ionicons name={icon} size={26} color={accent} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  continue: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
