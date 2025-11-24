Voici une explication claire de ce que fait l’UI web et comment réaliser exactement la même chose en React Native. L’objectif est que le développeur mobile implémente une expérience identique: création d’objet avec upload image (S3 présigné), liste avec images, détail d’un objet, temps réel via Socket.IO avec fallback manuel HTTP.

**Vue d’ensemble**
- L’app consomme une API REST sur `http://localhost:3000` (possible fallback `http://localhost:3001`).
- Flux d’upload en 3 étapes: obtenir URL présignée, PUT binaire vers S3/MinIO, POST de l’objet avec `imageUrl` public.
- Temps réel: Socket.IO sur le namespace `/objects` avec événements `objects.created` et `objects.deleted`. Si le socket ne connecte pas, l’UI passe en “mode manuel” et propose rafraîchissement HTTP + réessai WebSocket.
- Images: affichées via l’URL publique S3/MinIO.

**Base URL et environnement mobile**
- Éviter `localhost` sur appareil/emulateur:
  - Android Emulator: `http://10.0.2.2:3000`
  - iOS Simulator: `http://localhost:3000` marche généralement
  - Appareil physique: utiliser l’IP locale du PC (ex: `http://192.168.1.50:3000`)
- Recommander une variable env (Expo):
  - `EXPO_PUBLIC_API_BASE=http://10.0.2.2:3000`

**Flux API**
- List Objects: `GET /objects` → array d’objets `{ _id, title, description, imageUrl, createdAt }`
- Get Object: `GET /objects/:id` → un objet
- Presigned URL: `POST /objects/upload-url` avec `{ filename, contentType }` → retourne `{ uploadUrl, publicUrl, key }`
- Upload S3: `PUT <uploadUrl>` avec header `Content-Type: ...` et corps binaire
- Create Object: `POST /objects` avec `{ title, description, imageUrl }`
- Delete Object: `DELETE /objects/:id`

**Temps réel Socket.IO**
- Connexion: `io(API_BASE + '/objects', { transports: ['websocket'], timeout: 2000, reconnection: false })`
- Événements:
  - `objects.created` reçoit l’objet complet → insérer en tête de la liste
  - `objects.deleted` reçoit `{ id }` → filtrer la liste
- Fallback manuel:
  - Si le socket échoue (timeout / `connect_error`), basculer un état `manualMode = true`; afficher bannière jaune “Mode manuel” avec:
    - Bouton “Rafraîchir” (HTTP GET `/objects`)
    - Bouton “Réessayer WebSocket” (recréer la connexion)

**Architecture recommandée (RN)**
- `services/api.ts`: appels HTTP (list/get/upload-url/create/delete)
- `services/socket.ts`: initialisation socket + gestion des événements
- Écrans:
  - `ObjectsListScreen`: liste, suppression, temps réel + fallback manuel
  - `NewObjectScreen`: formulaire + upload S3 présigné + création
  - `ObjectDetailScreen`: détail d’un objet
- State: hooks React + éventuellement React Query ou Zustand pour cache/invalidations

**Exemples de code (RN)**
- Base API et helpers
```ts
// services/api.ts
const BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000';

export type Obj = { _id: string; title: string; description: string; imageUrl: string; createdAt: string };

export async function listObjects(): Promise<Obj[]> {
  const r = await fetch(`${BASE}/objects`);
  if (!r.ok) throw new Error('Failed to list objects');
  return r.json();
}

export async function getObject(id: string): Promise<Obj> {
  const r = await fetch(`${BASE}/objects/${id}`);
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to get object');
  return r.json();
}

export async function getUploadUrl(filename: string, contentType: string) {
  const r = await fetch(`${BASE}/objects/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!r.ok) throw new Error('Failed to get upload URL');
  return r.json() as Promise<{ uploadUrl: string; publicUrl: string; key: string }>;
}

