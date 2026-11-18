import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { API_URL, } from './config';
import { getToken } from './api';
import type { OrderUpdate } from './types';

/**
 * One Socket.IO connection to the same /orders namespace the web app uses.
 * Mobile specifics:
 *  - The OS suspends sockets in the background, so we disconnect when the app is
 *    backgrounded (push notifications cover that time) and reconnect + refetch on return.
 *  - WebSocket-only transport: no sticky sessions needed behind a load balancer.
 */
let socket: Socket | null = null;
let socketToken: string | null = null;

async function ensureSocket(): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(`${API_URL}/orders`, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export function useOrderUpdates(onUpdate?: (u: OrderUpdate) => void) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const handler = useRef(onUpdate);
  handler.current = onUpdate;

  useEffect(() => {
    let s: Socket | null = null;
    let cancelled = false;
    const onConnect = () => {
      setConnected(true);
      // Anything could have changed while we were disconnected.
      queryClient.invalidateQueries();
    };
    const onDisconnect = () => setConnected(false);
    const onOrder = (u: OrderUpdate) => {
      queryClient.invalidateQueries({ queryKey: ['order', u.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', u.restaurantId] });
      handler.current?.(u);
    };

    ensureSocket().then((sock) => {
      if (cancelled || !sock) return;
      s = sock;
      setConnected(sock.connected);
      sock.on('connect', onConnect);
      sock.on('disconnect', onDisconnect);
      sock.on('order.updated', onOrder);
    });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') s?.connect();
      else if (state === 'background') s?.disconnect();
    });

    return () => {
      cancelled = true;
      sub.remove();
      s?.off('connect', onConnect);
      s?.off('disconnect', onDisconnect);
      s?.off('order.updated', onOrder);
    };
  }, [queryClient]);

  return connected;
}
