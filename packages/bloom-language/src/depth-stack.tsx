import { createElement, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import type { OverlayAlignment } from './tokens';

/** The two halves of an alignment: across (leading, center, trailing) and down (top, center, bottom). */
function halves(alignment: OverlayAlignment): readonly [string, string] {
  if (alignment.includes('-')) {
    const [vertical, horizontal] = alignment.split('-') as [string, string];
    return [horizontal, vertical];
  }
  if (alignment === 'top' || alignment === 'bottom') return ['center', alignment];
  return [alignment, 'center'];
}

const ACROSS: Record<string, 'flex-start' | 'center' | 'flex-end'> = {
  leading: 'flex-start',
  center: 'center',
  trailing: 'flex-end',
};
const DOWN: Record<string, 'flex-start' | 'center' | 'flex-end'> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
};
/** How much of a child's height lies above the line the children share: none, half, all. */
const ABOVE: Record<string, number> = { top: 0, center: 0.5, bottom: 1 };

interface Placed {
  readonly box: object;
  readonly slot: object;
  readonly above: number;
}

const placements = new Map<OverlayAlignment, Placed>();
function placed(alignment: OverlayAlignment): Placed {
  let out = placements.get(alignment);
  if (out === undefined) {
    const [across, down] = halves(alignment);
    out = {
      // The children's box: it fills the stack's own and places the line they share.
      box: Object.freeze({ flexGrow: 1, justifyContent: DOWN[down] }),
      slot: Object.freeze({ position: 'static', alignItems: ACROSS[across] }),
      above: ABOVE[down] as number,
    };
    placements.set(alignment, out);
  }
  return out;
}

export interface DepthStackProps {
  alignment: OverlayAlignment;
  children: readonly ReactNode[];
}

/**
 * A ZStack's children, laid out as SwiftUI lays them: the stack is as big as
 * its largest child, and each child sits at the alignment.
 *
 * Each child is in a slot of the stack's width (so the stack is as wide as the
 * widest child, and the slot places it across), and the slots share one line:
 * a slot's margins take back its own height, half of it above the line for a
 * centred stack, so no slot moves another. The box is as tall as the tallest
 * slot and its justification puts the line at the top, the middle or the
 * bottom. Each slot's height is the one its own layout reports (`onLayout`, on
 * every platform), kept in state; a margin never changes it, so the layout it
 * causes settles. A slot is `static`, so a child pinned to its parent
 * (`Fill()`, `.position()`) is pinned to the stack and takes no part in its size.
 */
export function DepthStack({ alignment, children }: DepthStackProps): ReactNode {
  const { box, slot, above } = placed(alignment);
  const [heights, setHeights] = useState<readonly number[]>([]);
  const laidOut = (index: number) => (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setHeights((last) => {
      if (last[index] === height) return last;
      const next = [...last];
      next[index] = height;
      return next;
    });
  };
  let tallest = 0;
  for (let i = 0; i < children.length; i++) tallest = Math.max(tallest, heights[i] ?? 0);
  return createElement(
    View,
    { style: tallest > 0 ? [box, { minHeight: tallest }] : box, pointerEvents: 'box-none' },
    ...children.map((child, i) => {
      const height = heights[i] ?? 0;
      const top = height * above;
      return createElement(
        View,
        {
          key: i,
          onLayout: laidOut(i),
          pointerEvents: 'box-none',
          style: height === 0 ? slot : [slot, { marginTop: 0 - top, marginBottom: top - height }],
        },
        child,
      );
    }),
  );
}
