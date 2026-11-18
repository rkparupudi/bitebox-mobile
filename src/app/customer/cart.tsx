import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Empty, ErrorText, Field, Loading, Muted, Qty, Screen, styles } from '../../components/ui';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { colors } from '../../theme';

export default function CartScreen() {
  const qc = useQueryClient();
  const cart = useQuery({ queryKey: ['cart'], queryFn: api.cart });
  const config = useQuery({ queryKey: ['config'], queryFn: api.config, staleTime: Infinity });
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const setQty = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => api.setCartItem(id, qty),
    onSuccess: (c) => qc.setQueryData(['cart'], c),
  });
  const checkout = useMutation({
    mutationFn: () => api.checkout(address.trim(), notes.trim()),
    onSuccess: ({ order }) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setNotes('');
      router.push(`/order/${order.id}`);
    },
  });

  if (cart.isLoading) return <Loading />;
  const c = cart.data;
  if (!c || c.lines.length === 0) {
    return (
      <Screen>
        <Empty text="Your cart is empty." />
        <Button title="Browse restaurants" kind="secondary" onPress={() => router.navigate('/customer')} />
      </Screen>
    );
  }
  const fee = config.data?.deliveryFeeMinor ?? 0;
  const unavailable = c.lines.some((l) => !l.isAvailable);
  const closed = !c.restaurant?.isOpen || !c.restaurant?.isActive;

  return (
    <Screen>
      <Card>
        <Text style={styles.h2}>{c.restaurant?.name}</Text>
        {c.lines.map((l) => (
          <View key={l.menuItemId} style={[styles.between, { paddingVertical: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink }}>{l.name}</Text>
              <Muted small>{money(l.unitPriceMinor)} each</Muted>
              {!l.isAvailable && <Text style={{ color: colors.bad, fontSize: 13 }}>No longer available — remove to continue</Text>}
            </View>
            <Qty value={l.quantity} disabled={setQty.isPending} onChange={(n) => setQty.mutate({ id: l.menuItemId, qty: Math.max(0, n) })} />
          </View>
        ))}
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.h2}>Delivery details</Text>
        <Field label="Delivery address" value={address} onChangeText={setAddress} placeholder="Flat, building, street, area" multiline testID="address" />
        <Field label="Notes for the restaurant (optional)" value={notes} onChangeText={setNotes} placeholder="Less spicy, no onions…" />
      </Card>
      <Card>
        <View style={styles.between}><Muted>Item total</Muted><Text style={styles.price}>{money(c.subtotalMinor)}</Text></View>
        <View style={styles.between}><Muted>Delivery fee</Muted><Text style={styles.price}>{money(fee)}</Text></View>
        <View style={[styles.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
          <Text style={styles.h2}>To pay</Text>
          <Text style={[styles.price, { fontSize: 17 }]}>{money(c.subtotalMinor + fee)}</Text>
        </View>
      </Card>
      {closed && <Banner tone="warn" text="This restaurant isn't taking orders right now." />}
      <ErrorText error={checkout.error} />
      <Button
        title="Place order and pay"
        testID="place-order"
        loading={checkout.isPending}
        disabled={address.trim().length < 5 || unavailable || closed}
        onPress={() => checkout.mutate()}
      />
    </Screen>
  );
}
