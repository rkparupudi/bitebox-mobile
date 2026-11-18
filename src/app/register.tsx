import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, ErrorText, Field, Row, Screen } from '../components/ui';
import { useAuth } from '../lib/auth';

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Row style={{ gap: 8 }}>
          <Button small kind={role === 'customer' ? 'primary' : 'secondary'} title="I want to order" onPress={() => setRole('customer')} />
          <Button small kind={role === 'restaurant_owner' ? 'primary' : 'secondary'} title="I run a restaurant" onPress={() => setRole('restaurant_owner')} />
        </Row>
        <ErrorText error={error} />
        <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password (at least 8 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <Button
          title="Create account"
          loading={busy}
          disabled={!fullName || !email || password.length < 8}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await register({ fullName, email: email.trim().toLowerCase(), password, role });
              router.replace('/');
            } catch (err) {
              setError(err);
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
    </Screen>
  );
}
