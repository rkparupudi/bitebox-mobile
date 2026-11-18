import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Order } from '../lib/types';
import { FakePayment } from './FakePayment';
import { Banner, ErrorText, Loading } from './ui';

// Browser build (used for quick testing): Stripe's native PaymentSheet doesn't exist on web,
// so only the local simulator is offered. Real card payments are tested on a phone build.
export function PaymentPanel({ order }: { order: Order }) {
  const config = useQuery({ queryKey: ['config'], queryFn: api.config, staleTime: Infinity });
  if (config.isLoading) return <Loading />;
  if (config.error) return <ErrorText error={config.error} />;
  if (config.data!.paymentsProvider === 'fake') return <FakePayment order={order} />;
  return <Banner tone="warn" text="Card payments run in the iOS/Android app. Use the BiteBox website to pay in a browser." />;
}
