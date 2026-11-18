import * as SecureStore from 'expo-secure-store';

/**
 * The access token is kept in the platform's secure storage (iOS Keychain / Android
 * Keystore-backed EncryptedSharedPreferences), not in plain AsyncStorage.
 * The web build uses storage.web.ts instead.
 */
const KEY = 'bitebox.token';

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token: string) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
