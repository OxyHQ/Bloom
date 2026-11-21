import type { MotionValue } from '@oxy.so/bloom/motion';
import type { ComponentType, ReactNode } from 'react';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  GestureResponderEvent,
  Insets,
} from 'react-native';
import type { BloomAppearance, BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import type {
  BloomImageErrorInfo,
  BloomImageLoadInfo,
  BloomImageSource,
} from '@oxy.so/bloom/image';
import type { AccentTone } from '@oxy.so/bloom/theme';

import { regular, type GlassValue } from './glass';
import type { KeyframesValue } from './motion/keyframes';
import type { Namespace } from './motion/namespace';
import type { MotionToken, RotationName, ScaleName } from './motion/tokens';
import { motionKey } from './motion/tokens';
import type { TransitionValue } from './motion/transition';
import {
  tokenKey,
  type Alignment,
  type BorderEdge,
  type ButtonShape,
  type ContentFit,
  type DurationName,
  type Edge,
  type Role,
  type ShrinkPriority,
  type AvatarSizeName,
  type BorderWidthName,
  type ColorName,
  type CornerName,
  type FontName,
  type HitSlopName,
  type IconSizeToken,
  type LeadingToken,
  type OpacityName,
  type PaddingToken,
  type SpaceToken,
  type WeightName,
} from './tokens';

// ── Modifiers: immutable data, applied in order ──────────────────

export type { Alignment, BorderEdge, ButtonShape, ContentFit, Edge, Role, ShrinkPriority };
export type { GlassValue };
export type EngagementTone = Exclude<AccentTone, 'default'>;
export type IconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export type PressHandler = (event: GestureResponderEvent) => unknown;
export type ImageLoadHandler = (info: BloomImageLoadInfo) => void;
export type ImageErrorHandler = (info: BloomImageErrorInfo) => void;

/** Where a view is moved from its place: a space token each way (a negative one moves it back). */
/** A move along each axis: a space token, or a `MotionValue` the view follows. */
export interface OffsetSpec {
  x?: PaddingToken | MotionValue;
  y?: PaddingToken | MotionValue;
}

/** What `.drag()` takes besides its value. */
export interface DragSpec {
  /** The axis the finger moves the value along. Default `'y'`. */
  axis?: 'x' | 'y';
  /** Bounds of the value while dragging. */
  min?: number;
  max?: number;
  /** Once per touch, when it ends: where the value is and the finger's velocity. */
  onEnd?: (end: { value: number; velocity: number }) => void;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface FrameSpec {
  width?: SpaceToken;
  height?: SpaceToken;
  minWidth?: SpaceToken;
  minHeight?: SpaceToken;
  maxWidth?: SpaceToken;
  maxHeight?: SpaceToken;
}

export type Modifier =
  | {
      readonly kind: 'padding';
      readonly key: string;
      readonly edge: Edge;
      readonly value: PaddingToken;
    }
  | { readonly kind: 'frame'; readonly key: string; readonly value: FrameSpec }
  | { readonly kind: 'grow'; readonly key: string }
  | { readonly kind: 'shrink'; readonly key: string; readonly value: ShrinkPriority }
  | { readonly kind: 'background'; readonly key: string; readonly value: ColorName }
  | {
      readonly kind: 'border';
      readonly key: string;
      readonly value: ColorName;
      readonly width: BorderWidthName;
      readonly edge: BorderEdge;
    }
  | { readonly kind: 'corner'; readonly key: string; readonly value: CornerName }
  | { readonly kind: 'opacity'; readonly key: string; readonly value: OpacityName }
  | { readonly kind: 'glass'; readonly key: string; readonly value: GlassValue }
  | { readonly kind: 'foreground'; readonly key: string; readonly value: ColorName }
  | { readonly kind: 'font'; readonly key: string; readonly value: FontName }
  | { readonly kind: 'weight'; readonly key: string; readonly value: WeightName }
  | { readonly kind: 'leading'; readonly key: string; readonly value: LeadingToken }
  | { readonly kind: 'spacing'; readonly key: string; readonly value: SpaceToken | 'between' }
  | { readonly kind: 'align'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'lines'; readonly key: string; readonly value: number }
  | { readonly kind: 'noWrap'; readonly key: string }
  | { readonly kind: 'contentFit'; readonly key: string; readonly value: ContentFit }
  | { readonly kind: 'aspectRatio'; readonly key: string; readonly value: number }
  | { readonly kind: 'crossFade'; readonly key: string; readonly value: DurationName }
  | { readonly kind: 'onLoad'; readonly key: string; readonly value: ImageLoadHandler | undefined }
  | {
      readonly kind: 'onError';
      readonly key: string;
      readonly value: ImageErrorHandler | undefined;
    }
  | {
      readonly kind: 'size';
      readonly key: string;
      readonly value: IconSizeToken | AvatarSizeName | BloomSize;
    }
  | { readonly kind: 'style'; readonly key: string; readonly value: BloomAppearance }
  | { readonly kind: 'shape'; readonly key: string; readonly value: ButtonShape }
  | {
      readonly kind: 'tint';
      readonly key: string;
      readonly value: EngagementTone | BloomTone | ColorName;
    }
  | { readonly kind: 'count'; readonly key: string; readonly value: number | null | undefined }
  | { readonly kind: 'active'; readonly key: string; readonly value: boolean | undefined }
  | { readonly kind: 'trailing'; readonly key: string; readonly value: readonly Child[] }
  | {
      readonly kind: 'countFormat';
      readonly key: string;
      readonly value: (count: number) => string;
    }
  | { readonly kind: 'onPress'; readonly key: string; readonly value: PressHandler | undefined }
  | { readonly kind: 'onLongPress'; readonly key: string; readonly value: (() => void) | undefined }
  | {
      readonly kind: 'onHover';
      readonly key: string;
      readonly enter: (() => void) | undefined;
      readonly leave: (() => void) | undefined;
    }
  | { readonly kind: 'hoverGroup'; readonly key: string }
  | { readonly kind: 'label'; readonly key: string; readonly value: string | undefined }
  | { readonly kind: 'hint'; readonly key: string; readonly value: string | undefined }
  | { readonly kind: 'role'; readonly key: string; readonly value: Role }
  | { readonly kind: 'hitSlop'; readonly key: string; readonly value: HitSlopName }
  | { readonly kind: 'testID'; readonly key: string; readonly value: string }
  | { readonly kind: 'id'; readonly key: string; readonly value: string | number }
  | { readonly kind: 'scale'; readonly key: string; readonly value: ScaleName | MotionValue }
  | { readonly kind: 'offset'; readonly key: string; readonly value: OffsetSpec }
  | { readonly kind: 'rotation'; readonly key: string; readonly value: RotationName | MotionValue }
  | {
      readonly kind: 'drag';
      readonly key: string;
      readonly value: MotionValue;
      readonly options: DragSpec;
    }
  | {
      readonly kind: 'swipe';
      readonly key: string;
      readonly direction: SwipeDirection;
      readonly onSwipe: () => void;
    }
  | {
      readonly kind: 'animation';
      readonly key: string;
      readonly motion: MotionToken;
      readonly value: unknown;
      readonly gated: boolean;
    }
  | { readonly kind: 'transition'; readonly key: string; readonly value: TransitionValue }
  | {
      readonly kind: 'keyframes';
      readonly key: string;
      readonly value: KeyframesValue;
      readonly trigger: unknown;
    }
  | {
      readonly kind: 'matchedGeometry';
      readonly key: string;
      readonly id: string;
      readonly namespace: Namespace;
    }
  | { readonly kind: 'pressScale'; readonly key: string }
  | {
      readonly kind: 'contentTransition';
      readonly key: string;
      readonly value: 'roll';
      readonly direction: number | undefined;
    }
  | { readonly kind: 'loop'; readonly key: string }
  | { readonly kind: 'paused'; readonly key: string; readonly value: boolean }
  | { readonly kind: 'fallback'; readonly key: string; readonly value: Child };

export type ModifierKind = Modifier['kind'];

// ── Nodes ────────────────────────────────────────────────────────

export type NodeKind =
  | 'stack'
  | 'spacer'
  | 'text'
  | 'icon'
  | 'avatar'
  | 'image'
  | 'button'
  | 'action'
  | 'actionBar'
  | 'actionGroup'
  | 'embed'
  | 'lottie'
  | 'view';

/** A node as data: its kind, props, children and ordered modifiers. Every view type is one. */
export interface ViewNode {
  readonly kind: NodeKind;
  readonly props: unknown;
  readonly children: readonly Child[];
  readonly modifiers: readonly Modifier[];
}

/** What a container takes. Strings and numbers belong in `Text`; `false`, `null` and `undefined` render nothing. */
export type Child = ViewNode | false | null | undefined | readonly Child[];
/** What a `Text` takes: runs of text, and nested `Text` for inline spans. */
export type TextRun = string | number | ViewNode | false | null | undefined;

export interface StackProps {
  readonly axis: 'horizontal' | 'vertical' | 'depth';
}
export interface TextProps {
  readonly runs: readonly TextRun[];
}
export interface IconProps {
  readonly icon: IconComponent;
}
export interface AvatarProps {
  readonly source: string | null | undefined;
  readonly options: AvatarOptions;
}
export interface AvatarOptions {
  /** Rendition requested for a bare file id (Bloom `Avatar`'s `variant`). */
  readonly variant?: string;
  readonly account?: Record<string, unknown>;
}
export interface ImageProps {
  readonly source: BloomImageSource | null | undefined;
  readonly alt: string | undefined;
}
export interface ActionProps {
  readonly icon: IconComponent;
  readonly label: string;
  readonly options: ActionOptions;
}
export interface ActionOptions {
  readonly activeIcon?: IconComponent;
  readonly pop?: boolean;
  readonly rollCount?: boolean;
  readonly busy?: boolean;
  readonly hitSlop?: Insets | number;
  readonly accessibilityActions?: readonly AccessibilityActionInfo[];
  readonly onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}
export interface LottieProps {
  /** A Lottie animation: a JSON document, a `require`d asset, or a URL. */
  readonly source: unknown;
}
export interface EmbedProps {
  /** A React element, or a function of a renderer that draws language nodes in the current environment. */
  readonly content: ReactNode | ((render: (child: Child) => ReactNode) => ReactNode);
}
export interface ViewNodeProps {
  /** The view's component: React's own memo of its host, so props compare key by key. */
  readonly component: ComponentType<object>;
  /** The props object the view was called with, handed to its body as is. */
  readonly props: object;
}

/**
 * What a node last rendered as, and where: the same node in the same
 * environment renders the same element, so React sees an unchanged element
 * and skips the subtree. A node that keeps its identity across renders (a
 * module constant, one the compiler hoisted, one the React Compiler kept)
 * costs one comparison per render.
 */
export interface Rendered {
  readonly env: unknown;
  readonly provided: unknown;
  readonly animation: unknown;
  readonly key: string | number | undefined;
  readonly element: ReactNode;
}

/**
 * One node of the tree: a kind, its props, its children, and the ordered list
 * of modifiers chained onto it. A chain call never changes the node it is
 * called on; it returns a new node with one more modifier.
 *
 * Every modifier method exists here; the exported constructor types
 * (`TextView`, `StackView`…) expose only the ones that apply to each kind.
 */
export class Node {
  /** The render memo (see `Rendered`). Internal to the renderer; not part of the node's value. */
  rendered: Rendered | undefined = undefined;

  constructor(
    readonly kind: NodeKind,
    readonly props: unknown,
    readonly children: readonly Child[],
    readonly modifiers: readonly Modifier[] = [],
  ) {}

  private with(modifier: Modifier): Node {
    return new Node(this.kind, this.props, this.children, [...this.modifiers, modifier]);
  }

  padding(edgeOrValue: Edge | PaddingToken, value?: PaddingToken): Node {
    const edge: Edge = value === undefined ? 'all' : (edgeOrValue as Edge);
    const token = value === undefined ? (edgeOrValue as PaddingToken) : value;
    return this.with({ kind: 'padding', key: `p:${edge}:${tokenKey(token)}`, edge, value: token });
  }
  frame(value: FrameSpec): Node {
    const parts: string[] = [];
    for (const name of FRAME_KEYS) {
      const token = value[name];
      if (token !== undefined) parts.push(`${name}=${tokenKey(token)}`);
    }
    return this.with({ kind: 'frame', key: `f:${parts.join(',')}`, value });
  }
  grow(): Node {
    return this.with({ kind: 'grow', key: 'grow' });
  }
  shrink(value: ShrinkPriority): Node {
    return this.with({ kind: 'shrink', key: `shrink:${value}`, value });
  }
  background(value: ColorName): Node {
    return this.with({ kind: 'background', key: `bg:${value}`, value });
  }
  border(value: ColorName, width: BorderWidthName = 'hairline', edge: BorderEdge = 'all'): Node {
    return this.with({ kind: 'border', key: `b:${value}:${width}:${edge}`, value, width, edge });
  }
  corner(value: CornerName): Node {
    return this.with({ kind: 'corner', key: `r:${value}`, value });
  }
  opacity(value: OpacityName): Node {
    return this.with({ kind: 'opacity', key: `o:${value}`, value });
  }
  glass(value: GlassValue = regular): Node {
    return this.with({ kind: 'glass', key: value.key, value });
  }
  foreground(value: ColorName): Node {
    return this.with({ kind: 'foreground', key: `fg:${value}`, value });
  }
  font(value: FontName): Node {
    return this.with({ kind: 'font', key: `font:${value}`, value });
  }
  weight(value: WeightName): Node {
    return this.with({ kind: 'weight', key: `w:${value}`, value });
  }
  leading(value: LeadingToken): Node {
    return this.with({ kind: 'leading', key: `lh:${tokenKey(value)}`, value });
  }
  spacing(value: SpaceToken | 'between'): Node {
    return this.with({ kind: 'spacing', key: `gap:${tokenKey(value)}`, value });
  }
  align(value: Alignment): Node {
    return this.with({ kind: 'align', key: `align:${value}`, value });
  }
  lines(value: number): Node {
    return this.with({ kind: 'lines', key: `lines:${value}`, value });
  }
  noWrap(): Node {
    return this.with({ kind: 'noWrap', key: 'nowrap' });
  }
  contentFit(value: ContentFit): Node {
    return this.with({ kind: 'contentFit', key: `fit:${value}`, value });
  }
  aspectRatio(value: number): Node {
    return this.with({ kind: 'aspectRatio', key: `aspect:${value}`, value });
  }
  crossFade(value: DurationName): Node {
    return this.with({ kind: 'crossFade', key: `crossFade:${value}`, value });
  }
  onLoad(value: ImageLoadHandler | undefined): Node {
    return this.with({ kind: 'onLoad', key: 'onLoad', value });
  }
  onError(value: ImageErrorHandler | undefined): Node {
    return this.with({ kind: 'onError', key: 'onError', value });
  }
  size(value: IconSizeToken | AvatarSizeName | BloomSize): Node {
    return this.with({ kind: 'size', key: `size:${tokenKey(value)}`, value });
  }
  style(value: BloomAppearance): Node {
    return this.with({ kind: 'style', key: `style:${value}`, value });
  }
  shape(value: ButtonShape): Node {
    return this.with({ kind: 'shape', key: `shape:${value}`, value });
  }
  tint(value: EngagementTone | BloomTone | ColorName): Node {
    return this.with({ kind: 'tint', key: `tint:${value}`, value });
  }
  count(value: number | null | undefined): Node {
    return this.with({ kind: 'count', key: 'count', value });
  }
  active(value: boolean | undefined): Node {
    return this.with({ kind: 'active', key: 'active', value });
  }
  trailing(...value: Child[]): Node {
    return this.with({ kind: 'trailing', key: 'trailing', value });
  }
  countFormat(value: (count: number) => string): Node {
    return this.with({ kind: 'countFormat', key: 'countFormat', value });
  }
  /**
   * The press handler. The modifier's PRESENCE makes the view pressable; an
   * `undefined` handler keeps the same host, out of the focus order, so a row
   * that is sometimes inert never changes element type (and never remounts).
   */
  onPress(value: PressHandler | undefined): Node {
    return this.with({ kind: 'onPress', key: 'onPress', value });
  }
  onLongPress(value: (() => void) | undefined): Node {
    return this.with({ kind: 'onLongPress', key: 'onLongPress', value });
  }
  onHover(enter: (() => void) | undefined, leave: (() => void) | undefined): Node {
    return this.with({ kind: 'onHover', key: 'onHover', enter, leave });
  }
  hoverGroup(): Node {
    return this.with({ kind: 'hoverGroup', key: 'hoverGroup' });
  }
  label(value: string | undefined): Node {
    return this.with({ kind: 'label', key: 'label', value });
  }
  hint(value: string | undefined): Node {
    return this.with({ kind: 'hint', key: 'hint', value });
  }
  role(value: Role): Node {
    return this.with({ kind: 'role', key: `role:${value}`, value });
  }
  hitSlop(value: HitSlopName): Node {
    return this.with({ kind: 'hitSlop', key: `hitSlop:${value}`, value });
  }
  testID(value: string): Node {
    return this.with({ kind: 'testID', key: 'testID', value });
  }
  /** The view's identity among its siblings (React's `key`), for lists that reorder. */
  id(value: string | number): Node {
    return this.with({ kind: 'id', key: 'id', value });
  }
  scale(value: ScaleName | MotionValue): Node {
    return this.with({ kind: 'scale', key: 'scale', value });
  }
  offset(value: OffsetSpec): Node {
    return this.with({ kind: 'offset', key: 'offset', value });
  }
  rotation(value: RotationName | MotionValue): Node {
    return this.with({ kind: 'rotation', key: 'rotation', value });
  }
  animation(motion: MotionToken, ...value: [unknown?]): Node {
    return this.with({
      kind: 'animation',
      key: `anim:${motionKey(motion)}`,
      motion,
      value: value[0],
      gated: value.length > 0,
    });
  }
  transition(value: TransitionValue): Node {
    return this.with({ kind: 'transition', key: 'transition', value });
  }
  keyframes(value: KeyframesValue, trigger: unknown): Node {
    return this.with({ kind: 'keyframes', key: 'keyframes', value, trigger });
  }
  matchedGeometry(id: string, namespace: Namespace): Node {
    return this.with({ kind: 'matchedGeometry', key: 'matchedGeometry', id, namespace });
  }
  pressScale(): Node {
    return this.with({ kind: 'pressScale', key: 'pressScale' });
  }
  drag(value: MotionValue, options: DragSpec = {}): Node {
    return this.with({ kind: 'drag', key: 'drag', value, options });
  }
  swipe(direction: SwipeDirection, onSwipe: () => void): Node {
    return this.with({ kind: 'swipe', key: 'swipe', direction, onSwipe });
  }
  contentTransition(value: 'roll', direction?: number): Node {
    return this.with({ kind: 'contentTransition', key: 'contentTransition', value, direction });
  }
  loop(): Node {
    return this.with({ kind: 'loop', key: 'loop' });
  }
  paused(value: boolean): Node {
    return this.with({ kind: 'paused', key: 'paused', value });
  }
  fallback(value: Child): Node {
    return this.with({ kind: 'fallback', key: 'fallback', value });
  }
}

const FRAME_KEYS = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'] as const;

// ── The typed surface: which modifiers each kind accepts ─────────

/** Modifiers every view takes. `Self` is the view's own type, so a chain keeps its kind. */
export interface ViewModifiers<Self> extends ViewNode {
  padding(value: PaddingToken): Self;
  padding(edge: Edge, value: PaddingToken): Self;
  frame(value: FrameSpec): Self;
  /** Takes the free space along its parent's axis. */
  grow(): Self;
  shrink(value: ShrinkPriority): Self;
  background(value: ColorName): Self;
  border(value: ColorName, width?: BorderWidthName, edge?: BorderEdge): Self;
  corner(value: CornerName): Self;
  opacity(value: OpacityName): Self;
  /**
   * A glass material behind the view: `regular` (the default) or `clear`,
   * optionally `.tint(role, opacity?)`. Drawn by Bloom's `Surface` today.
   */
  glass(value?: GlassValue): Self;
  /** Text and icon colour for this view and everything inside it. */
  foreground(value: ColorName): Self;
  font(value: FontName): Self;
  weight(value: WeightName): Self;
  leading(value: LeadingToken): Self;
  onPress(value: PressHandler | undefined): Self;
  onLongPress(value: (() => void) | undefined): Self;
  onHover(enter: (() => void) | undefined, leave: (() => void) | undefined): Self;
  /**
   * Web: the pointer over this view is what `group-hover:` styles inside it
   * answer (Bloom `SubtleHover`). Native has no hover group; it does nothing.
   */
  hoverGroup(): Self;
  label(value: string | undefined): Self;
  hint(value: string | undefined): Self;
  role(value: Role): Self;
  hitSlop(value: HitSlopName): Self;
  testID(value: string): Self;
  id(value: string | number): Self;
  /** Scales the view about its centre: a token, or a `MotionValue` it follows. */
  scale(value: ScaleName | MotionValue): Self;
  /**
   * Moves the view from its place without moving its neighbours. A
   * `MotionValue` on an axis (`useMotionValue`) moves it as the value moves:
   * a drag, a pager, `animate()`. `.animation()` does not ease a bound view's
   * geometry; `animate()` does.
   */
  offset(value: OffsetSpec): Self;
  rotation(value: RotationName | MotionValue): Self;
  /**
   * SwiftUI's `.animation(_:value:)`: changes to this view's scale, offset,
   * rotation and opacity, and to what animates inside it (a matched geometry, a
   * content transition, keyframes and transitions without their own motion),
   * play with `motion`. With a value, they animate only when that value changes.
   */
  animation(motion: MotionToken, value?: unknown): Self;
  /** How the view arrives and leaves (see `TransitionValue`). */
  transition(value: TransitionValue): Self;
  /** Plays `keyframes` each time `trigger` changes to a truthy value. */
  keyframes(value: KeyframesValue, trigger: unknown): Self;
  /** SwiftUI's `matchedGeometryEffect`: moves from where the view with this id last was. */
  matchedGeometry(id: string, namespace: Namespace): Self;
  /**
   * Press feedback: the view eases to the `pressed` scale while a finger holds
   * it. Off for a mouse on the web and under reduced motion.
   */
  pressScale(): Self;
  /**
   * The finger moves `value` along `options.axis` (default `y`), from where it
   * was, within `min`/`max`. Bind the value to see it (`.offset({ y })`);
   * `options.onEnd` decides where it goes on release (`animate()`). Native: the
   * drag runs on the UI thread, with no JS per frame.
   */
  drag(value: MotionValue, options?: DragSpec): Self;
  /**
   * The view follows a swipe toward `direction` and, released past a quarter
   * of the window across (or a tap's slop up or down), flies out and calls
   * `onSwipe`; short of it, it comes back.
   */
  swipe(direction: SwipeDirection, onSwipe: () => void): Self;
}

export interface StackView extends ViewModifiers<StackView> {
  spacing(value: SpaceToken | 'between'): StackView;
  align(value: Alignment): StackView;
}
export interface TextView extends ViewModifiers<TextView> {
  lines(value: number): TextView;
  /** Web: never wraps (`white-space: nowrap`); native text in a row already keeps its width. */
  noWrap(): TextView;
  /**
   * SwiftUI's `.contentTransition(.numericText(value:))`: a change of the text
   * inside an animation rolls the old text out and the new one in, up when
   * `direction` rose and down when it fell.
   */
  contentTransition(value: 'roll', direction?: number): TextView;
}
export interface LottieView extends ViewModifiers<LottieView> {
  /** Plays again from the start each time it ends. */
  loop(): LottieView;
  paused(value: boolean): LottieView;
  /** What draws in its place where it cannot play (reduced motion, no player). */
  fallback(value: Child): LottieView;
}
export interface IconView extends ViewModifiers<IconView> {
  size(value: IconSizeToken): IconView;
}
export interface AvatarView extends ViewModifiers<AvatarView> {
  size(value: AvatarSizeName): AvatarView;
}
/**
 * A raster image. It is sized like any view (`frame`, or one side and
 * `aspectRatio`) and clipped by `corner`; it has no intrinsic size until it loads.
 */
export interface ImageView extends ViewModifiers<ImageView> {
  /** How the image fills its box. Defaults to `cover`. */
  contentFit(value: ContentFit): ImageView;
  /** Width over height, so one side sizes the other (`16 / 9`). */
  aspectRatio(value: number): ImageView;
  /** Paints every opaque pixel one colour role (monochrome artwork). */
  tint(value: ColorName): ImageView;
  /**
   * Cross-fades the image in when it arrives, over a Bloom duration. Defaults
   * to none. (`.transition()` is how any view arrives and leaves.)
   */
  crossFade(value: DurationName): ImageView;
  /** The intrinsic pixel size, once loaded. */
  onLoad(value: ImageLoadHandler | undefined): ImageView;
  onError(value: ImageErrorHandler | undefined): ImageView;
}
export interface ButtonView extends ViewModifiers<ButtonView> {
  style(value: BloomAppearance): ButtonView;
  shape(value: ButtonShape): ButtonView;
  size(value: BloomSize): ButtonView;
  tint(value: BloomTone): ButtonView;
}
export interface ActionView extends ViewModifiers<ActionView> {
  count(value: number | null | undefined): ActionView;
  active(value: boolean | undefined): ActionView;
  tint(value: EngagementTone): ActionView;
}
export interface ActionBarView extends ViewModifiers<ActionBarView> {
  trailing(...value: Child[]): ActionBarView;
  countFormat(value: (count: number) => string): ActionBarView;
  size(value: BloomSize): ActionBarView;
}
export type ActionGroupView = ViewModifiers<ActionGroupView>;
export type SpacerView = ViewModifiers<SpacerView>;
export type EmbedView = ViewModifiers<EmbedView>;
/** A `view()` component placed in a tree. Its modifiers apply around its body. */
export type ComposedView = ViewModifiers<ComposedView>;

export function isNode(value: unknown): value is Node {
  return value instanceof Node;
}
