import { Socket, io } from 'socket.io-client';
import { getApiBase } from './config';

let socketPromise: Promise<Socket> | null = null;

export async function getSocket(): Promise<Socket> {
  if (!socketPromise) {
    socketPromise = (async () => {
      const base = await getApiBase();
      const url = base.endsWith('/') ? base + 'objects' : base + '/objects';
      const s = io(url, { transports: ['websocket'], autoConnect: true, timeout: 2000, reconnection: false });
      return s;
    })();
  }
  return socketPromise;
}

export function resetSocket() {
  socketPromise = null;
}