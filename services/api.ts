// HTTP services for Objects feature. Each call resolves the API base dynamically
// to support different platforms (Android emulator, iOS simulator, physical devices).
import { getApiBase } from './config';

// Object shape returned by the API
export type Obj = { _id: string; title: string; description: string; imageUrl: string; createdAt: string };

// GET /objects – returns the full list of objects
export async function listObjects(): Promise<Obj[]> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects`);
  if (!r.ok) throw new Error('Failed to list objects');
  return r.json();
}

// GET /objects/:id – returns a single object
export async function getObject(id: string): Promise<Obj> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects/${id}`);
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to get object');
  return r.json();
}

// POST /objects/upload-url – presigned URL for S3/MinIO upload
export async function getUploadUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string; key: string }>{
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!r.ok) throw new Error('Failed to get upload URL');
  return r.json();
}

// POST /objects – create a new object after uploading the image
export async function createObject(input: { title: string; description: string; imageUrl: string }): Promise<Obj> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error('Failed to create object');
  return r.json();
}

// DELETE /objects/:id – delete an object by id
export async function deleteObject(id: string): Promise<void> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects/${id}`, { method: 'DELETE' });
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to delete');
}