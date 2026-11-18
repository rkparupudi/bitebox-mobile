import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color as string} size={size} />
);

export default function CustomerTabs() {
  const { user, loading } = useAuth();
  const cart = useQuery({ queryKey: ['cart'], queryFn: api.cart, enabled: user?.role === 'customer' });
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'customer') return <Redirect href="/" />;
  const count = cart.data?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.ink, fontWeight: '800' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Restaurants', tabBarIcon: icon('restaurant-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt-outline') }} />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Cart', tabBarIcon: icon('bag-outline'), tabBarBadge: count || undefined, tabBarBadgeStyle: { backgroundColor: colors.brand } }}
      />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
