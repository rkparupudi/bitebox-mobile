// The browser build (used for quick testing) has no native push; these are no-ops.
export async function registerForPush(): Promise<string | null> {
  return null;
}
export async function unregisterPush() {}
export type NotificationData = { orderId?: string; restaurantId?: string; status?: string };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useNotificationTaps(_onTap: (data: NotificationData) => void) {}
