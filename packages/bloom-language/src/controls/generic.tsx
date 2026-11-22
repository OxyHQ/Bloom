import {
  ConnectionDots as BloomConnectionDots,
  type ConnectionDotsProps,
} from '@oxy.so/bloom/connection-dots';
import { OutlineNav as BloomOutlineNav, type OutlineNavProps } from '@oxy.so/bloom/outline-nav';
import { Pagination as BloomPagination, type PaginationProps } from '@oxy.so/bloom/pagination';
import {
  ProgressiveBlur as BloomProgressiveBlur,
  type ProgressiveBlurProps,
} from '@oxy.so/bloom/progressive-blur';
import {
  RowActionButton as BloomRowActionButton,
  type RowActionButtonProps,
  RowActions as BloomRowActions,
  type RowActionsProps,
} from '@oxy.so/bloom/row-actions';
import {
  SwipeRow as BloomSwipeRow,
  type SwipeRowActions,
  type SwipeRowProps,
} from '@oxy.so/bloom/swipe-row';
import { ThemeToggle as BloomThemeToggle, type ThemeToggleProps } from '@oxy.so/bloom/theme-toggle';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type {
  ColorToken,
  OutlineNavStyle,
  RowActionStyle,
  SpaceToken,
  ThemeToggleStyle,
} from '../tokens';
import type { ControlRenderer } from './draw';
import { type CornerToken, product } from './product';

/** Bloom's generic pieces no product family owns. */
export type GenericKind =
  | 'connectionDots'
  | 'outlineNav'
  | 'pagination'
  | 'progressiveBlur'
  | 'rowActions'
  | 'rowActionButton'
  | 'swipeRow'
  | 'themeToggle';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `ConnectionDots`' data: its dot count and motion; `dotSize` a space token. */
export type ConnectionDotsOptions = Omit<
  ConnectionDotsProps,
  Drawn | 'className' | 'left' | 'right' | 'dotSize'
> & { readonly dotSize?: SpaceToken };
/** Bloom `OutlineNav`'s data: the heading the reader is at, its press, progress and words. */
export type OutlineNavOptions = Omit<OutlineNavProps, Drawn | 'headings' | 'variant'>;
/** Bloom `Pagination`'s data: its sibling count and words. */
export type PaginationOptions = Omit<PaginationProps, Drawn | 'page' | 'onChange' | 'totalPages'>;
/** Bloom `ProgressiveBlur`'s data: its edge and its intensity. */
export type ProgressiveBlurOptions = Pick<ProgressiveBlurProps, 'direction' | 'intensity'>;

/** Bloom `RowActions`' data: its icon buttons, its menu's entries and words; `menuWidth` a space token. */
export type RowActionsOptions = Omit<
  RowActionsProps,
  'style' | 'testID' | 'name' | 'menuAppearance' | 'menuWidth'
> & { readonly menuWidth?: SpaceToken };
/** Bloom `RowActionButton`'s data: its tooltip and the Button props it passes on. */
export type RowActionButtonOptions = Omit<
  RowActionButtonProps,
  Drawn | 'icon' | 'label' | 'appearance' | 'active' | 'disabled' | 'onPress'
>;
/**
 * Bloom `SwipeRow`'s data: its handlers, presentation and words; `height` and
 * `actionWidth` space tokens, `radius` a corner rung. `paint` stays Bloom's
 * six colours (a set of roles has no prop to paint).
 */
export type SwipeRowOptions = Omit<
  SwipeRowProps,
  'style' | 'testID' | 'children' | 'actions' | 'background' | 'height' | 'actionWidth' | 'radius'
> & {
  readonly height?: SpaceToken;
  readonly actionWidth?: SpaceToken;
  readonly radius?: CornerToken;
};
/** Bloom `ThemeToggle`'s data: its web reveal's duration. */
export type ThemeToggleOptions = Pick<ThemeToggleProps, 'transitionDuration'>;

/** Bloom `ConnectionDots`; `.label()` names the link. */
export type ConnectionDotsView = ViewModifiers<ConnectionDotsView>;
/** Bloom `OutlineNav`; `.label()` names it. */
export interface OutlineNavView extends ViewModifiers<OutlineNavView> {
  /** `full` (default) or `compact`. */
  style(value: OutlineNavStyle): OutlineNavView;
}
/** Bloom `Pagination`; `.label()` names it. */
export type PaginationView = ViewModifiers<PaginationView>;
/** Bloom `ProgressiveBlur`; its place and size are the view's (`.position()`, `.frame()`). */
export type ProgressiveBlurView = ViewModifiers<ProgressiveBlurView>;

