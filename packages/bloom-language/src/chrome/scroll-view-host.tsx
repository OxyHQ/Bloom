/**
 * A `ScrollView` as Bloom's `ScreenScrollView`, on every platform: the
 * screen's scroller, which binds the header's fade, the bottom bar's fold, the
 * screen's reselect and, with a footer that follows the keyboard, keeps the
 * focused input above it. Its modifiers are the scroll view's own props.
 */
import type { ComponentType, ReactNode } from 'react';
import { RefreshControl, type StyleProp, type ViewStyle } from 'react-native';
import { ScreenScrollView, type ScreenScrollViewProps } from '@oxy.so/bloom/screen';

import { refreshing, type RefreshTint } from '../binding';
import type { Edge, Modifier, Node } from '../node';
import { drawLeaf, type Paint, paintedLeaf } from '../paint';
import { valuesOf } from '../platform/values';
import { type InsetRoom, withRoom } from './safe-area-inset';
import type { NodeHostProps } from '../platform/host.types';
import { role } from '../style';
import { resolveSpace, tokenKey } from '../tokens';
import type {
  ColorToken,
  KeyboardDismiss,
  KeyboardTaps,
  ScrollIndicators,
  SpaceToken,
} from '../tokens';

/** Each edge's padding key in a content container style. */
const EDGE_PADDING: Record<Edge, keyof ViewStyle> = {
  all: 'padding',
  horizontal: 'paddingHorizontal',
  vertical: 'paddingVertical',
  top: 'paddingTop',
  bottom: 'paddingBottom',
  leading: 'paddingStart',
  trailing: 'paddingEnd',
  left: 'paddingLeft',
  right: 'paddingRight',
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
  let grows = false;
  for (const modifier of node.modifiers) {
    if (modifier.kind === 'contentMargins') {
      margins.push(modifier);
      key += `|${modifier.key}`;
    } else if (modifier.kind === 'contentGrows') grows = modifier.value;
  }
  if (grows) key += '|grow';
  if (key === '') return undefined;
  let style = containerStyles.get(key);
  if (style === undefined) {
    const out: Record<string, number> = {};
    // A later margin of an edge replaces the earlier one.
    for (const margin of margins) out[EDGE_PADDING[margin.edge]] = resolveSpace(margin.value);
    if (spacing !== undefined) out.gap = resolveSpace(spacing);
    if (grows) out.flexGrow = 1;
    style = Object.freeze(out) as ViewStyle;
    containerStyles.set(key, style);
  }
  return style;
}

function indicators(value: ScrollIndicators): boolean | undefined {
  return value === 'automatic' ? undefined : value === 'visible';
}

const refreshPaints = new Map<string, Paint>();

/** A role, or a role at an opacity, as a paint's colour. */
function colorOf(tint: ColorToken) {
  const { role: name, opacity } = role(tint);
  return opacity === undefined ? ([name] as const) : ([name, opacity] as const);
}

/**
 * A refresh control's tint: its `tintColor` (iOS) and its `colors` (Android),
 * from one role, as an app hands it its theme's colour, or each platform's own.
 * One paint per tint.
 */
function refreshPaint(tint: RefreshTint<ColorToken>): Paint {
  const { ios, android } = typeof tint === 'string' ? { ios: tint, android: tint } : tint;
  const key = `${ios ?? ''}|${android ?? ''}`;
  let paint = refreshPaints.get(key);
  if (paint === undefined) {
    paint = {
      style: undefined,
      styleRoles: [],
      propRoles: ios === undefined ? [] : [['tintColor', ...colorOf(ios)]],
      propLists: android === undefined ? [] : [['colors', [colorOf(android)]]],
    };
    refreshPaints.set(key, paint);
  }
  return paint;
}

/** What a tinted refresh control takes beside its scroll view's props. */
interface RefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
  colors?: string[];
}

/**
 * A scroll view whose refresh control takes the tint painted from its tree's
 * palette, around the scroll view, since the control is a prop.
 */
function TintedScrollView({
  refreshing,
  onRefresh,
  tintColor,
  colors,
  ...props
}: ScreenScrollViewProps & RefreshProps) {
  return (
    <ScreenScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          colors={colors}
        />
      }
    />
  );
}

/** `TintedScrollView` as a painted host (which types its host's props loosely). */
const TINTED_HOST = TintedScrollView as unknown as ComponentType<Record<string, unknown>>;

interface ScrollViewHostProps extends NodeHostProps {
  children?: ReactNode;
  /** The room views pinned at its edges take (`.safeAreaInset()`, `.safeAreaBar()`). */
  room?: InsetRoom;
  /** The content is laid out in a view of its own (`.contentView()`), whose style is `style`. */
  contentView?: boolean;
  /** The content view's style, as a stack of its modifiers is drawn (`drawScrollContent`). */
  style?: StyleProp<ViewStyle>;
}

export function ScrollViewHost({
  node,
  palette,
  room,
  children,
  contentView,
  style,
}: ScrollViewHostProps) {
  const values = valuesOf(node);
  // Only what the chain sets: an explicit undefined would replace the scroll view's own defaults.
  const props: { -readonly [K in keyof ScreenScrollViewProps]: ScreenScrollViewProps[K] } = {};
  const container = withRoom(containerStyle(node, values.spacing as SpaceToken | undefined), room);
  if (contentView) {
    // Bloom lays the content out in a view of its own inside the content
    // container (`contentView`), styled by `contentContainerStyle`: the content
    // view's own style, then its margins and spacing.
    props.contentView = true;
    props.contentContainerStyle = container ? [style, container] : style;
  } else if (container) props.contentContainerStyle = container;
  const dismiss = values.scrollDismissesKeyboard as KeyboardDismiss | undefined;
  if (dismiss) props.keyboardDismissMode = DISMISS_MODE[dismiss];
  if (values.keyboardTaps) props.keyboardShouldPersistTaps = values.keyboardTaps as KeyboardTaps;
  let vertical: boolean | undefined;
  let horizontal: boolean | undefined;
  let refresh: Extract<Modifier, { kind: 'refreshable' }> | undefined;
  for (const modifier of node.modifiers) {
    if (modifier.kind === 'onEndReached') {
      props.onEndReached = modifier.value;
      if (modifier.threshold !== undefined) props.onEndReachedThreshold = modifier.threshold;
    } else if (modifier.kind === 'scrollIndicators') {
      // A later one replaces an earlier one on the axes it names.
      const shown = indicators(modifier.value);
      if (modifier.axis !== 'horizontal') vertical = shown;
      if (modifier.axis !== 'vertical') horizontal = shown;
    } else if (modifier.kind === 'refreshable') {
      refresh = modifier;
    }
  }
  if (vertical !== undefined) props.showsVerticalScrollIndicator = vertical;
  if (horizontal !== undefined) props.showsHorizontalScrollIndicator = horizontal;
  if (values.testID !== undefined) props.testID = values.testID as string;
  if (refresh?.tint !== undefined) {
    return drawLeaf(
      paintedLeaf(palette, {
        ...props,
        ...refreshing(refresh.value),
        host: TINTED_HOST,
        paint: refreshPaint(refresh.tint),
        children,
      }),
    );
  }
  if (refresh) props.refreshControl = <RefreshControl {...refreshing(refresh.value)} />;
  return <ScreenScrollView {...props}>{children}</ScreenScrollView>;
}
