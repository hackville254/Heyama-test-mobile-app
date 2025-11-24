import { getApiBase } from './config';

export type Obj = { _id: string; title: string; description: string; imageUrl: string; createdAt: string };

export async function listObjects(): Promise<Obj[]> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects`);
  if (!r.ok) throw new Error('Failed to list objects');
  return r.json();
}

export async function getObject(id: string): Promise<Obj> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects/${id}`);
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to get object');
  return r.json();
}

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

export async function deleteObject(id: string): Promise<void> {
  const BASE = await getApiBase();
  const r = await fetch(`${BASE}/objects/${id}`, { method: 'DELETE' });
  if (r.status === 404) throw new Error('404');
  if (!r.ok) throw new Error('Failed to delete');
}