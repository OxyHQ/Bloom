import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Admonition } from '../admonition';
import {
  SurfaceLevelProvider,
  surfaceFillVars,
  useSurfaceLevel,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PAYMENT_STATUS_GEOMETRY } from './constants';
import { resolvePaymentStatus, resolvePaymentStatusPaint } from './shared';
import type { PaymentStatusBlockProps } from './types';

/** The parts of the name, in reading order, with the empty ones dropped. */
function composeName(parts: ReadonlyArray<string | undefined>): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(', ');
}

/**
 * The block form: a confirmation screen's answer, not a row's.
 *
 * `PaymentStatusBar` is the strip a list, a header or a sticky footer carries
 * while something is in progress. This is the thing a reader ARRIVES at — so
 * the glyph is the page's subject rather than a row's ornament, the amount is
 * the largest thing on it, and the failure's words get an `Admonition` of their
 * own rather than a second line.
 *
 *   tile     56 round in the state's tint, a 28 glyph in the tone's own accent
 *   status   title-2-semibold, centred
 *   amount   title-1-semibold in TABULAR figures — the number a reader checks
 *   detail   body-regular, secondary
 *   ref      caption-1-medium label over a body-medium tabular value, so a
 *            reference can be read out one character at a time
 *   reason   `Admonition`, error for a failure and warning for a pending one.
 *            The three states with nothing to explain draw none, whatever
 *            `reason` says — a reason under a success is a reader hunting for a
 *            problem that is not there.
 *   surface  one rung above whatever it was dropped on, 16 radius, a hairline;
 *            `plain` draws the content and no chrome
 *
 * Nothing here formats money, reads a clock or decides what a processor's
 * status means.
 */
function PaymentStatusBlockComponent({
  state,
  status,
  amount,
  detail,
  reference,
  referenceLabel = 'Reference',
  reason,
  actions,
  icon,
  variant = 'surface',
  labels,
  accessibilityLabel,
  style,
  testID,
}: PaymentStatusBlockProps) {
  const theme = useTheme();
  const level = useSurfaceLevelValue();
  const own = useSurfaceLevel(variant === 'surface' ? 1 : 0);
  const paint = useMemo(
    () => resolvePaymentStatusPaint(theme, own.background),
    [theme, own.background],
  );
  const presentation = resolvePaymentStatus(state, { status, labels, icon });
  const accent = resolveAccentColors(theme.colors, presentation.tone, 'subtle');
  const Glyph = presentation.icon;
  const g = PAYMENT_STATUS_GEOMETRY;
  const showReason = presentation.admonition !== undefined && reason !== undefined && reason !== '';

  const body = (
    <View style={{ gap: g.gap, alignItems: 'stretch' }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View
          testID={testID ? `${testID}-tile` : undefined}
          style={{
            width: g.tile,
            height: g.tile,
            borderRadius: g.tile / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent.background,
          }}
        >
          <Glyph width={g.glyph} height={g.glyph} fill={accent.foreground} />
        </View>
        <Text
          variant="title-2-semibold"
          testID={testID ? `${testID}-status` : undefined}
          style={{ color: paint.text, textAlign: 'center' }}
        >
          {presentation.words}
        </Text>
        {amount ? (
          <Text
            variant="title-1-semibold"
            testID={testID ? `${testID}-amount` : undefined}
            style={{ color: paint.text, textAlign: 'center', fontVariant: ['tabular-nums'] }}
          >
            {amount}
          </Text>
        ) : null}
        {detail ? (
          <Text
            variant="body-regular"
            testID={testID ? `${testID}-detail` : undefined}
            style={{ color: paint.textSecondary, textAlign: 'center' }}
          >
            {detail}
          </Text>
        ) : null}
      </View>

      {reference ? (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text variant="caption-1-medium" style={{ color: paint.textSecondary }}>
            {referenceLabel}
          </Text>
          <Text
            variant="body-medium"
            testID={testID ? `${testID}-reference` : undefined}
            style={{ color: paint.text, fontVariant: ['tabular-nums'] }}
          >
            {reference}
          </Text>
        </View>
      ) : null}

      {showReason ? (
        <Admonition type={presentation.admonition} style={{ width: '100%' }}>
          {reason}
        </Admonition>
      ) : null}

      {actions ? <View style={{ gap: 8 }}>{actions}</View> : null}
    </View>
  );

  const name = accessibilityLabel ?? composeName([presentation.words, amount, detail]);

  if (variant === 'plain') {
    return (
      <View accessibilityLabel={name} testID={testID} style={style}>
        {body}
      </View>
    );
  }

  const raised = Math.min(3, level + 1) as SurfaceLevel;
  return (
    <View
      accessibilityLabel={name}
      testID={testID}
      style={[
        {
          padding: g.padding,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: own.border,
          backgroundColor: own.background,
        },
        surfaceFillVars(own.background),
        style,
      ]}
    >
      <SurfaceLevelProvider level={raised} fill={own.background}>
        {body}
      </SurfaceLevelProvider>
    </View>
  );
}

export const PaymentStatusBlock = memo(PaymentStatusBlockComponent);
PaymentStatusBlock.displayName = 'PaymentStatusBlock';
