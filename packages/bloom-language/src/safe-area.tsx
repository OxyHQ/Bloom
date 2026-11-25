/**
 * `.safeAreaPadding()`'s view: a React Native view padded by the safe-area
 * insets on its sides, after its own style. A side pads by the device's
 * insets, read from `react-native-safe-area-context` as it renders (none
 * outside a `SafeAreaProvider`), or by the content's (`.safeAreaPadding(edge,
 * 'content')`): what is left of them inside the frame around the view, Bloom's
 * `useContentSafeAreaInsets()`, as an app reads it to pad a screen's body. A
 * top or bottom inset adds to the view's own padding there (`own`), as an app
 * writes `paddingTop: insets.top + 24`: one view.
 */
import { type ComponentProps, createElement, use, useMemo } from 'react';
import { View } from 'react-native';
import { type EdgeInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useContentSafeAreaInsets } from '@oxy.so/bloom/layout';

import { CONTENT_SHIFT } from './style';

const NO_INSETS: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 };
const NO_OWN = { top: 0, bottom: 0 };

/** Each side's bit (`SAFE_AREA_BITS`) and the padding it writes from its inset. */
const SIDES = [
  [0b0001, 'paddingTop', 'top'],
  [0b0010, 'paddingBottom', 'bottom'],
  [0b0100, 'paddingLeft', 'left'],
  [0b1000, 'paddingRight', 'right'],
] as const;

type PaddedProps = ComponentProps<typeof View> & {
  /** The sides it pads, a bit each: the device's, and the content's shifted by `CONTENT_SHIFT`. */
  safeArea: number;
  /** The view's own top and bottom padding, which the insets add to. */
  own?: { top: number; bottom: number };
};

/** A view padded by the device's safe area. */
export function SafeAreaPadded(props: PaddedProps) {
  const device = use(SafeAreaInsetsContext) ?? NO_INSETS;
  return usePadded(props, device, NO_INSETS);
}

/** A view padded by the content's safe area, and the device's on any side it names so. */
export function ContentSafeAreaPadded(props: PaddedProps) {
  const content = useContentSafeAreaInsets();
  const device = props.safeArea & 0b1111 ? (use(SafeAreaInsetsContext) ?? NO_INSETS) : NO_INSETS;
  return usePadded(props, device, content);
}

function usePadded(
  { safeArea, own = NO_OWN, style, ...rest }: PaddedProps,
  device: EdgeInsets,
  content: EdgeInsets,
) {
  const { top, bottom } = own;
  const padding = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [bit, key, side] of SIDES) {
      const insets = safeArea & (bit << CONTENT_SHIFT) ? content : safeArea & bit ? device : null;
      if (insets !== null)
        out[key] = insets[side] + (side === 'top' ? top : side === 'bottom' ? bottom : 0);
    }
    return out;
  }, [safeArea, device, content, top, bottom]);
  return createElement(View, { ...rest, style: [style, padding] });
}
