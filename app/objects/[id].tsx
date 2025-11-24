import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getObject, Obj } from '@/services/api';

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
        <Text style={{ fontWeight: '600', fontSize: 18 }}>{item.title}</Text>
        <Text style={{ color: '#555' }}>{item.description}</Text>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 320, borderRadius: 6 }} contentFit="cover" />
        <Text style={{ color: '#888' }}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </SafeAreaView>
  );
}