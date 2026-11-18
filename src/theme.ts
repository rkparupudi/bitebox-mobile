import type { OrderStatus } from './lib/types';

/** Same palette as the web app, so both feel like one product. */
export const colors = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  ink: '#1F1A17',
  muted: '#6B625B',
  line: '#EBE4DA',
  brand: '#C2410C',
  brandInk: '#9A3412',
  brandSoft: '#FFF1E6',
  ok: '#15803D',
  okSoft: '#E8F6EC',
  warn: '#A16207',
  warnSoft: '#FDF6DC',
  bad: '#B91C1C',
  badSoft: '#FDECEC',
  info: '#1D4ED8',
  infoSoft: '#E9F0FE',
  purple: '#6D28D9',
  purpleSoft: '#F1EBFD',
};

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const statusColors: Record<OrderStatus, { fg: string; bg: string }> = {
  pending_payment: { fg: colors.warn, bg: colors.warnSoft },
  placed: { fg: colors.info, bg: colors.infoSoft },
  confirmed: { fg: colors.brandInk, bg: colors.brandSoft },
  preparing: { fg: colors.brandInk, bg: colors.brandSoft },
  ready_for_pickup: { fg: colors.purple, bg: colors.purpleSoft },
  out_for_delivery: { fg: colors.purple, bg: colors.purpleSoft },
  delivered: { fg: colors.ok, bg: colors.okSoft },
  cancelled: { fg: colors.bad, bg: colors.badSoft },
};
