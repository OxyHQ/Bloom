/**
 * `.safeAreaPadding()`'s view: a React Native view padded by the device's
 * safe-area insets on its sides, read from `react-native-safe-area-context`
 * as it renders (none outside a `SafeAreaProvider`), after its own style.
 */
import { type ComponentProps, createElement, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { type EdgeInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';

const NO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/** Each side's bit (`SAFE_AREA_BITS`) and the padding it writes from its inset. */
const SIDES = [
  [0b0001, 'paddingTop', 'top'],
  [0b0010, 'paddingBottom', 'bottom'],
  [0b0100, 'paddingLeft', 'left'],
  [0b1000, 'paddingRight', 'right'],
] as const;

export function SafeAreaPadded({
  safeArea,
  style,
  ...rest
}: ComponentProps<typeof View> & { safeArea: number }) {
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  const padding = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [bit, key, side] of SIDES) if (safeArea & bit) out[key] = insets[side];
    return out;
  }, [safeArea, insets]);
  return createElement(View, { ...rest, style: [style, padding] });
}
