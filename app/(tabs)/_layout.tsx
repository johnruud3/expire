import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAccount } from '@/context/AccountContext';
import { accentFor, colors } from '@/lib/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { accountMode } = useAccount();

  if (!accountMode) {
    return <Redirect href="/onboarding" />;
  }

  const accent = accentFor(accountMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.overview'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discounted"
        options={{
          title: t('tabs.discounted'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tabs.add'),
          tabBarShowLabel: false,
          tabBarButton: (props) => (
            <AddTabButton
              onPress={props.onPress as never}
              accessibilityState={props.accessibilityState}
              label={t('tabs.add')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="spaces"
        options={{
          title: t('tabs.spaces'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function AddTabButton({
  onPress,
  accessibilityState,
  label,
}: {
  onPress?: (...args: never[]) => void;
  accessibilityState?: { selected?: boolean };
  label: string;
}) {
  const selected = Boolean(accessibilityState?.selected);

  return (
    <Pressable
      onPress={onPress as never}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.addWrap, { opacity: pressed ? 0.88 : 1 }]}>
      <View style={[styles.addFab, selected ? styles.addFabSelected : null]}>
        <Ionicons name="scan-outline" size={26} color={colors.white} />
      </View>
      <Text style={styles.addLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addWrap: {
    flex: 1,
    alignItems: 'center',
    top: -14,
  },
  addFab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.add,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.add,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  addFabSelected: {
    transform: [{ scale: 1.04 }],
  },
  addLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.add,
  },
});
