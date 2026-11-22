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

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { OutlineNavStyle, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Bloom's generic pieces no product family owns. */
export type GenericKind = 'connectionDots' | 'outlineNav' | 'pagination' | 'progressiveBlur';

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

export const GENERIC: Record<GenericKind, ControlRenderer> = {
  connectionDots: product(BloomConnectionDots, {
    slots: ['left', 'right'],
    lengths: ['dotSize'],
  }),
  outlineNav: product(BloomOutlineNav, { own: (d) => ({ variant: d.own('style')?.value }) }),
  pagination: product(BloomPagination, { binding: ['page', 'onChange'] }),
  progressiveBlur: product(BloomProgressiveBlur),
};
