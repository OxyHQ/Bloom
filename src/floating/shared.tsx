/**
 * The pieces of a menu ROW's shape that both the row set and BOTH sub-menu
 * implementations need.
 *
 * `menu-rows.tsx` is universal; `menu-sub-inline.tsx` and `menu-sub-flyout.tsx`
 * are the native and web halves of the sub trio and cannot import it (it imports
 * them). This module is what they share instead of each re-deriving a row's
 * inset, its type or its `inset` gutter — a sub-trigger that disagreed with the
 * rows above it by two pixels is exactly the drift this prevents.
 */
import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, type TextStyle, type ViewStyle } from 'react-native';

import { BREAKPOINTS } from '../styles/breakpoints';
import {
  ROW_GAP,
  ROW_INSET_PADDING_X,
  ROW_PADDING_X,
  ROW_PADDING_Y,
  ROW_PADDING_Y_SM,
  ROW_RADIUS,
  TEXT_SM,
  TEXT_SM_LINE_HEIGHT,
} from './constants';

/**
 * `py-2 sm:py-1.5` — 8px of row inset below 640px, 6px from there up, and the
 * `text-sm` type the row is set in.
 *
 * Returned as a whole style object rather than a number so the row kinds that
 * share it cannot each re-derive it, and so the LIST of properties that override
 * `Item`'s defaults is written once: horizontal inset, gap, radius and the
 * removal of `Item`'s minimum height, which upstream does not have.
 */
export function useRowStyle(): ViewStyle {
  const { width } = useWindowDimensions();
  const paddingVertical = width >= BREAKPOINTS.sm ? ROW_PADDING_Y_SM : ROW_PADDING_Y;
  return useMemo(
    () => ({
      // Longhands, for the reason spelled out in `item/Item.tsx`: on web a
      // `paddingHorizontal` here would outrank the `paddingLeft` a gutter or
      // `inset` row sets after it, whatever the array order.
      paddingLeft: ROW_PADDING_X,
      paddingRight: ROW_PADDING_X,
      paddingVertical,
      gap: ROW_GAP,
      borderRadius: ROW_RADIUS,
      // Explicitly 0, not `undefined`: a later `undefined` in an RN style array
      // is merged as a key that exists, so whether it CLEARS `Item`'s 36/44 or
      // is skipped depends on the flattener. Upstream sets no minimum at all, so
      // say that in a value both platforms read the same way.
      minHeight: 0,
    }),
    [paddingVertical],
  );
}

/**
 * A string child becomes the row's TITLE so `Item` colours it (destructive,
 * disabled); anything else is rendered verbatim, which is shadcn's own
 * `<Icon /><Text>…</Text>` composition.
 */
export function splitChildren(children: React.ReactNode): {
  title?: string;
  body?: React.ReactNode;
} {
  return typeof children === 'string' ? { title: children } : { body: children };
}

export const rowShapeStyles = StyleSheet.create({
  // `text-sm` with no weight of its own: a menu row's label is body text, where
  // `Item`'s is a 15px medium settings-row title.
  rowText: {
    fontSize: TEXT_SM,
    lineHeight: TEXT_SM_LINE_HEIGHT,
    fontWeight: '400',
  } as TextStyle,
  // `pl-8` — a plain row asking to line up with an indicator row.
  inset: {
    paddingLeft: ROW_INSET_PADDING_X,
  },
  // The one row upstream gives no `gap-2`.
  subTrigger: {
    gap: 0,
  },
});
