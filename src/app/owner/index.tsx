import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Banner, Card, Empty, ErrorText, Muted, Pill, Screen, styles, TileArt } from '../../components/ui';
import { api } from '../../lib/api';

export default function MyRestaurants() {
  const mine = useQuery({ queryKey: ['my-restaurants'], queryFn: api.myRestaurants });
  return (
    <Screen onRefresh={() => mine.refetch()} refreshing={mine.isRefetching}>
      <Banner text="Take orders here. Menus and sales reports are in the BiteBox web dashboard." />
      <ErrorText error={mine.error} />
      {mine.data?.length === 0 && <Empty text="No restaurants yet. Create one in the web dashboard." />}
      {mine.data?.map((r) => (
        <Pressable key={r.id} onPress={() => router.push(`/board/${r.id}`)} accessibilityRole="button">
          <Card>
            <TileArt name={r.name} height={64} />
            <Text style={styles.h2}>{r.name}</Text>
            <Muted small>{r.address}</Muted>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill text={r.isOpen ? 'Open' : 'Closed'} ok={r.isOpen} />
              {!r.isActive && <Pill text="Suspended by admin" ok={false} />}
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
