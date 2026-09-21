import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Item } from '../item';
import { RadioIndicator } from '../radio-indicator';
import { useSurfaceFill } from '../styles/surface-levels';
import { space } from '../styles/tokens';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PaymentMethodMark } from './PaymentMethodMark';
import { PAYMENT_METHOD_GEOMETRY, PAYMENT_METHOD_STATE_TONE } from './constants';
import { composePaymentMethodName, paymentMethodStateMessage, resolvePaymentMethodPaint } from './shared';
import type { PaymentMethodRowProps } from './types';

/**
 * A way to pay, as a row: the mark, the scheme, the masked identifier, when it
 * runs out, whether it is the default one, and either a trailing action or a
 * selection control.
 *
 * It is `Item` with a payment method's slots filled in, for the same reason
 * `AddressRow` is: the row, the press target, the selected wash, the density
 * rungs, the disabled opacity and the ARIA role translation are `Item`'s job,
 * and this family owns no second copy of any of them. What it adds is the card
 * plate, the scheme/masked pairing on the title line, the default badge, the
 * state line and the radio dot.
 *
 *   mark     `PaymentMethodMark`, plate only — the row draws the name itself,
 *            so the title line can hold the masked tail and the badge too
 *   title    scheme in `Item`'s own title rung; the masked identifier beside it
 *            in body-2 TABULAR figures, so four rows of digits line up
 *   line 2   the expiry, secondary
 *   line 3   the state's words in the state's own colour, drawn only when the
 *            method cannot be used
 *   trailing the radio dot (`selectable`) or the action
 *
 * NOTHING HERE IS SENSITIVE. `masked` is a string the app already masked; this
 * row never unmasks, parses, stores, logs or transmits anything, and there is no
 * prop that takes a full number.
 */
function PaymentMethodRowComponent({
  scheme,
  masked,
  expiry,
  kind = 'card',
  icon,
  image,
  leading,
  isDefault = false,
  defaultLabel = 'Default',
  state = 'ok',
  stateMessage,
  selectable = false,
  selected,
  action,
  onPress,
  disabled = false,
  density = 'comfortable',
  role,
  accessibilityLabel,
  style,
  testID,
}: PaymentMethodRowProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePaymentMethodPaint(theme, surface), [theme, surface]);
  const g = PAYMENT_METHOD_GEOMETRY[density];
  const tone = PAYMENT_METHOD_STATE_TONE[state];
  const stateWords = paymentMethodStateMessage(state, stateMessage);
  // The state's words are read as TEXT on the row's own surface, so they take
  // the tone's `accent` member (`outlined` foreground) rather than the fill.
  const stateColor = tone ? resolveAccentColors(theme.colors, tone, 'outlined').foreground : undefined;

  const media =
    leading !== undefined ? (
      leading
    ) : (
      <PaymentMethodMark
        kind={kind}
        icon={icon}
        image={image}
        state={state}
        density={density}
        testID={testID ? `${testID}-mark` : undefined}
      />
    );

  const titleNode = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {scheme ? (
        <Text
          variant="headline-medium"
          numberOfLines={1}
          testID={testID ? `${testID}-scheme` : undefined}
          style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
        >
          {scheme}
        </Text>
      ) : null}
      {masked ? (
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          testID={testID ? `${testID}-masked` : undefined}
          style={{ flexShrink: 1, minWidth: 0, color: paint.textSecondary, fontVariant: ['tabular-nums'] }}
        >
          {masked}
        </Text>
      ) : null}
      {isDefault ? (
        // The badge does not SHRINK: it is two or three words that mean
        // "this is the one", and a truncated "D…" says nothing. The masked
        // identifier beside it gives way instead, which is the part a reader
        // can still recognise from its first characters.
        <View style={{ flexShrink: 0 }}>
          <Badge
            content={defaultLabel}
            variant="subtle"
            color="primary"
            size="label-small"
            testID={testID ? `${testID}-default` : undefined}
          />
        </View>
      ) : null}
    </View>
  );

  const subtitleNode =
    expiry || stateWords ? (
      <View style={{ gap: 2, minWidth: 0 }}>
        {expiry ? (
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            testID={testID ? `${testID}-expiry` : undefined}
            style={{ color: paint.textSecondary, fontVariant: ['tabular-nums'] }}
          >
            {expiry}
          </Text>
        ) : null}
        {stateWords ? (
          <Text
            variant="body-2-medium"
            numberOfLines={2}
            testID={testID ? `${testID}-state` : undefined}
            style={{ color: stateColor ?? paint.textSecondary }}
          >
            {stateWords}
          </Text>
        ) : null}
      </View>
    ) : null;

  // A PRESSABLE row is a real `<button>` on web, so a control cannot live
  // inside it: a button in a button is invalid HTML and, unlike native, a web
  // click on the inner control ALSO fires the row. The selection DOT is not a
  // control — it draws no press target of its own — so it stays inside; an
  // `action` does not. The mechanism is measured in `address/AddressRow.tsx`.
  const splitAction = action != null && onPress != null;

  const trailing = selectable ? (
    <RadioIndicator
      selected={selected === true}
      size={g.dot}
      testID={testID ? `${testID}-dot` : undefined}
    />
  ) : splitAction ? null : (
    (action ?? null)
  );

  const row = (
    <Item
      title={titleNode}
      subtitle={subtitleNode}
      leading={media}
      trailing={trailing}
      onPress={onPress}
      disabled={disabled}
      selected={selected}
      density={density}
      role={role}
      accessibilityLabel={
        accessibilityLabel ??
        composePaymentMethodName([scheme, masked, expiry, isDefault && defaultLabel, stateWords])
      }
      // `paddingRight`, never `paddingHorizontal`: `Item` writes the longhand,
      // and on web a shorthand here would outrank it while native honoured it.
      style={splitAction ? { paddingRight: space.sm } : style}
      testID={testID}
    />
  );

  if (!splitAction) return row;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingRight: space.lg }, style]}>
      {/*
        `Item`'s `style` lands on its CONTENT view, one node below the flex
        child the parent actually lays out, so the flex goes on a wrapper the
        parent can see. Same shape as `AddressRow`.
      */}
      <View style={{ flex: 1, minWidth: 0 }}>{row}</View>
      {action}
    </View>
  );
}

export const PaymentMethodRow = memo(PaymentMethodRowComponent);
PaymentMethodRow.displayName = 'PaymentMethodRow';
