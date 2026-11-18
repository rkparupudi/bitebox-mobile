import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { money } from '../lib/format';
import type { Order } from '../lib/types';
import { Banner, Button, ErrorText, Loading } from './ui';
import { FakePayment } from './FakePayment';

/**
 * Collect payment for a pending order on iOS/Android.
 * - Stripe mode: Stripe's native PaymentSheet (cards, plus Apple Pay / Google Pay once
 *   enabled). Card details go from the phone straight to Stripe.
 * - Fake mode (local development): simulator buttons, same as the web app.
 * Either way the order only becomes "placed" when the API gets the payment event, and the
 * screen updates through the live connection.
 */
export function PaymentPanel({ order }: { order: Order }) {
  const config = useQuery({ queryKey: ['config'], queryFn: api.config, staleTime: Infinity });
  if (config.isLoading) return <Loading />;
  if (config.error) return <ErrorText error={config.error} />;
  if (config.data!.paymentsProvider === 'fake') return <FakePayment order={order} />;
  if (!config.data!.stripePublishableKey) {
    return <Banner tone="warn" text="Stripe isn't configured on the API (STRIPE_PUBLISHABLE_KEY)." />;
  }
  return (
    <StripeProvider publishableKey={config.data!.stripePublishableKey} urlScheme="bitebox">
      <StripeSheet order={order} />
    </StripeProvider>
  );
}

function StripeSheet({ order }: { order: Order }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const qc = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const pay = useMutation({
    mutationFn: async () => {
      const { clientSecret } = await api.paymentSecret(order.id);
      const init = await initPaymentSheet({
        merchantDisplayName: 'BiteBox',
        paymentIntentClientSecret: clientSecret,
        returnURL: 'bitebox://stripe-redirect',
      });
      if (init.error) throw new Error(init.error.message);
      const result = await presentPaymentSheet();
      if (result.error) {
        if (result.error.code === 'Canceled') return false; // user closed the sheet
        throw new Error(result.error.message);
      }
      return true;
    },
    onSuccess: (paid) => {
      if (paid) {
        setSubmitted(true);
        qc.invalidateQueries({ queryKey: ['order', order.id] });
      }
    },
  });

  if (submitted) return <Banner text="Payment submitted. Waiting for confirmation…" />;
  return (
    <>
      <ErrorText error={pay.error} />
      <Button title={`Pay ${money(order.totalMinor, order.currency)}`} onPress={() => pay.mutate()} loading={pay.isPending} />
    </>
  );
}
