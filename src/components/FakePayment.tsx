import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { money } from '../lib/format';
import type { Order } from '../lib/types';
import { Banner, Button, ErrorText } from './ui';

/** Local test mode (API running with PAYMENTS_PROVIDER=fake): simulate Stripe's webhook. */
export function FakePayment({ order }: { order: Order }) {
  const qc = useQueryClient();
  const simulate = useMutation({
    mutationFn: (outcome: 'succeeded' | 'failed') => api.simulatePayment(order.id, outcome),
    onSuccess: (o) => qc.setQueryData(['order', order.id], o),
  });
  return (
    <>
      <Banner text="Local test mode: no real payment is taken." />
      {order.payment?.status === 'failed' && <Banner tone="warn" text="Payment was declined. Try again." />}
      <ErrorText error={simulate.error} />
      <Button
        testID="pay"
        title={`Pay ${money(order.totalMinor, order.currency)}`}
        onPress={() => simulate.mutate('succeeded')}
        loading={simulate.isPending && simulate.variables === 'succeeded'}
      />
      <Button
        testID="decline"
        title="Simulate a declined card"
        kind="secondary"
        onPress={() => simulate.mutate('failed')}
        disabled={simulate.isPending}
      />
    </>
  );
}
