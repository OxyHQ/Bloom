/**
 * `.safeAreaPadding()`'s view: a React Native view padded by the device's
 * safe-area insets on its sides, read from `react-native-safe-area-context`
 * as it renders (none outside a `SafeAreaProvider`), after its own style. A
 * top or bottom inset adds to the view's own padding there (`own`), as an app
 * writes `paddingTop: insets.top + 24`: one view.
 */
import { type ComponentProps, createElement, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { type EdgeInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';

const NO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };
const NO_OWN = { top: 0, bottom: 0 };

/** Each side's bit (`SAFE_AREA_BITS`) and the padding it writes from its inset. */
const SIDES = [
  [0b0001, 'paddingTop', 'top'],
  [0b0010, 'paddingBottom', 'bottom'],
  [0b0100, 'paddingLeft', 'left'],
  [0b1000, 'paddingRight', 'right'],
] as const;

export function SafeAreaPadded({
  safeArea,
  own = NO_OWN,
  style,
  ...rest
}: ComponentProps<typeof View> & {
  safeArea: number;
  /** The view's own top and bottom padding, which the insets add to. */
  own?: { top: number; bottom: number };
}) {
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const { top, bottom } = own;
  const padding = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [bit, key, side] of SIDES)
      if (safeArea & bit)
        out[key] = insets[side] + (side === 'top' ? top : side === 'bottom' ? bottom : 0);
    return out;
  }, [safeArea, insets, top, bottom]);
  return createElement(View, { ...rest, style: [style, padding] });
}
