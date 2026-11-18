import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { api } from './api';

// Show order notifications even while the app is open (as a banner).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

/**
 * Ask for permission, get this device's Expo push token and register it with the API, so
 * BiteBox can notify about orders while the app is closed. Safe to call on every sign-in.
 * Returns null (and does nothing) on simulators, if permission is denied, or before the
 * project is linked to EAS (no projectId yet).
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators/emulators don't get push tokens

    if (Platform.OS === 'android') {
      // Android 13+ only shows the permission prompt once a channel exists.
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C2410C',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push disabled: run "npx eas-cli@latest init" to link the project to EAS.');
      return null;
    }
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
    registeredToken = token;
    return token;
  } catch (err) {
    console.warn('Push registration failed', err);
    return null;
  }
}

/** On sign-out, so a shared phone stops getting the previous user's notifications. */
export async function unregisterPush() {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await api.unregisterDevice(token).catch(() => undefined);
}

export type NotificationData = { orderId?: string; restaurantId?: string; status?: string };

/**
 * Calls back with the order data when the user taps a BiteBox notification — both when the
 * tap launches the app from closed and while it's running. Each tap is handled once.
 */
export function useNotificationTaps(onTap: (data: NotificationData) => void) {
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  const callback = useRef(onTap);
  callback.current = onTap;

  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    callback.current(last.notification.request.content.data as NotificationData);
    Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
  }, [last]);
}
