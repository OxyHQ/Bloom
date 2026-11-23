import { useMemo, type ReactElement } from 'react';
import {
  CompositionBar as BloomCompositionBar,
  type CompositionBarProps,
  type CompositionCategory,
} from '@oxy.so/bloom/composition-bar';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ColorToken } from '../tokens';
import type { ControlRenderer } from './draw';

/** What a total is made of: a segmented bar with a readout (Bloom `composition-bar`). */
export type CompositionBarKind = 'compositionBar';

/** One segment: Bloom's `CompositionCategory`, its colour a role. */
export interface CompositionSegment {
  readonly key: string;
  readonly name: string;
  /** Its magnitude; its width is its share of the total. */
  readonly amount: number;
  readonly tint: ColorToken;
}

/** Bloom `CompositionBar`: its segments in order, the pressed one's share read out under it. */
export interface CompositionBarView extends ViewModifiers<CompositionBarView> {
  /** The readout of the chosen segment, from its amount and its share (0 to 100). */
  readoutFormat(value: (amount: number, percent: number) => string): CompositionBarView;
}

/**
 * Bloom `CompositionBar`: `segments` left to right; `selection` holds the
 * chosen segment's key (a press sets it); `hint` shows under the bar while
 * none is chosen.
 */
export function CompositionBar(
  segments: readonly CompositionSegment[],
  selection: Binding<string | null>,
  hint: string,
): CompositionBarView {
  return new Node('compositionBar', { segments, selection, hint }, []);
}

interface TintedProps extends Omit<CompositionBarProps, 'categories'> {
  readonly segments: readonly CompositionSegment[];
  /** Each segment's colour, painted from its role. */
  readonly tints: readonly string[];
}

/** Bloom's bar with each segment's painted colour as its category's `color`. */
function TintedCompositionBar({ segments, tints, ...props }: TintedProps): ReactElement {
  const categories = useMemo<CompositionCategory[]>(
    () =>
      segments.map(({ key, name, amount }, index) => ({
        key,
        name,
        amount,
        color: tints[index] as string,
      })),
    [segments, tints],
  );
  return <BloomCompositionBar {...props} categories={categories} />;
}

export const COMPOSITION_BARS: Record<CompositionBarKind, ControlRenderer> = {
  compositionBar: (d) => {
    const { segments, selection, hint } = d.node.props as {
      segments: readonly CompositionSegment[];
      selection: Binding<string | null>;
      hint: string;
    };
    const props = d.props();
    Object.assign(props, {
      segments,
      selectedKey: selection[0],
      onSelect: selection[1],
      hintLabel: hint,
      formatReadout: d.own('readoutFormat')?.value,
      testID: d.testID,
    });
    return d.painted(TintedCompositionBar, props, {
      tints: segments.map((segment) => segment.tint),
    });
  },
};
