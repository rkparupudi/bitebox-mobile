import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
import { Card, Empty, ErrorText, Muted, Pill, Screen, styles, TileArt } from '../../components/ui';
import { api } from '../../lib/api';
import { colors } from '../../theme';

export default function Restaurants() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);
  const list = useQuery({ queryKey: ['restaurants', q], queryFn: () => api.restaurants(q) });

  return (
    <Screen onRefresh={() => list.refetch()} refreshing={list.isRefetching}>
      <TextInput
        placeholder="Search restaurants"
        placeholderTextColor="#A39A92"
        value={input}
        onChangeText={setInput}
        style={styles.input}
        autoCorrect={false}
      />
      <ErrorText error={list.error} />
      {list.data?.length === 0 && <Empty text={q ? `No restaurants match "${q}".` : 'No restaurants yet.'} />}
      {list.data?.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/restaurant/${r.id}`)} accessibilityRole="button">
          <Card>
            <TileArt name={r.name} />
            <Text style={styles.h2}>{r.name}</Text>
            {!!r.description && <Muted small>{r.description}</Muted>}
            <Text style={{ color: colors.muted, fontSize: 13 }}>{r.address}</Text>
            <Pill text={r.isOpen ? 'Open' : 'Closed'} ok={r.isOpen} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
