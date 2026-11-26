import type { Ref } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';

import { containerStyle, DISMISS_MODE } from '../chrome/scroll-view-host';
import { Node, type Child, type ViewModifiers } from '../node';
import { valuesOf } from '../platform/values';
import { ALIGNMENT } from '../generated/spec.generated';
import type {
  Alignment,
  Axis,
  Edge,
  Justify,
  KeyboardDismiss,
  KeyboardTaps,
  ScrollIndicators,
  SpaceToken,
} from '../tokens';
import { type ControlRenderer, defineControls } from './draw';

/** A plain scroll of its own (React Native's `ScrollView`), bounded by its frame. */
export type ScrollPaneKind = 'scrollPane';

/**
 * React Native's scroll events (`.scrollEvents()`), handed to the scroll view
 * as its props: what a view that follows its scroll listens to.
 */
export type ScrollEvents = Pick<
  ScrollViewProps,
  | 'onScroll'
  | 'scrollEventThrottle'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  | 'onContentSizeChange'
>;

/**
 * React Native's `ScrollView`: a scroll of its own inside a dialog, a panel or
 * a pane, bounded by its frame (`.frame({ maxHeight: 340 })`). Its box
 * modifiers are the scroll view's `style`; its children are its content, laid
 * out in its content container. The screen's scroller is `ScrollView`, and a
 * scroll with Bloom's own bar `ScrollArea`.
 */
export interface ScrollPaneView extends ViewModifiers<ScrollPaneView> {
  /** The scroll view itself (`scrollToEnd`, `scrollTo`), React Native's `ref`. */
  ref(value: Ref<ScrollViewInstance>): ScrollPaneView;
  /** `horizontal` scrolls across (React Native's `horizontal`); `vertical` by default. */
  axis(value: Axis): ScrollPaneView;
  /** Room around the content, inside the scroll (the content container's padding). */
  contentMargins(value: SpaceToken): ScrollPaneView;
  contentMargins(edge: Edge, value: SpaceToken): ScrollPaneView;
  /**
   * The content container grows to fill the scroll (`flexGrow: 1`), so content
   * shorter than it can sit at its end (`.justify('end')`) or centre.
   */
  contentGrows(on?: boolean): ScrollPaneView;
  /** The gap between the content's children. */
  spacing(value: SpaceToken): ScrollPaneView;
  /** The children's place across the axis (the content container's `alignItems`). */
  align(value: Alignment): ScrollPaneView;
  /** How the children spread along the axis (the content container's `justifyContent`). */
  justify(value: Justify): ScrollPaneView;
  /** Whether its bar shows (`visible`, `hidden`; the platform's by default), on one axis or both. */
  scrollIndicators(value: ScrollIndicators, axis?: Axis): ScrollPaneView;
  /** Whether it bounces past its ends (iOS; it does by default), React Native's `bounces`. */
  bounces(on?: boolean): ScrollPaneView;
  /** A drag `immediately` dismisses the keyboard, or drags it away `interactively`; `never` by default. */
  scrollDismissesKeyboard(value: KeyboardDismiss): ScrollPaneView;
  /** Whether a tap with the keyboard up reaches the content: `handled` by a control, `always`, or `never` (default). */
  keyboardTaps(value: KeyboardTaps): ScrollPaneView;
  /**
   * React Native's scroll events, as its props: `onScroll` (at most every
   * `scrollEventThrottle` ms), a drag's and a fling's start and end, and the
   * content's size changing.
   */
  scrollEvents(value: ScrollEvents): ScrollPaneView;
}

/** A plain scroll (React Native's `ScrollView`); its children are its content. */
export function ScrollPane(...children: Child[]): ScrollPaneView {
  return new Node('scrollPane', null, children);
}

const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const satisfies Record<Justify, ViewStyle['justifyContent']>;

/**
 * The content container's style: the scroll's margins, spacing and growth
 * (one frozen style per set, as the screen's scroller has them), then its
 * alignment; one style per base and alignment.
 */
const aligned = new Map<ViewStyle | undefined, Map<string, ViewStyle>>();
function contentStyle(
  node: Node,
  spacing: SpaceToken | undefined,
  align: Alignment | undefined,
  justify: Justify | undefined,
): ViewStyle | undefined {
  const base = containerStyle(node, spacing);
  if (align === undefined && justify === undefined) return base;
  let byAlignment = aligned.get(base);
  if (byAlignment === undefined) {
    byAlignment = new Map();
    aligned.set(base, byAlignment);
  }
  const key = `${align ?? ''}|${justify ?? ''}`;
  let style = byAlignment.get(key);
  if (style === undefined) {
    const out: { -readonly [K in keyof ViewStyle]: ViewStyle[K] } = { ...base };
    if (align !== undefined) out.alignItems = ALIGNMENT[align];
    if (justify !== undefined) out.justifyContent = JUSTIFY[justify];
    style = Object.freeze(out) as ViewStyle;
    byAlignment.set(key, style);
  }
  return style;
}

const SCROLL_PANES: Record<ScrollPaneKind, ControlRenderer> = {
  // Its box is the scroll view's `style`, as an app writes it; the view's
  // behaviour (its ref, its layout, its accessibility) is the scroll view's.
  scrollPane: (d) => {
    const { node } = d;
    const values = valuesOf(node);
    // Only what the chain sets: an explicit undefined would replace React Native's defaults.
    const props: Record<string, unknown> = {
      ...d.props(),
      ...(values.scrollEvents as ScrollEvents | undefined),
    };
    const content = contentStyle(
      node,
      values.spacing as SpaceToken | undefined,
      values.align as Alignment | undefined,
      values.justify as Justify | undefined,
    );
    if (content !== undefined) props.contentContainerStyle = content;
    if (values.axis === 'horizontal') props.horizontal = true;
    if (values.bounces !== undefined) props.bounces = values.bounces;
    const dismiss = values.scrollDismissesKeyboard as KeyboardDismiss | undefined;
    if (dismiss !== undefined) props.keyboardDismissMode = DISMISS_MODE[dismiss];
    if (values.keyboardTaps !== undefined) props.keyboardShouldPersistTaps = values.keyboardTaps;
    for (const modifier of node.modifiers) {
      if (modifier.kind !== 'scrollIndicators' || modifier.value === 'automatic') continue;
      // A later one replaces an earlier one on the axes it names.
      const shown = modifier.value === 'visible';
      if (modifier.axis !== 'horizontal') props.showsVerticalScrollIndicator = shown;
      if (modifier.axis !== 'vertical') props.showsHorizontalScrollIndicator = shown;
    }
    return d.component(ScrollView, props, ...d.children(node.children));
  },
};
defineControls(SCROLL_PANES);
