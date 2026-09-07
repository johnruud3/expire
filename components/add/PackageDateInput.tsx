import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { dateKeyFromParts, formatDateKey } from '@/lib/dates';
import { colors } from '@/lib/theme';

type PackageDateInputProps = {
  accent: string;
  language: 'en' | 'nb';
  onChange: (dateKey: string | null) => void;
};

export function PackageDateInput({ accent, language, onChange }: PackageDateInputProps) {
  const { t } = useTranslation();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  function emit(nextDay: string, nextMonth: string, nextYear: string) {
    onChange(dateKeyFromParts(nextDay, nextMonth, nextYear));
  }

  const preview = dateKeyFromParts(day, month, year);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.caption}>{t('add.dateDay')}</Text>
          <TextInput
            value={day}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 2);
              setDay(next);
              emit(next, month, year);
              if (next.length === 2) monthRef.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="07"
            placeholderTextColor={colors.muted}
            style={[styles.box, { borderColor: accent }]}
            returnKeyType="next"
          />
        </View>
        <Text style={styles.dot}>.</Text>
        <View style={styles.field}>
          <Text style={styles.caption}>{t('add.dateMonth')}</Text>
          <TextInput
            ref={monthRef}
            value={month}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 2);
              setMonth(next);
              emit(day, next, year);
              if (next.length === 2) yearRef.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="09"
            placeholderTextColor={colors.muted}
            style={[styles.box, { borderColor: accent }]}
            returnKeyType="next"
          />
        </View>
        <Text style={styles.dot}>.</Text>
        <View style={[styles.field, styles.yearField]}>
          <Text style={styles.caption}>{t('add.dateYear')}</Text>
          <TextInput
            ref={yearRef}
            value={year}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 4);
              setYear(next);
              emit(day, month, next);
            }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="2026"
            placeholderTextColor={colors.muted}
            style={[styles.box, { borderColor: accent }]}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        {preview ? formatDateKey(preview, language) : t('add.dateFromPackage')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  yearField: {
    flex: 1.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  box: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: colors.cream,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  dot: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.muted,
    paddingBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
  },
});
