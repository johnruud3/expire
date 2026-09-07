import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

type BarcodeScannerScreenProps = {
  accent: string;
  onScanned: (barcode: string) => void;
  onSkip: () => void;
};

export function BarcodeScannerScreen({ accent, onScanned, onSkip }: BarcodeScannerScreenProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionWrap}>
        <Text style={styles.permission}>{t('add.cameraPermission')}</Text>
        <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: accent }]}>
          <Text style={styles.buttonText}>{t('add.allowCamera')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.wrap}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={({ data }) => {
          if (!data || locked.current) return;
          locked.current = true;
          onScanned(data);
        }}
      />
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <Text style={styles.title}>{t('add.scanTitle')}</Text>
        <Text style={styles.hint}>{t('add.scanHint')}</Text>
        <View style={styles.frame} />
        <Pressable onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>{t('add.noBarcode')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
  },
  frame: {
    alignSelf: 'center',
    width: 240,
    height: 160,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: colors.cream,
  },
  permission: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
