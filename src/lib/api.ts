import { API_URL } from './config';
import { tokenStorage } from './storage';
import type {
  Cart,
  MenuItem,
  Order,
  OrderStatus,
  PaymentInfo,
  PublicConfig,
  Restaurant,
  User,
} from './types';

/**
 * Typed client for the BiteBox REST API — the same endpoints the web app uses.
 * The token is read from secure storage once and kept in memory afterwards.
 */
let cachedToken: string | null | undefined;

export async function getToken() {
  if (cachedToken === undefined) cachedToken = await tokenStorage.get();
  return cachedToken;
}
export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await tokenStorage.set(token);
  else await tokenStorage.clear();
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;
/** The auth provider registers a callback so an expired token signs the user out. */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Can't reach BiteBox at ${API_URL}. Check your connection.`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const message = Array.isArray(data.message) ? data.message.join('. ') : data.message;
    throw new ApiError(res.status, message || 'Something went wrong');
  }
  return data as T;
}

const get = <T>(p: string) => request<T>('GET', p);
const post = <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {});
const patch = <T>(p: string, b: unknown) => request<T>('PATCH', p, b);
const put = <T>(p: string, b: unknown) => request<T>('PUT', p, b);
const del = <T>(p: string) => request<T>('DELETE', p);

type AuthResponse = { accessToken: string; user: User };

export const api = {
  config: () => get<PublicConfig>('/config'),

  login: (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password }),
  register: (b: { email: string; password: string; fullName: string; role: 'customer' | 'restaurant_owner' }) =>
    post<AuthResponse>('/auth/register', b),
  me: () => get<User>('/auth/me'),

  restaurants: (q?: string) => get<Restaurant[]>(`/restaurants${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  menu: (id: string) => get<{ restaurant: Restaurant; items: MenuItem[] }>(`/restaurants/${id}/menu`),

  cart: () => get<Cart>('/cart'),
  setCartItem: (menuItemId: string, quantity: number, replace = false) =>
    put<Cart>(`/cart/items${replace ? '?replace=true' : ''}`, { menuItemId, quantity }),
  clearCart: () => del<void>('/cart'),

  checkout: (deliveryAddress: string, notes?: string) =>
    post<{ order: Order; payment: PaymentInfo }>('/orders', { deliveryAddress, notes: notes || undefined }),
  myOrders: () => get<Order[]>('/orders'),
  order: (id: string) => get<Order>(`/orders/${id}`),
  paymentSecret: (id: string) => get<PaymentInfo>(`/orders/${id}/payment`),
  cancelOrder: (id: string, reason?: string) => post<Order>(`/orders/${id}/cancel`, { reason }),
  simulatePayment: (id: string, outcome: 'succeeded' | 'failed') =>
    post<Order>(`/dev/payments/${id}/simulate`, { outcome }),

  myRestaurants: () => get<Restaurant[]>('/restaurants/mine'),
  updateRestaurant: (id: string, b: { isOpen?: boolean }) => patch<Restaurant>(`/restaurants/${id}`, b),
  restaurantOrders: (id: string) => get<Order[]>(`/restaurants/${id}/orders?limit=50`),
  setOrderStatus: (orderId: string, status: OrderStatus) => patch<Order>(`/orders/${orderId}/status`, { status }),

  registerDevice: (token: string, platform: 'ios' | 'android') => post<void>('/devices', { token, platform }),
  unregisterDevice: (token: string) => del<void>(`/devices/${encodeURIComponent(token)}`),
};
