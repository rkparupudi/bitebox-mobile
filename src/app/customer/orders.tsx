import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Card, Empty, ErrorText, LiveDot, Muted, Screen, StatusBadge, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { money, shortId, timeAgo } from '../../lib/format';
import { useOrderUpdates } from '../../lib/realtime';

export default function Orders() {
  const orders = useQuery({ queryKey: ['orders'], queryFn: api.myOrders });
  const live = useOrderUpdates();
  return (
    <Screen onRefresh={() => orders.refetch()} refreshing={orders.isRefetching}>
      <LiveDot on={live} />
      <ErrorText error={orders.error} />
      {orders.data?.length === 0 && <Empty text="No orders yet." />}
      {orders.data?.map((o) => (
        <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}`)} accessibilityRole="button">
          <Card>
            <View style={styles.between}>
              <Text style={styles.h2}>{shortId(o.id)}</Text>
              <StatusBadge status={o.status} />
            </View>
            <Muted small>{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</Muted>
            <View style={styles.between}>
              <Muted small>{timeAgo(o.createdAt)}</Muted>
              <Text style={styles.price}>{money(o.totalMinor, o.currency)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
