import { createElement, type ReactElement, type ReactNode, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { Node, type Child, type ViewModifiers } from '../node';
import type { Axis } from '../tokens';
import type { ControlRenderer } from './draw';

export type ViewThatFitsKind = 'viewThatFits';

/** SwiftUI's `ViewThatFits`: the first of its candidates whose ideal size fits, along an axis. */
export type ViewThatFitsView = ViewModifiers<ViewThatFitsView>;

/**
 * The first candidate whose ideal size along `axis` fits the room it is
 * given, else the last (SwiftUI's `ViewThatFits(in:)`): adaptation to content
 * (a long translation, a count, a toolbar label) that a breakpoint `when()`
 * cannot express. Each candidate is measured once more, out of sight, so keep
 * them small and few.
 */
export function ViewThatFits(axis: Axis, ...candidates: Child[]): ViewThatFitsView {
  return new Node('viewThatFits', { axis }, candidates);
}

const SIZE = { horizontal: 'width', vertical: 'height' } as const;

/**
 * Draws the candidate that fits: the room is the box's own layout, and each
 * candidate's ideal size is its layout in an unbounded, hidden, absolute row
 * (or column), so nothing wraps or shrinks it. Until both are known the first
 * candidate is drawn. A measure that changes nothing renders nothing.
 */
function FitsHost({
  axis,
  candidates,
  style,
  testID,
}: {
  axis: Axis;
  candidates: readonly ReactNode[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}): ReactElement {
  const size = SIZE[axis];
  const [room, setRoom] = useState<number | undefined>(undefined);
  const [ideal, setIdeal] = useState<readonly (number | undefined)[]>(() =>
    candidates.map(() => undefined),
  );
  const measured = (index: number) => (event: LayoutChangeEvent) => {
    const value = event.nativeEvent.layout[size];
    setIdeal((last) =>
      last[index] === value ? last : last.map((v, i) => (i === index ? value : v)),
    );
  };
  let chosen = 0;
  if (room !== undefined && ideal.every((value) => value !== undefined)) {
    const fits = ideal.findIndex((value) => (value as number) <= room);
    chosen = fits === -1 ? candidates.length - 1 : fits;
  }
  return createElement(
    View,
    {
      style,
      testID,
      onLayout: (event: LayoutChangeEvent) => {
        const value = event.nativeEvent.layout[size];
        setRoom((last) => (last === value ? last : value));
      },
    },
    candidates[chosen],
    createElement(
      View,
      {
        key: 'measure',
        style: axis === 'horizontal' ? styles.row : styles.column,
        pointerEvents: 'none',
        'aria-hidden': true,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      },
      ...candidates.map((candidate, index) =>
        createElement(
          View,
          { key: index, style: styles.ideal, onLayout: measured(index) },
          candidate,
        ),
      ),
    ),
  );
}

const UNBOUNDED = 100000;
const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: UNBOUNDED,
    flexDirection: 'row',
    opacity: 0,
  },
  column: { position: 'absolute', top: 0, left: 0, height: UNBOUNDED, opacity: 0 },
  ideal: { alignSelf: 'flex-start' },
});

export const VIEWS_THAT_FIT: Record<ViewThatFitsKind, ControlRenderer> = {
  viewThatFits: (d) =>
    d.component(FitsHost, {
      ...d.props(),
      axis: (d.node.props as { axis: Axis }).axis,
      candidates: d.children(d.node.children),
    }),
};
