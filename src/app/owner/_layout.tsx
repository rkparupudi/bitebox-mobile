import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Loading } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => (
  <Ionicons name={name} color={color as string} size={size} />
);

export default function OwnerTabs() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'restaurant_owner') return <Redirect href="/" />;
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
      <Tabs.Screen name="index" options={{ title: 'My restaurants', tabBarIcon: icon('storefront-outline') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
