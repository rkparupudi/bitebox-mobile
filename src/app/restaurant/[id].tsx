import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Text, View } from 'react-native';
import { Button, Card, ErrorText, Loading, Muted, Pill, Qty, Screen, styles, TileArt } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { money } from '../../lib/format';
import type { MenuItem } from '../../lib/types';
import { colors } from '../../theme';

/** Cross-platform yes/no prompt (Alert has no buttons on web). */
function confirm(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Start new cart', onPress: () => resolve(true) },
    ]),
  );
}

export default function Menu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const menu = useQuery({ queryKey: ['menu', id], queryFn: () => api.menu(id) });
  const cart = useQuery({ queryKey: ['cart'], queryFn: api.cart, enabled: user?.role === 'customer' });

  const setItem = useMutation({
    mutationFn: ({ item, qty, replace }: { item: MenuItem; qty: number; replace?: boolean }) => api.setCartItem(item.id, qty, replace),
    onSuccess: (c) => qc.setQueryData(['cart'], c),
    onError: async (err, vars) => {
      if (err instanceof ApiError && err.status === 409) {
        const other = cart.data?.restaurant?.name ?? 'another restaurant';
        if (await confirm('Start a new cart?', `Your cart has items from ${other}.`)) setItem.mutate({ ...vars, replace: true });
      }
    },
  });

  if (menu.isLoading) return <Loading />;
  if (menu.error) return <Screen><ErrorText error={menu.error} /></Screen>;
  const { restaurant, items } = menu.data!;
  const here = cart.data?.restaurantId === id ? cart.data : null;
  const qtyOf = (itemId: string) => here?.lines.find((l) => l.menuItemId === itemId)?.quantity ?? 0;
  const categories = [...new Set(items.map((i) => i.category))];
  const count = here?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: restaurant.name }} />
      <Screen onRefresh={() => menu.refetch()} refreshing={menu.isRefetching}>
        <Card>
          <TileArt name={restaurant.name} />
          <Text style={styles.h1}>{restaurant.name}</Text>
          {!!restaurant.description && <Muted>{restaurant.description}</Muted>}
          <Muted small>{restaurant.address}</Muted>
          <Pill text={restaurant.isOpen ? 'Open now' : 'Closed — browse only'} ok={restaurant.isOpen} />
        </Card>
        {setItem.error && !(setItem.error instanceof ApiError && setItem.error.status === 409) && <ErrorText error={setItem.error} />}
        {categories.map((cat) => (
          <Card key={cat}>
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.muted }}>{cat.toUpperCase()}</Text>
            {items
              .filter((i) => i.category === cat)
              .map((item) => {
                const qty = qtyOf(item.id);
                return (
                  <View key={item.id} style={[styles.between, { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontWeight: '600', fontSize: 16, color: colors.ink }}>{item.name}</Text>
                      {!!item.description && <Muted small>{item.description}</Muted>}
                      <Text style={styles.price}>{money(item.priceMinor)}</Text>
                    </View>
                    {user?.role !== 'customer' ? null : qty > 0 ? (
                      <Qty value={qty} disabled={setItem.isPending} onChange={(n) => setItem.mutate({ item, qty: Math.max(0, n) })} />
                    ) : (
                      <Button small kind="secondary" title="Add" disabled={!restaurant.isOpen || setItem.isPending} onPress={() => setItem.mutate({ item, qty: 1 })} />
                    )}
                  </View>
                );
              })}
          </Card>
        ))}
      </Screen>
      {count > 0 && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}>
          <Button title={`View cart · ${count} item${count === 1 ? '' : 's'} · ${money(here!.subtotalMinor)}`} onPress={() => router.navigate('/customer/cart')} />
        </View>
      )}
    </View>
  );
}
