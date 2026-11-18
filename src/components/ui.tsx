import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../lib/api';
import { PROGRESS, STATUS_LABEL } from '../lib/format';
import type { OrderStatus } from '../lib/types';
import { colors, radius, space, statusColors } from '../theme';

/** Scrollable page with pull-to-refresh and safe-area padding. */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  edges = ['bottom'],
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}
export function Muted({ children, small }: { children: ReactNode; small?: boolean }) {
  return <Text style={[styles.muted, small && { fontSize: 13 }]}>{children}</Text>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';
export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  small,
  testID,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  testID?: string;
}) {
  const k = buttonKinds[kind];
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: k.bg, borderColor: k.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={k.fg} /> : <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: k.fg }]}>{title}</Text>}
    </Pressable>
  );
}
const buttonKinds: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand, fg: '#fff', border: colors.brand },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.line },
  danger: { bg: colors.surface, fg: colors.bad, border: '#F3C4C4' },
  ghost: { bg: 'transparent', fg: colors.brandInk, border: 'transparent' },
};

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#A39A92" style={[styles.input, props.multiline && { minHeight: 72, textAlignVertical: 'top' }]} {...props} />
    </View>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function Pill({ text, ok }: { text: string; ok: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: ok ? colors.okSoft : colors.line }]}>
      <Text style={[styles.badgeText, { color: ok ? colors.ok : colors.muted }]}>{text}</Text>
    </View>
  );
}

export function LiveDot({ on }: { on: boolean }) {
  return (
    <Row style={{ gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: on ? colors.ok : '#C9BFB3' }} />
      <Text style={{ fontSize: 13, color: on ? colors.ok : colors.muted }}>{on ? 'Live' : 'Connecting…'}</Text>
    </Row>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong';
  return (
    <View style={[styles.banner, { backgroundColor: colors.badSoft }]}>
      <Text style={{ color: colors.bad }}>{msg}</Text>
    </View>
  );
}

export function Banner({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warn' | 'ok' }) {
  const t = { info: [colors.infoSoft, colors.info], warn: [colors.warnSoft, colors.warn], ok: [colors.okSoft, colors.ok] }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t[0] }]}>
      <Text style={{ color: t[1] }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Muted>{text}</Muted>
    </Card>
  );
}

export function Qty({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <Row style={styles.qty}>
      <Pressable accessibilityLabel="decrease" disabled={disabled} onPress={() => onChange(value - 1)} style={styles.qtyBtn}>
        <Text style={styles.qtyBtnText}>−</Text>
      </Pressable>
      <Text style={styles.qtyValue}>{value}</Text>
      <Pressable accessibilityLabel="increase" disabled={disabled} onPress={() => onChange(value + 1)} style={styles.qtyBtn}>
        <Text style={styles.qtyBtnText}>+</Text>
      </Pressable>
    </Row>
  );
}

/** Gradient-free placeholder art: a coloured tile with the restaurant's initials. */
export function TileArt({ name, height = 88 }: { name: string; height?: number }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  return (
    <View style={{ height, borderRadius: radius.md, backgroundColor: `hsl(${h}, 65%, 48%)`, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'pending_payment') return null;
  const at = PROGRESS.indexOf(status);
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ gap: 4 }}>
        {PROGRESS.map((s, i) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: i < at || status === 'delivered' ? colors.ok : i === at ? colors.brand : colors.line,
            }}
          />
        ))}
      </Row>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Step {Math.min(at + 1, PROGRESS.length)} of {PROGRESS.length}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: space.sm,
  },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm + 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: space.md, borderRadius: radius.sm + 2 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  banner: { padding: space.md, borderRadius: radius.md },
  qty: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm + 2, backgroundColor: colors.surface },
  qtyBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, color: colors.brand, fontWeight: '700' },
  qtyValue: { minWidth: 22, textAlign: 'center', fontWeight: '700', fontSize: 16 },
  price: { fontWeight: '700', fontVariant: ['tabular-nums'], color: colors.ink },
});
