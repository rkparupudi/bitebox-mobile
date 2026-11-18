import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Muted, Screen, styles } from './ui';
import { useAuth } from '../lib/auth';
import { API_URL } from '../lib/config';

export function AccountScreen() {
  const { user, logout } = useAuth();
  return (
    <Screen>
      <Card>
        <Text style={styles.h2}>{user?.fullName ?? user?.email}</Text>
        <Muted>{user?.email}</Muted>
        <Muted small>{user?.role === 'restaurant_owner' ? 'Restaurant owner' : 'Customer'}</Muted>
      </Card>
      <Button
        title="Sign out"
        kind="danger"
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
      />
      {__DEV__ && <Muted small>Connected to {API_URL}</Muted>}
    </Screen>
  );
}
