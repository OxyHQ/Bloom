import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Item } from '../item';
import { RadioIndicator } from '../radio-indicator';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DELIVERY_DOT, DELIVERY_GLYPH, DELIVERY_OPTION_RADIUS } from './constants';
import { joinDeliveryParts, resolveDeliverySlotPaint } from './shared';
import type { DeliverySlotOptionProps } from './types';

/**
 * One choosable slot: the window, what class of service it is and what is left
 * of it, and what it costs.
 *
 *   dot      `RadioIndicator` at 20 (`Radio`'s `lg` rung — the row is two lines
 *            tall, and the 16 dot read as a bullet beside it)
 *   label    the row's own rung, with an optional glyph before it and a `Badge`
 *            after it
 *   detail   body-2-regular secondary — the tier, the capacity, the note, or
 *            just "Sold out"
 *   price    body-medium in TABULAR figures at the end, so a column of
 *            surcharges lines up
 *   box      radius 12, a hairline at rest; the chosen row takes the text
 *            colour for its border and one surface step for its fill
 *
 * It is `Item` with `role="radio"`: the press target, the hover and press
 * paint, the disabled opacity and — the part worth naming — the `aria-checked`
 * that role scopes are all `Item`'s, which is why this is a radio rather than a
 * pressable that happens to look selected. A sold-out window is `disabled`, so
 * it announces as unavailable instead of merely being drawn pale.
 */
function DeliverySlotOptionComponent({
  label,
  detail,
  price,
  badge,
  icon: Icon,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: DeliverySlotOptionProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveDeliverySlotPaint(theme, surface), [theme, surface]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <Item
      role="radio"
      selected={selected}
      // `onPress` stays wired while disabled: `Item` drops the handler itself
      // and keeps the row in the group's tab order, which is what a radio that
      // is present but unavailable should do.
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? joinDeliveryParts([label, detail, price]) ?? label}
      leading={<RadioIndicator selected={selected} size={DELIVERY_DOT} testID={id('dot')} />}
      trailing={
        price ? (
          <Text
            variant="body-medium"
            numberOfLines={1}
            testID={id('price')}
            style={{ color: paint.text, fontVariant: ['tabular-nums'] }}
          >
            {price}
          </Text>
        ) : null
      }
      style={[
        {
          borderRadius: DELIVERY_OPTION_RADIUS,
          borderWidth: 1,
          borderColor: selected ? paint.text : paint.border,
          backgroundColor: selected ? paint.selected : 'transparent',
        },
        style,
      ]}
      testID={testID}
    >
      {/*
        `flex: 1` + `minWidth: 0`: `Item` gives `children` no column of its own,
        and a one-line Text is `nowrap` on web — without the floor a long window
        label becomes the row's min-content width and the page scrolls sideways
        instead of the label truncating.
      */}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {Icon ? (
            <Icon width={DELIVERY_GLYPH} height={DELIVERY_GLYPH} fill={paint.textSecondary} />
          ) : null}
          <Text
            variant="body-medium"
            numberOfLines={1}
            testID={id('label')}
            style={{ flexShrink: 1, minWidth: 0, color: paint.text }}
          >
            {label}
          </Text>
          {badge}
        </View>
        {detail ? (
          <Text
            variant="body-2-regular"
            numberOfLines={2}
            testID={id('detail')}
            style={{ color: paint.textSecondary }}
          >
            {detail}
          </Text>
        ) : null}
      </View>
    </Item>
  );
}

export const DeliverySlotOption = memo(DeliverySlotOptionComponent);
DeliverySlotOption.displayName = 'DeliverySlotOption';
