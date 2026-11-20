import type { ComponentType, ReactNode } from 'react';
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  GestureResponderEvent,
  Insets,
} from 'react-native';
import type { BloomAppearance, BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import type { AccentTone } from '@oxy.so/bloom/theme';

import {
  tokenKey,
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

export type Edge = 'all' | 'horizontal' | 'vertical' | 'top' | 'bottom' | 'leading' | 'trailing';
export type BorderEdge = 'all' | 'top' | 'bottom' | 'leading' | 'trailing';
export type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
/** How readily a view gives up width when its row is too narrow. `first` yields before `normal`. */
export type ShrinkPriority = 'never' | 'normal' | 'first';
export type Role = 'button' | 'link' | 'header' | 'image' | 'text' | 'none';
export type ButtonShape = 'circle' | 'pill';
export type EngagementTone = Exclude<AccentTone, 'default'>;
export type IconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export type PressHandler = (event: GestureResponderEvent) => unknown;

export interface FrameSpec {
  width?: SpaceToken;
  height?: SpaceToken;
  minWidth?: SpaceToken;
  minHeight?: SpaceToken;
  maxWidth?: SpaceToken;
  maxHeight?: SpaceToken;
}

export interface GlassSpec {
  /** The tint the material is painted from; Bloom's surface fill when omitted. */
  tint?: ColorName;
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
  | { readonly kind: 'glass'; readonly key: string; readonly value: GlassSpec }
  | { readonly kind: 'foreground'; readonly key: string; readonly value: ColorName }
  | { readonly kind: 'font'; readonly key: string; readonly value: FontName }
  | { readonly kind: 'weight'; readonly key: string; readonly value: WeightName }
  | { readonly kind: 'leading'; readonly key: string; readonly value: LeadingToken }
  | { readonly kind: 'spacing'; readonly key: string; readonly value: SpaceToken | 'between' }
  | { readonly kind: 'align'; readonly key: string; readonly value: Alignment }
  | { readonly kind: 'lines'; readonly key: string; readonly value: number }
  | { readonly kind: 'noWrap'; readonly key: string }
  | {
      readonly kind: 'size';
      readonly key: string;
      readonly value: IconSizeToken | AvatarSizeName | BloomSize;
    }
  | { readonly kind: 'style'; readonly key: string; readonly value: BloomAppearance }
  | { readonly kind: 'shape'; readonly key: string; readonly value: ButtonShape }
  | { readonly kind: 'tint'; readonly key: string; readonly value: EngagementTone | BloomTone }
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
  | { readonly kind: 'id'; readonly key: string; readonly value: string | number };

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
  readonly source: string;
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
export interface EmbedProps {
  /** A React element, or a function of a renderer that draws language nodes in the current environment. */
  readonly content: ReactNode | ((render: (child: Child) => ReactNode) => ReactNode);
}
export interface ViewNodeProps {
  readonly component: ComponentType<{ args: readonly unknown[]; env: unknown }>;
  readonly args: readonly unknown[];
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
  glass(value: GlassSpec = {}): Node {
    return this.with({ kind: 'glass', key: `glass:${value.tint ?? ''}`, value });
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
  size(value: IconSizeToken | AvatarSizeName | BloomSize): Node {
    return this.with({ kind: 'size', key: `size:${tokenKey(value)}`, value });
  }
  style(value: BloomAppearance): Node {
    return this.with({ kind: 'style', key: `style:${value}`, value });
  }
  shape(value: ButtonShape): Node {
    return this.with({ kind: 'shape', key: `shape:${value}`, value });
  }
  tint(value: EngagementTone | BloomTone): Node {
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
  /** Bloom's material (`Surface`), optionally tinted. */
  glass(value?: GlassSpec): Self;
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
}

export interface StackView extends ViewModifiers<StackView> {
  spacing(value: SpaceToken | 'between'): StackView;
  align(value: Alignment): StackView;
}
export interface TextView extends ViewModifiers<TextView> {
  lines(value: number): TextView;
  /** Web: never wraps (`white-space: nowrap`); native text in a row already keeps its width. */
  noWrap(): TextView;
}
export interface IconView extends ViewModifiers<IconView> {
  size(value: IconSizeToken): IconView;
}
export interface AvatarView extends ViewModifiers<AvatarView> {
  size(value: AvatarSizeName): AvatarView;
}
export interface ImageView extends ViewModifiers<ImageView> {
  size(value: AvatarSizeName): ImageView;
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
