import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import { Banner, Button, Card, Empty, ErrorText, LiveDot, Loading, Muted, Screen, StatusBadge, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { money, NEXT_STEP, shortId, STATUS_LABEL, timeAgo } from '../../lib/format';
import { useOrderUpdates } from '../../lib/realtime';
import type { Order, OrderStatus } from '../../lib/types';
import { colors } from '../../theme';

const ACTIVE: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

const confirmReject = (): Promise<boolean> =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm('Reject this order? The customer will be refunded.'))
    : new Promise((resolve) =>
        Alert.alert('Reject this order?', 'The customer will be refunded.', [
          { text: 'Keep', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Reject', style: 'destructive', onPress: () => resolve(true) },
        ]),
      );

/** The restaurant's live order board: new paid orders appear instantly, newest first. */
export default function Board() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const restaurants = useQuery({ queryKey: ['my-restaurants'], queryFn: api.myRestaurants });
  const orders = useQuery({ queryKey: ['restaurant-orders', id], queryFn: () => api.restaurantOrders(id) });
  const restaurant = restaurants.data?.find((r) => r.id === id);

  const live = useOrderUpdates((u) => {
    if (u.restaurantId === id && u.status === 'placed') setFresh((s) => new Set(s).add(u.orderId));
  });
  const toggleOpen = useMutation({
    mutationFn: (isOpen: boolean) => api.updateRestaurant(id, { isOpen }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurants'] }),
  });

  if (orders.isLoading || restaurants.isLoading) return <Loading />;
  const active = (orders.data ?? []).filter((o) => ACTIVE.includes(o.status));
  const done = (orders.data ?? []).filter((o) => !ACTIVE.includes(o.status)).slice(0, 5);

  return (
    <Screen onRefresh={() => orders.refetch()} refreshing={orders.isRefetching}>
      <Stack.Screen options={{ title: restaurant?.name ?? 'Live orders' }} />
      <Card>
        <View style={styles.between}>
          <View style={{ gap: 4 }}>
            <Text style={styles.h2}>{restaurant?.isOpen ? 'Open for orders' : 'Closed'}</Text>
            <LiveDot on={live} />
          </View>
          <Switch
            value={!!restaurant?.isOpen}
            onValueChange={(v) => toggleOpen.mutate(v)}
            trackColor={{ true: colors.ok, false: colors.line }}
            accessibilityLabel="Open for orders"
          />
        </View>
      </Card>
      {!restaurant?.isOpen && <Banner tone="warn" text="You're closed, so customers can't order." />}
      <ErrorText error={orders.error || toggleOpen.error} />
      {active.length === 0 && <Empty text="No active orders. New ones appear here instantly." />}
      {active.map((o) => (
        <Ticket key={o.id} order={o} fresh={fresh.has(o.id)} />
      ))}
      {done.length > 0 && (
        <Card>
          <Text style={styles.h2}>Recently completed</Text>
          {done.map((o) => (
            <Pressable key={o.id} onPress={() => router.push(`/order/${o.id}`)} style={styles.between}>
              <Text style={{ color: colors.ink }}>{shortId(o.id)}</Text>
              <StatusBadge status={o.status} />
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Ticket({ order, fresh }: { order: Order; fresh: boolean }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['restaurant-orders', order.restaurantId] });
  const next = NEXT_STEP[order.status];
  const advance = useMutation({ mutationFn: (to: OrderStatus) => api.setOrderStatus(order.id, to), onSuccess: refresh });
  const reject = useMutation({ mutationFn: () => api.cancelOrder(order.id, 'rejected_by_restaurant'), onSuccess: refresh });
  const canReject = order.status === 'placed' || order.status === 'confirmed';

  return (
    <Card style={fresh && order.status === 'placed' ? { borderColor: colors.brand, borderWidth: 2 } : undefined}>
      <View style={styles.between}>
        <Text style={styles.h2}>{shortId(order.id)}</Text>
        <Muted small>{timeAgo(order.createdAt)}</Muted>
      </View>
      {order.items.map((i) => (
        <Text key={i.id} style={{ color: colors.ink, fontSize: 16 }}>{i.quantity} × {i.name}</Text>
      ))}
      {!!order.notes && <Text style={{ color: colors.warn }}>Note: {order.notes}</Text>}
      <View style={styles.between}>
        <StatusBadge status={order.status} />
        <Text style={styles.price}>{money(order.subtotalMinor, order.currency)}</Text>
      </View>
      <ErrorText error={advance.error || reject.error} />
      {next && (
        <Button title={next.label} testID={`advance-${order.id}`} loading={advance.isPending} onPress={() => advance.mutate(next.to)} />
      )}
      {canReject && (
        <Button title="Reject" kind="danger" small loading={reject.isPending} onPress={async () => (await confirmReject()) && reject.mutate()} />
      )}
      <Muted small>{STATUS_LABEL[order.status]}</Muted>
    </Card>
  );
}
