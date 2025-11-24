import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { getUploadUrl, createObject } from '@/services/api';
import { putToS3 } from '@/services/upload';
import { useRouter } from 'expo-router';

export default function NewObjectScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !!file && !submitting;
  const theme = useColorScheme() ?? 'light';
  const textColor = Colors[theme].text;
  const borderColor = theme === 'dark' ? '#2a2d31' : '#d1d5db';
  const inputBg = theme === 'dark' ? '#1f2326' : '#ffffff';
  const placeholder = theme === 'dark' ? '#9BA1A6' : '#687076';

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) {
      const asset = res.assets[0];
      setFile({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' });
    }
  }

  async function onSubmit() {
    if (!file) { setError('Sélectionnez une image'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const presign = await getUploadUrl(file.name, file.type);
      await putToS3(presign.uploadUrl, file.uri, file.type);
      const created = await createObject({ title, description, imageUrl: presign.publicUrl });
      router.replace({ pathname: '/objects/[id]', params: { id: created._id } });
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
          <TextInput
            placeholder="Title"
            placeholderTextColor={placeholder}
            value={title}
            onChangeText={setTitle}
            style={{ borderWidth: 1, borderColor, backgroundColor: inputBg, color: textColor, padding: 12, borderRadius: 8 }}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
          <TextInput
            placeholder="Description"
            placeholderTextColor={placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ borderWidth: 1, borderColor, backgroundColor: inputBg, color: textColor, padding: 12, borderRadius: 8, minHeight: 100 }}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={onSubmit}
          />
          <Button title="Choisir une image" onPress={pickImage} />
          {file && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ color: textColor }}>{file.name}</Text>
              <Image source={{ uri: file.uri }} style={{ width: '100%', height: 200, borderRadius: 6, marginTop: 6 }} contentFit="cover" />
            </View>
          )}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {submitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator />
              <Text style={{ color: textColor }}>Uploading…</Text>
            </View>
          ) : (
            <Button title="Créer" onPress={onSubmit} disabled={!canSubmit} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}