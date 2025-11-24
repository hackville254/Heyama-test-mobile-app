// Socket.IO client for realtime updates on the "/objects" namespace.
// Uses WebSocket transport and explicit reconnection control to support a manual fallback mode.
import { Socket, io } from 'socket.io-client';
import { getApiBase } from './config';

// Singleton promise to ensure only one client instance is created and reused.
let socketPromise: Promise<Socket> | null = null;

// Lazily create and return the Socket.IO client connected to "/objects"
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

// Reset the socket promise so a fresh connection can be attempted later
export function resetSocket() {
  socketPromise = null;
}