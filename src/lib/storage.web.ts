// Web build (used for quick testing in a browser): SecureStore isn't available, so use localStorage.
const KEY = 'bitebox.token';

export const tokenStorage = {
  get: async () => localStorage.getItem(KEY),
  set: async (token: string) => localStorage.setItem(KEY, token),
  clear: async () => localStorage.removeItem(KEY),
};
