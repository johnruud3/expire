import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { colors } from '@/lib/theme';

type PhotoViewerProps = {
  uri: string | null;
  onClose: () => void;
};

export function PhotoViewer({ uri, onClose }: PhotoViewerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(uri)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable
        style={styles.root}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('photo.close')}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : null}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('photo.close')}
          style={[styles.close, { top: insets.top + 8 }]}>
          <Ionicons name="close" size={28} color={colors.white} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