export async function createObject(input: { title: string; description: string; imageUrl: string }): Promise<Obj> {
  const r = await fetch(`${BASE}/objects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error('Failed to create object');
  return r.json();
}

export async function deleteObject(id: string): Promise<void> {
  const r = await fetch(`${BASE}/objects/${id}`, { method: 'DELETE' });
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to delete');
}
```

- Upload S3 depuis RN
  - Expo:
```ts
// services/upload.ts (Expo)
import * as FileSystem from 'expo-file-system';

export async function putToS3(uploadUrl: string, fileUri: string, contentType: string) {
  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (res.status !== 200) throw new Error(`Upload failed: ${res.status}`);
}
```
  - Bare RN (lib conseillée):
```ts
// services/upload.ts (Bare RN)
import RNFetchBlob from 'rn-fetch-blob';

export async function putToS3(uploadUrl: string, fileUri: string, contentType: string) {
  const res = await RNFetchBlob.fetch('PUT', uploadUrl, { 'Content-Type': contentType }, RNFetchBlob.wrap(fileUri));
  if (res.info().status !== 200) throw new Error('Upload failed');
}
```

- Socket.IO
```ts
// services/socket.ts
import { io, Socket } from 'socket.io-client';
const BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000';

let socket: Socket | null = null;
export function getSocket() {
  if (!socket) {
    socket = io(`${BASE}/objects`, { transports: ['websocket'], timeout: 2000, reconnection: false });
  }
  return socket;
}
export function resetSocket() { socket?.disconnect(); socket = null; }
```

- Liste avec temps réel + fallback
```tsx
// ObjectsListScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, FlatList, Image, TouchableOpacity } from 'react-native';
import { listObjects, deleteObject, Obj } from './services/api';
import { getSocket, resetSocket } from './services/socket';

export default function ObjectsListScreen({ navigation }) {
  const [items, setItems] = useState<Obj[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  async function initialLoad() {
    setLoading(true);
    try {
      const data = await listObjects();
      setItems(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally { setLoading(false); }
  }

  useEffect(() => { initialLoad(); }, []);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;
    const timer = setTimeout(() => { if (!s.connected) setManualMode(true); }, 2000);
    s.on('objects.created', (obj: Obj) => setItems(prev => [obj, ...prev]));
    s.on('objects.deleted', ({ id }: { id: string }) => setItems(prev => prev.filter(i => i._id !== id)));
    s.on('connect', () => setManualMode(false));
    s.on('connect_error', () => setManualMode(true));
    return () => { clearTimeout(timer); s.off('objects.created'); s.off('objects.deleted'); s.off('connect'); s.off('connect_error'); };
  }, []);

  async function onDelete(id: string) {
    await deleteObject(id);
    setItems(prev => prev.filter(i => i._id !== id));
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {manualMode && (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#facc15', backgroundColor: '#fef9c3' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', marginRight: 8 }} />
          <Text style={{ flex: 1 }}>Mode manuel: WebSocket indisponible. Utilisez le rafraîchissement HTTP.</Text>
          <Button title="Rafraîchir" onPress={initialLoad} />
          <Button title="Réessayer" onPress={() => { resetSocket(); setManualMode(false); }} />
        </View>
      )}
      {loading ? <Text>Loading…</Text> : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => (
            <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12, padding: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>{item.title}</Text>
              <Text style={{ color: '#555', marginBottom: 8 }}>{item.description}</Text>
              <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 160, borderRadius: 6 }} resizeMode="cover" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ObjectDetail', { id: item._id })}><Text>View</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item._id)}><Text style={{ color: 'red' }}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
```

- Création avec upload S3
```tsx
// NewObjectScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // ou react-native-image-picker
import { getUploadUrl, createObject } from './services/api';
import { putToS3 } from './services/upload';

export default function NewObjectScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      navigation.replace('ObjectDetail', { id: created._id });
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} multiline style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
      <Button title="Choisir une image" onPress={pickImage} />
      {file && <Text style={{ marginTop: 6 }}>{file.name}</Text>}
      {error && <Text style={{ color: 'red', marginTop: 6 }}>{error}</Text>}
      <Button title={submitting ? 'Uploading…' : 'Créer'} onPress={onSubmit} disabled={submitting} />
    </View>
  );
}
```

- Détail d’un objet
```tsx
// ObjectDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { getObject, Obj } from './services/api';

export default function ObjectDetailScreen({ route }) {
  const { id } = route.params as { id: string };
  const [item, setItem] = useState<Obj | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getObject(id).then(setItem).catch((e) => setError(e.message === '404' ? 'Not found' : 'Failed to load'));
  }, [id]);

  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;
  if (!item) return <Text>Loading…</Text>;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: '600', fontSize: 18 }}>{item.title}</Text>
      <Text style={{ color: '#555', marginVertical: 8 }}>{item.description}</Text>
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 320, borderRadius: 6 }} resizeMode="cover" />
      <Text style={{ color: '#888', marginTop: 8 }}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );
}
```

**Pièges et bonnes pratiques**
- Réseau local:
  - Android Emulator: `10.0.2.2` pour atteindre le port de la machine hôte.
  - iOS Simulator: `localhost` fonctionne souvent.
  - Appareil physique: IP locale du PC + firewall ouvert.
- Upload S3:
  - Utiliser Expo `uploadAsync` ou `RNFetchBlob` pour envoyer du binaire avec `PUT` et `Content-Type` correct.
- Fallback manuel:
  - Ne pas relancer en boucle `reconnection`; exposer un indicateur clair + actions explicites pour l’utilisateur.
- Sécurité:
  - Ne jamais logguer de secrets; les URL présignées expirent et ne doivent pas être conservées.

