import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listObjects, deleteObject, Obj } from '@/services/api';
import { getSocket, resetSocket } from '@/services/socket';
import type { Socket } from 'socket.io-client';

export default function ObjectsListScreen() {
  const [items, setItems] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  async function initialLoad() {
    setLoading(true);
    setError(null);
    try {
      const data = await listObjects();
      setItems(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const s = await getSocket();
      if (!mounted) return;
      socketRef.current = s;
      timer = setTimeout(() => { if (!s.connected) setManualMode(true); }, 2000);
      s.on('objects.created', (obj: Obj) => setItems(prev => [obj, ...prev]));
      s.on('objects.deleted', ({ id }: { id: string }) => setItems(prev => prev.filter(i => i._id !== id)));
      s.on('connect', () => setManualMode(false));
      s.on('connect_error', () => setManualMode(true));
    })();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      const s = socketRef.current;
      if (s) {
        s.off('objects.created');
        s.off('objects.deleted');
        s.off('connect');
        s.off('connect_error');
      }
    };
  }, []);

  async function retryWebSocket() {
    resetSocket();
    setManualMode(false);
    const s = await getSocket();
    socketRef.current = s;
    s.on('objects.created', (obj: Obj) => setItems(prev => [obj, ...prev]));
    s.on('objects.deleted', ({ id }: { id: string }) => setItems(prev => prev.filter(i => i._id !== id)));
    s.on('connect', () => setManualMode(false));
    s.on('connect_error', () => setManualMode(true));
  }

  async function onDelete(id: string) {
    await deleteObject(id);
    setItems(prev => prev.filter(i => i._id !== id));
  }

  async function onRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const data = await listObjects();
      setItems(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      setError('Failed to load');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Objects</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Refresh" onPress={initialLoad} />
            <Link href="/objects/new" asChild>
              <TouchableOpacity style={styles.createBtn}><Text style={styles.createBtnText}>New</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
        {manualMode && (
          <View style={styles.banner}>
            <View style={styles.dot} />
            <Text style={styles.bannerText}>Mode manuel: WebSocket indisponible. Utilisez le rafraîchissement HTTP.</Text>
            <Button title="Rafraîchir" onPress={initialLoad} />
            <Button title="Réessayer" onPress={retryWebSocket} />
          </View>
        )}
        {loading ? (
          <View style={styles.center}> 
            <ActivityIndicator />
            <Text style={styles.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}> 
            <Text style={styles.error}>Failed to load</Text>
            <Button title="Retry" onPress={initialLoad} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}> 
            <Text style={styles.muted}>No objects yet</Text>
            <Link href="/objects/new" asChild>
              <TouchableOpacity style={styles.createBtn}><Text style={styles.createBtnText}>Create one</Text></TouchableOpacity>
            </Link>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it._id}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit="cover" />
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/objects/[id]', params: { id: item._id } })}><Text style={styles.link}>View</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item._id)}><Text style={styles.delete}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontWeight: '600', fontSize: 18 },
  createBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 6 },
  createBtnText: { color: 'white' },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#facc15', backgroundColor: '#fef9c3', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  bannerText: { flex: 1 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12, padding: 12 },
  cardTitle: { fontWeight: '600', marginBottom: 4 },
  cardDesc: { color: '#555', marginBottom: 8 },
  cardImage: { width: '100%', height: 160, borderRadius: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  delete: { color: 'red' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 24 },
  muted: { color: '#687076' },
  error: { color: 'red' },
  link: { color: '#2563eb' },
});