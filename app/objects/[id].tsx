// Object detail screen: loads a single object and displays its image and fields.
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getObject, Obj } from '@/services/api';
import { ThemedText } from '@/components/themed-text';

export default function ObjectDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [item, setItem] = useState<Obj | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getObject(id).then(setItem).catch((e) => setError(e.message === '404' ? 'Not found' : 'Failed to load'));
  }, [id]);

  if (error) return <Text style={{ color: 'red', padding: 16 }}>{error}</Text>;
  if (!item) return <Text style={{ padding: 16 }}>Loading…</Text>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
        <ThemedText type="subtitle" style={{ fontSize: 18 }}>{item.title}</ThemedText>
        <ThemedText style={{ color: '#555' }}>{item.description}</ThemedText>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 320, borderRadius: 6 }} contentFit="cover" cachePolicy="disk" transition={200} />
        <ThemedText style={{ color: '#888' }}>{new Date(item.createdAt).toLocaleString()}</ThemedText>
      </View>
    </SafeAreaView>
  );
}