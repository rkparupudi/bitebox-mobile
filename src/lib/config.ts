import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the BiteBox API lives.
 *
 * 1. EXPO_PUBLIC_API_URL wins if set (production and preview builds set it in eas.json).
 * 2. In development, a phone can't reach "localhost" on your laptop. Expo already knows your
 *    laptop's LAN address (it's how the phone loads the JavaScript), so we reuse that host
 *    with the API's port: e.g. http://192.168.1.20:3000. Phone and laptop must share Wi-Fi.
 * 3. Web and the iOS simulator can use localhost directly.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const port = process.env.EXPO_PUBLIC_API_PORT ?? '3000';
  if (Platform.OS === 'web') return `http://localhost:${port}`;

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${port}`;

  // Android emulator's alias for the host machine; iOS simulator shares the Mac's network.
  return Platform.OS === 'android' ? `http://10.0.2.2:${port}` : `http://localhost:${port}`;
}

export const API_URL = resolveApiUrl();
