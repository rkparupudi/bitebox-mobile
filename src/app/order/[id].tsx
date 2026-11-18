import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Text, View } from 'react-native';
import { PaymentPanel } from '../../components/PaymentPanel';
import { Button, Card, ErrorText, LiveDot, Loading, Muted, OrderProgress, Screen, StatusBadge, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { money, shortId, STATUS_LABEL } from '../../lib/format';
import { useOrderUpdates } from '../../lib/realtime';
import { colors } from '../../theme';

const confirmCancel = (): Promise<boolean> =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm('Cancel this order?'))
    : new Promise((resolve) =>
        Alert.alert('Cancel this order?', 'Paid orders are refunded.', [
          { text: 'Keep order', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Cancel order', style: 'destructive', onPress: () => resolve(true) },
        ]),
      );

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const order = useQuery({ queryKey: ['order', id], queryFn: () => api.order(id) });
  const live = useOrderUpdates();
  const cancel = useMutation({ mutationFn: () => api.cancelOrder(id), onSuccess: (o) => qc.setQueryData(['order', id], o) });

  if (order.isLoading) return <Loading />;
  if (order.error) return <Screen><ErrorText error={order.error} /></Screen>;
  const o = order.data!;
  const isCustomer = user?.id === o.customerId;
  const canCancel = isCustomer && (o.status === 'pending_payment' || o.status === 'placed');

  return (
    <Screen onRefresh={() => order.refetch()} refreshing={order.isRefetching}>
      <Stack.Screen options={{ title: `Order ${shortId(o.id)}` }} />
      <View style={styles.between}>
        <LiveDot on={live} />
        <StatusBadge status={o.status} />
      </View>

      {o.status === 'pending_payment' && isCustomer && (
        <Card style={{ gap: 12 }}>
          <Text style={styles.h2}>Complete payment</Text>
          <PaymentPanel order={o} />
        </Card>
      )}

      {o.status !== 'pending_payment' && o.status !== 'cancelled' && (
        <Card style={{ gap: 12 }}>
          <Text style={styles.h1} testID="order-status">{o.status === 'delivered' ? 'Delivered. Enjoy!' : STATUS_LABEL[o.status]}</Text>
          <OrderProgress status={o.status} />
          <Muted small>Updates arrive automatically, even when the app is closed.</Muted>
        </Card>
      )}

      {o.status === 'cancelled' && (
        <Card>
          <Text style={styles.h1} testID="order-status">Order cancelled</Text>
          <Muted>
            Reason: {(o.cancelReason ?? 'cancelled').replace(/_/g, ' ')}.{o.payment?.refunded ? ' Your payment has been refunded.' : ''}
          </Muted>
        </Card>
      )}

      <Card>
        <Text style={styles.h2}>Items</Text>
        {o.items.map((i) => (
          <View key={i.id} style={styles.between}>
            <Text style={{ color: colors.ink, flex: 1 }}>{i.quantity} × {i.name}</Text>
            <Text style={styles.price}>{money(i.unitPriceMinor * i.quantity, o.currency)}</Text>
          </View>
        ))}
        <View style={[styles.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
          <Muted>Delivery fee</Muted>
          <Text style={styles.price}>{money(o.deliveryFeeMinor, o.currency)}</Text>
        </View>
        <View style={styles.between}>
          <Text style={styles.h2}>Total</Text>
          <Text style={[styles.price, { fontSize: 17 }]}>{money(o.totalMinor, o.currency)}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.h2}>Deliver to</Text>
        <Text style={{ color: colors.ink }}>{o.deliveryAddress}</Text>
        {!!o.notes && <Muted small>Note: {o.notes}</Muted>}
      </Card>

      {!!o.history?.length && (
        <Card>
          <Text style={styles.h2}>History</Text>
          {o.history.map((h) => (
            <View key={h.id} style={styles.between}>
              <Text style={{ color: colors.ink }}>{STATUS_LABEL[h.toStatus]} <Text style={{ color: colors.muted }}>· {h.actor}</Text></Text>
              <Muted small>{new Date(h.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Muted>
            </View>
          ))}
        </Card>
      )}

      {canCancel && (
        <>
          <ErrorText error={cancel.error} />
          <Button title="Cancel order" kind="danger" loading={cancel.isPending} onPress={async () => (await confirmCancel()) && cancel.mutate()} />
        </>
      )}
    </Screen>
  );
}
