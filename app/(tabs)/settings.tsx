import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { accentFor, colors } from '@/lib/theme';
import type { AppLanguage } from '@/lib/types';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { accountMode, language, setLanguage, startOver } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);

  async function onStartOver() {
    await startOver();
    router.replace('/onboarding');
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('appName')}</Text>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.section}>{t('settings.language')}</Text>
        <View style={styles.row}>
          <LangButton
            label={t('settings.norwegian')}
            active={language === 'nb'}
            accent={accent}
            onPress={() => setLanguage('nb')}
          />
          <LangButton
            label={t('settings.english')}
            active={language === 'en'}
            accent={accent}
            onPress={() => setLanguage('en')}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>{t('settings.account')}</Text>
        <Text style={[styles.accountType, { color: accent }]}>
          {mode === 'family' ? t('settings.family') : t('settings.business')}
        </Text>
        <Text style={styles.hint}>{t('settings.accountLocked')}</Text>
        <Text style={styles.hint}>{t('settings.comingSoon')}</Text>
      </View>

      <Pressable onPress={onStartOver} style={({ pressed }) => [styles.startOver, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={styles.startOverText}>{t('settings.startOver')}</Text>
        <Text style={styles.startOverHint}>{t('settings.startOverHint')}</Text>
      </Pressable>
    </Screen>
  );
}

function LangButton({
  label,
  active,
  accent,
  onPress,
}: {
  label: string;
  active: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.lang,
        {
          backgroundColor: active ? accent : colors.cream,
          borderColor: active ? accent : colors.line,
        },
      ]}>
      <Text style={[styles.langText, { color: active ? colors.white : colors.ink }]}>{label}</Text>
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
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  section: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  lang: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  langText: {
    fontWeight: '700',
  },
  accountType: {
    fontSize: 22,
    fontWeight: '700',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  startOver: {
    paddingVertical: 8,
    gap: 4,
  },
  startOverText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.today,
  },
  startOverHint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
