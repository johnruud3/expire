import { forwardRef, useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export const Screen = forwardRef<ScrollView, ScreenProps>(function Screen(
  { children, scroll = true, style },
  ref
) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => setKeyboardHeight(event.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.content, style]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={ref}
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {children}
        {keyboardHeight > 0 ? <View style={{ height: keyboardHeight + 120 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
});