/** Bloom `RowActions`: the icon buttons and "⋮" menu a row ends with. */
export interface RowActionsView extends ViewModifiers<RowActionsView> {
  /** The menu button's look: `plain` (default) or `outline`. */
  style(value: RowActionStyle): RowActionsView;
}
/** Bloom `RowActionButton`; `.onPress()` is what it does, `.label()` a fuller name than its tooltip. */
export interface RowActionButtonView extends ViewModifiers<RowActionButtonView> {
  /** `plain` (default) or `outline`. */
  style(value: RowActionStyle): RowActionButtonView;
  /** Painted pressed while a menu it opened shows. */
  active(value: boolean | undefined): RowActionButtonView;
  disabled(value?: boolean): RowActionButtonView;
}
/** Bloom `SwipeRow`: the row it holds, with actions behind it. */
export interface SwipeRowView extends ViewModifiers<SwipeRowView> {
  /** The fill the row travels on (the theme's page colour by default). */
  tint(value: ColorToken): SwipeRowView;
}
/** Bloom `ThemeToggle`. */
export interface ThemeToggleView extends ViewModifiers<ThemeToggleView> {
  /** `sidebar` (default), `segmented`, `sidebar-segmented` or `bare-segmented`. */
  style(value: ThemeToggleStyle): ThemeToggleView;
  /** The collapsed rail's icon button (the `sidebar` variant only). */
  collapsed(value?: boolean): ThemeToggleView;
}

/** Bloom `ConnectionDots` between `left` and `right`. */
export function ConnectionDots(
  left: Child,
  right: Child,
  options: ConnectionDotsOptions = {},
): ConnectionDotsView {
  return new Node('connectionDots', { options: { ...options, left, right } }, []);
}
export function OutlineNav(
  headings: OutlineNavProps['headings'],
  options: OutlineNavOptions = {},
): OutlineNavView {
  return new Node('outlineNav', { headings, options }, []);
}
/** Bloom `Pagination` of `totalPages`, its binding the page shown (from 1). */
export function Pagination(
  page: Binding<number>,
  totalPages: number,
  options: PaginationOptions = {},
): PaginationView {
  return new Node('pagination', { binding: page, totalPages, options }, []);
}
export function ProgressiveBlur(options: ProgressiveBlurOptions = {}): ProgressiveBlurView {
  return new Node('progressiveBlur', { options }, []);
}

/** Bloom `RowActions` of the row `name` names. */
export function RowActions(name: string, options: RowActionsOptions = {}): RowActionsView {
  return new Node('rowActions', { name, options }, []);
}
export function RowActionButton(
  icon: RowActionButtonProps['icon'],
  label: string,
  options: RowActionButtonOptions = {},
): RowActionButtonView {
  return new Node('rowActionButton', { icon, label, options }, []);
}
/** Bloom `SwipeRow` around `content`, the actions behind it on each side. */
export function SwipeRow(
  content: Child,
  actions: SwipeRowActions,
  options: SwipeRowOptions = {},
): SwipeRowView {
  return new Node('swipeRow', { actions, options }, [content]);
}
export function ThemeToggle(options: ThemeToggleOptions = {}): ThemeToggleView {
  return new Node('themeToggle', { options }, []);
}

export const GENERIC: Record<GenericKind, ControlRenderer> = {
  connectionDots: product(BloomConnectionDots, {
    slots: ['left', 'right'],
    lengths: ['dotSize'],
  }),
  outlineNav: product(BloomOutlineNav, { own: (d) => ({ variant: d.own('style')?.value }) }),
  pagination: product(BloomPagination, { binding: ['page', 'onChange'] }),
  progressiveBlur: product(BloomProgressiveBlur),
  rowActions: product(BloomRowActions, {
    lengths: ['menuWidth'],
    own: (d) => ({ menuAppearance: d.own('style')?.value }),
  }),
  rowActionButton: product(BloomRowActionButton, {
    press: true,
    own: (d) => ({
      appearance: d.own('style')?.value,
      active: d.own('active')?.value,
      disabled: d.own('disabled')?.value,
    }),
  }),
  swipeRow: product(BloomSwipeRow, {
    lengths: ['height', 'actionWidth'],
    corners: ['radius'],
    colors: (d) => ({ background: d.own('tint')?.value as ColorToken | undefined }),
  }),
  themeToggle: product(BloomThemeToggle, {
    own: (d) => ({ variant: d.own('style')?.value, collapsed: d.own('collapsed')?.value }),
  }),
};
