import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ErrorText, Field, Muted } from '../components/ui';
import { useAuth } from '../lib/auth';
import { API_URL } from '../lib/config';
import { colors } from '../theme';

/** Accounts created by the API's `npm run seed`, shown in development builds only. */
const DEMO = [
  { email: 'customer@bitebox.dev', label: 'Customer' },
  { email: 'owner@bitebox.dev', label: 'Restaurant owner' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: string, p: string) {
    setBusy(true);
    setError(null);
    try {
      await login(e, p);
      router.replace('/');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>B</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.ink }}>BiteBox</Text>
            <Muted>Food you love, tracked to your door.</Muted>
          </View>
          <Card style={{ gap: 14 }}>
            <ErrorText error={error} />
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" testID="email" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" testID="password" />
            <Button title="Sign in" onPress={() => signIn(email, password)} loading={busy} disabled={!email || !password} testID="sign-in" />
            <Link href="/register" style={{ color: colors.brand, textAlign: 'center', fontWeight: '600' }}>
              New here? Create an account
            </Link>
          </Card>
          {__DEV__ && (
            <Card>
              <Muted small>Local demo accounts (password123) · API {API_URL}</Muted>
              {DEMO.map((d) => (
                <Button key={d.email} title={`Sign in as ${d.label}`} kind="secondary" small onPress={() => signIn(d.email, 'password123')} disabled={busy} />
              ))}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
