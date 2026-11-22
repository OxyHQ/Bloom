import { createElement, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

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

function heightOf(node: unknown): number | undefined {
  const height = (node as { offsetHeight?: unknown } | null)?.offsetHeight;
  return typeof height === 'number' ? height : undefined;
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
 * slot (measured as it lays out, before it paints) and its justification puts
 * the line at the top, the middle or the bottom. A slot is `static`, so a child
 * pinned to its parent (`Fill()`, `.position()`) is pinned to the stack and
 * takes no part in its size.
 */
export function DepthStack({ alignment, children }: DepthStackProps): ReactNode {
  const { box, slot, above } = placed(alignment);
  const slots = useRef<unknown[]>([]);
  const [heights, setHeights] = useState<readonly number[]>([]);
  const measure = () => {
    const next = children.map((_, i) => heightOf(slots.current[i]) ?? 0);
    setHeights((last) =>
      last.length === next.length && last.every((h, i) => h === next[i]) ? last : next,
    );
  };
  // Before the first paint (a layout effect's update is applied before it), and
  // again when a slot's own layout changes later.
  useLayoutEffect(measure);
  let tallest = 0;
  for (const height of heights) tallest = Math.max(tallest, height);
  return createElement(
    View,
    { style: tallest > 0 ? [box, { minHeight: tallest }] : box, pointerEvents: 'box-none' },
    ...children.map((child, i) => {
      const height = heights[i] ?? 0;
      return createElement(
        View,
        {
          key: i,
          ref: (node: unknown) => {
            slots.current[i] = node;
          },
          onLayout: measure,
          pointerEvents: 'box-none',
          style:
            height === 0
              ? slot
              : [slot, { marginTop: -height * above, marginBottom: -height * (1 - above) }],
        },
        child,
      );
    }),
  );
}
