/**
 * A `ScrollView` as Bloom's `ScreenScrollView`, on every platform: the
 * screen's scroller, which binds the header's fade, the bottom bar's fold, the
 * screen's reselect and, with a footer that follows the keyboard, keeps the
 * focused input above it. Its modifiers are the scroll view's own props.
 */
import { useState, type ReactNode } from 'react';
import { RefreshControl, type ViewStyle } from 'react-native';
import { ScreenScrollView, type ScreenScrollViewProps } from '@oxy.so/bloom/screen';

import type { Edge, Modifier, Node, RefreshAction } from '../node';
import { valuesOf } from '../platform/values';
import type { NodeHostProps } from '../platform/host.types';
import { resolveSpace, tokenKey } from '../tokens';
import type { KeyboardDismiss, KeyboardTaps, ScrollIndicators, SpaceToken } from '../tokens';

/** Each edge's padding key in a content container style. */
const EDGE_PADDING: Record<Edge, keyof ViewStyle> = {
  all: 'padding',
  horizontal: 'paddingHorizontal',
  vertical: 'paddingVertical',
  top: 'paddingTop',
  bottom: 'paddingBottom',
  leading: 'paddingStart',
  trailing: 'paddingEnd',
};

/** SwiftUI's keyboard dismissal, as React Native's `keyboardDismissMode`. */
export const DISMISS_MODE = {
  never: 'none',
  immediately: 'on-drag',
  interactively: 'interactive',
} as const satisfies Record<KeyboardDismiss, string>;

/**
 * One frozen content container style per set of margins and gap: a re-render
 * hands the same object. Every scroll of the language's (`ScrollView`,
 * `ScrollArea`, `ScrollSurface`) takes its margins and gap from here.
 */
const containerStyles = new Map<string, ViewStyle>();

export function containerStyle(node: Node, spacing: SpaceToken | undefined): ViewStyle | undefined {
  let key = spacing === undefined ? '' : `g:${tokenKey(spacing)}`;
  const margins: Extract<Modifier, { kind: 'contentMargins' }>[] = [];
  for (const modifier of node.modifiers) {
    if (modifier.kind === 'contentMargins') {
      margins.push(modifier);
      key += `|${modifier.key}`;
    }
  }
  if (key === '') return undefined;
  let style = containerStyles.get(key);
  if (style === undefined) {
    const out: Record<string, number> = {};
    // A later margin of an edge replaces the earlier one.
    for (const margin of margins) out[EDGE_PADDING[margin.edge]] = resolveSpace(margin.value);
    if (spacing !== undefined) out.gap = resolveSpace(spacing);
    style = Object.freeze(out) as ViewStyle;
    containerStyles.set(key, style);
  }
  return style;
}

function indicators(value: ScrollIndicators | undefined): boolean | undefined {
  return value === undefined || value === 'automatic' ? undefined : value === 'visible';
}

/** Pull to refresh: the spinner shows from the pull until what the action returns settles. */
function useRefresh(action: RefreshAction | undefined) {
  const [refreshing, setRefreshing] = useState(false);
  if (action === undefined) return undefined;
  const onRefresh = () => {
    setRefreshing(true);
    Promise.resolve(action()).finally(() => setRefreshing(false));
  };
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
}

export function ScrollViewHost({ node, children }: NodeHostProps & { children?: ReactNode }) {
  const values = valuesOf(node);
  const refreshControl = useRefresh(values.refreshable as RefreshAction | undefined);
  // Only what the chain sets: an explicit undefined would replace the scroll view's own defaults.
  const props: { -readonly [K in keyof ScreenScrollViewProps]: ScreenScrollViewProps[K] } = {};
  const container = containerStyle(node, values.spacing as SpaceToken | undefined);
  if (container) props.contentContainerStyle = container;
  const shown = indicators(values.scrollIndicators as ScrollIndicators | undefined);
  if (shown !== undefined) {
    props.showsVerticalScrollIndicator = shown;
    props.showsHorizontalScrollIndicator = shown;
  }
  const dismiss = values.scrollDismissesKeyboard as KeyboardDismiss | undefined;
  if (dismiss) props.keyboardDismissMode = DISMISS_MODE[dismiss];
  if (values.keyboardTaps) props.keyboardShouldPersistTaps = values.keyboardTaps as KeyboardTaps;
  for (const modifier of node.modifiers) {
    if (modifier.kind !== 'onEndReached') continue;
    props.onEndReached = modifier.value;
    if (modifier.threshold !== undefined) props.onEndReachedThreshold = modifier.threshold;
  }
  if (refreshControl) props.refreshControl = refreshControl;
  if (values.testID !== undefined) props.testID = values.testID as string;
  return <ScreenScrollView {...props}>{children}</ScreenScrollView>;
}
