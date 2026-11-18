import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ApiError } from '../lib/api';
import { AuthProvider, useAuth } from '../lib/auth';
import { useNotificationTaps } from '../lib/push';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

/** Tapping a notification opens the relevant screen: the order for customers, the board for owners. */
function NotificationRouter() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);
  useNotificationTaps((data) => {
    if (!user) return;
    if (user.role === 'restaurant_owner' && data.restaurantId) router.push(`/board/${data.restaurantId}`);
    else if (data.orderId) router.push(`/order/${data.orderId}`);
  });
  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationRouter />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.brandInk,
            headerTitleStyle: { color: colors.ink, fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: 'Create account' }} />
          <Stack.Screen name="customer" options={{ headerShown: false }} />
          <Stack.Screen name="owner" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant/[id]" options={{ title: 'Menu' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
          <Stack.Screen name="board/[id]" options={{ title: 'Live orders' }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
