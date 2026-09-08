import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BarcodeScannerScreen } from '@/components/add/BarcodeScannerModal';
import { PackageDateInput } from '@/components/add/PackageDateInput';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { Screen } from '@/components/ui/Screen';
import { useAccount } from '@/context/AccountContext';
import { isValidDateKey } from '@/lib/dates';
import { lookupOpenFoodFacts, normalizeBarcode } from '@/lib/openFoodFacts';
import { accentFor, accentSoftFor, colors } from '@/lib/theme';

type ImageChoice = 'off' | 'own' | 'saved' | null;
type Step = 'scan' | 'form';

export default function AddScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { accountMode, language, spaces, addItem, lookupSavedProduct } = useAccount();
  const mode = accountMode ?? 'family';
  const accent = accentFor(mode);

  const [step, setStep] = useState<Step>('scan');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? '');
  const [expiresOn, setExpiresOn] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offName, setOffName] = useState<string | null>(null);
  const [offImage, setOffImage] = useState<string | null>(null);
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [ownImage, setOwnImage] = useState<string | null>(null);
  const [imageChoice, setImageChoice] = useState<ImageChoice>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const selectedImage =
    imageChoice === 'off' ? offImage : imageChoice === 'saved' ? savedImage : imageChoice === 'own' ? ownImage : null;
  const offFound = Boolean(offName || offImage);

  useFocusEffect(
    useCallback(() => {
      setStep('scan');
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: colors.paper,
            borderTopColor: colors.line,
          },
        });
      };
    }, [navigation])
  );

  function showForm() {
    setStep('form');
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: colors.paper,
        borderTopColor: colors.line,
      },
    });
  }

  function resetDraft() {
    setBarcode('');
    setName('');
    setQuantity(1);
    setExpiresOn(null);
    setOwnImage(null);
    setOffImage(null);
    setOffName(null);
    setSavedImage(null);
    setImageChoice(null);
    setNotes('');
  }

  async function applyBarcode(raw: string) {
    const clean = normalizeBarcode(raw);
    resetDraft();
    setBarcode(clean);
    showForm();
    if (!clean) return;
    setLookingUp(true);
    try {
      const [off, saved] = await Promise.all([
        lookupOpenFoodFacts(clean, language),
        lookupSavedProduct(clean),
      ]);
      setOffName(off?.name ?? null);
      setOffImage(off?.imageUrl ?? null);
      setSavedImage(saved?.imageUri ?? null);
      if (off?.name) setName(off.name);
      else if (saved?.name) setName(saved.name);
      if (off?.imageUrl) setImageChoice('off');
      else if (saved?.imageUri) setImageChoice('saved');
    } finally {
      setLookingUp(false);
    }
  }

  async function pickOwnPhoto(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('add.photoDeniedTitle'), t('add.photoDeniedBody'));
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
    if (result.canceled || !result.assets[0]?.uri) return;
    setOwnImage(result.assets[0].uri);
    setImageChoice('own');
  }

  async function onSave() {
    if (!spaces.length) {
      router.push('/(tabs)/spaces');
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('add.missingNameTitle'), t('add.missingNameBody'));
      return;
    }
    if (!expiresOn || !isValidDateKey(expiresOn)) {
      Alert.alert(t('add.missingDateTitle'), t('add.missingDateBody'));
      return;
    }
    const cleanBarcode = normalizeBarcode(barcode) || null;
    setSaving(true);
    try {
      await addItem({
        spaceId: spaceId || spaces[0].id,
        name: name.trim(),
        barcode: cleanBarcode,
        imageUri: selectedImage,
        expiresOn,
        quantity,
        notes: notes.trim() || null,
        product: cleanBarcode
          ? {
              barcode: cleanBarcode,
              name: name.trim(),
              imageUri: selectedImage,
              source: imageChoice === 'off' ? 'off' : 'own',
            }
          : null,
      });
      resetDraft();
      router.push('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  if (!spaces.length) {
    return (
      <Screen>
        <Text style={styles.title}>{t('add.title')}</Text>
        <Text style={styles.hint}>
          {mode === 'family' ? t('add.needSpaceFamily') : t('add.needSpaceBusiness')}
        </Text>
        <Pressable onPress={() => router.push('/(tabs)/spaces')} style={[styles.primary, { backgroundColor: accent }]}>
          <Text style={styles.primaryText}>{t('overview.ctaSpaces')}</Text>
        </Pressable>
      </Screen>
    );
  }

  if (step === 'scan') {
    return (
      <BarcodeScannerScreen
        accent={accent}
        onScanned={applyBarcode}
        onSkip={() => {
          resetDraft();
          showForm();
        }}
      />
    );
  }

  return (
    <Screen ref={scrollRef}>
      <Text style={styles.title}>{t('add.title')}</Text>
      {barcode ? <Text style={styles.barcode}>{barcode}</Text> : null}

      {lookingUp ? (
        <View style={styles.card}>
          <ActivityIndicator color={accent} />
          <Text style={styles.hint}>{t('add.lookingUp')}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {selectedImage ? (
            <Pressable
              onPress={() => setPhotoOpen(true)}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('photo.open')}
              style={styles.previewWrap}>
              <Image source={{ uri: selectedImage }} style={styles.preview} />
              <View style={styles.photoHint}>
                <Ionicons name="expand-outline" size={16} color={colors.white} />
              </View>
            </Pressable>
          ) : (
            <View style={[styles.preview, styles.previewEmpty, { backgroundColor: accentSoftFor(mode) }]}>
              <Ionicons name="image-outline" size={28} color={accent} />
            </View>
          )}
          {offFound ? (
            <Text style={styles.hint}>{t('add.offFound')}</Text>
          ) : barcode ? (
            <Text style={styles.hint}>{t('add.offMissingBody')}</Text>
          ) : null}
          <Pressable onPress={() => pickOwnPhoto(true)} style={styles.photoAction}>
            <Ionicons name="camera-outline" size={18} color={accent} />
            <Text style={[styles.photoActionText, { color: accent }]}>
              {offFound ? t('add.useOwn') : t('add.takePhoto')}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>{t('add.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('add.namePlaceholder')}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('add.expires')}</Text>
        <PackageDateInput accent={accent} language={language} onChange={setExpiresOn} />

        <Text style={styles.label}>{t('add.space')}</Text>
        <View style={styles.chips}>
          {spaces.map((space) => {
            const active = (spaceId || spaces[0].id) === space.id;
            return (
              <Pressable
                key={space.id}
                onPress={() => setSpaceId(space.id)}
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

        <View style={styles.qtyRow}>
          <Text style={styles.label}>{t('add.quantity')}</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.stepper}>
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable onPress={() => setQuantity((value) => value + 1)} style={styles.stepper}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.label}>{t('add.notes')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={mode === 'family' ? t('add.notesPlaceholderFamily') : t('add.notesPlaceholderBusiness')}
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.notesInput]}
          multiline
          textAlignVertical="top"
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 280);
          }}
        />
        <Text style={styles.hint}>{t('add.notesHint')}</Text>
      </View>

      <Pressable
        onPress={onSave}
        disabled={saving}
        style={({ pressed }) => [styles.primary, { backgroundColor: accent, opacity: pressed || saving ? 0.85 : 1 }]}>
        <Text style={styles.primaryText}>{saving ? t('add.saving') : t('add.save')}</Text>
      </Pressable>

      <PhotoViewer uri={photoOpen ? selectedImage : null} onClose={() => setPhotoOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.ink,
  },
  barcode: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.cream,
  },
  notesInput: {
    minHeight: 88,
  },
  primary: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  photoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoActionText: {
    fontWeight: '700',
  },
  previewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 160,
  },
  photoHint: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  stepperText: {
    fontSize: 22,
    color: colors.ink,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontWeight: '700',
  },
});
