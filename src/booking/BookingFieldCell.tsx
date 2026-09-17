import React from 'react';
import { Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import { BOOKING_FIELD_RADIUS, type BookingPalette } from './shared';

/**
 * INTERNAL — one cell of a date / guests box (`BookingCard`, and the
 * `ExchangeProposalCard` in `listing-actions`): a caption-2-bold uppercase
 * label over a body-regular value, padding 10 × 12; a neutral-100 wash under a
 * pointer or a press, a 2px text-primary outline while `active`.
 */

export type FieldHandleProps = Record<string, unknown>;

export interface BookingFieldCellProps extends FieldHandleProps {
  label: string;
  value?: string;
  placeholder: string;
  active: boolean;
  /** Only set when the card knows whether this field's picker is open. */
  expanded?: boolean;
  trailing?: React.ReactNode;
  palette: BookingPalette;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function BookingFieldCell({
  label,
  value,
  placeholder,
  active,
  expanded,
  trailing,
  palette,
  onPress,
  style,
  testID,
  ...handle
}: BookingFieldCellProps) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const shown = value && value.length > 0 ? value : placeholder;

  const cellStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: BOOKING_FIELD_RADIUS,
    backgroundColor: !active && (hovered || pressed) ? palette.highlight : 'transparent',
    '--bloom-booking-ring': palette.ring,
    '--bloom-booking-ring-offset': '-2px',
  };

  return (
    <Pressable
      // First, so the cell's own name wins over the `undefined` a
      // `PopoverTrigger` hands an `asChild` child that carries none — spread
      // last, that explicit `undefined` erased the name (measured in Chrome).
      // The trigger's `aria-expanded` / `aria-haspopup` still come through.
      {...handle}
      {...webDataSet({ bloomBookingFocus: '' })}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${shown}`}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      aria-expanded={expanded ?? (handle['aria-expanded'] as boolean | undefined)}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[cellStyle, style]}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          variant="caption-2-bold"
          numberOfLines={1}
          style={{ color: palette.text, textTransform: 'uppercase' }}
        >
          {label}
        </Text>
        <Text
          variant="body-regular"
          numberOfLines={1}
          style={{ color: value ? palette.text : palette.textSecondary }}
        >
          {shown}
        </Text>
      </View>
      {trailing}
      {active ? (
        <View
          pointerEvents="none"
          testID={testID ? `${testID}-active` : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: 2,
            borderColor: palette.active,
            borderRadius: BOOKING_FIELD_RADIUS,
          }}
        />
      ) : null}
    </Pressable>
  );
}

