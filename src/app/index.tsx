import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Loading } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';

/** Entry point: send each person to their part of the app. */
export default function Index() {
  const { user, loading, logout } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (user.role === 'customer') return <Redirect href="/customer" />;
  if (user.role === 'restaurant_owner') return <Redirect href="/owner" />;
  // Admins work in the web console; the phone app is for customers and restaurants.
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>Admin tools are on the web</Text>
      <Text style={{ color: colors.muted }}>Open the BiteBox web console to manage orders and restaurants.</Text>
      <Button title="Sign out" kind="secondary" onPress={logout} />
    </View>
  );
}
