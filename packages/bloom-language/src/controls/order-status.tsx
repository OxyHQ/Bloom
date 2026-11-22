import {
  OrderStatusBar as BloomOrderStatusBar,
  type OrderStatusBarProps,
  type OrderStatusStep,
  OrderStatusTimeline as BloomOrderStatusTimeline,
  type OrderStatusTimelineProps,
} from '@oxy.so/bloom/order-status';

import { type Child, Node, type ViewModifiers } from '../node';
import type { AccentTone, Axis, ControlDensity, OrderStatusBarStyle } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rhythm } from './product';

/** An order's status: the live strip, and the steps it went through. */
export type OrderStatusKind = 'orderStatusBar' | 'orderStatusTimeline';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';
type BarSlots = 'leading' | 'action';
/** Bloom `OrderStatusBar`'s data; `leading` (an avatar, a photo) and `action` are views. */
export type OrderStatusBarOptions = Omit<
  OrderStatusBarProps,
  Drawn | 'status' | 'tone' | 'variant' | BarSlots
> & { readonly [K in BarSlots]?: Child };
/** Bloom `OrderStatusTimeline`'s words (what each state is announced as). */
export type OrderStatusTimelineOptions = Omit<
  OrderStatusTimelineProps,
  Drawn | 'steps' | 'orientation' | 'density'
>;

/** Bloom `OrderStatusBar`. */
export interface OrderStatusBarView extends ViewModifiers<OrderStatusBarView> {
  /** `surface` (default): a strip of its own; `plain`: only its content. */
  style(value: OrderStatusBarStyle): OrderStatusBarView;
  /** The tone of its glyph tile and bar: `primary` by default. */
  tint(value: AccentTone): OrderStatusBarView;
}
/** Bloom `OrderStatusTimeline`; `.label()` names the list. */
export interface OrderStatusTimelineView extends ViewModifiers<OrderStatusTimelineView> {
  /** `vertical` (default): the steps stacked with their notes; `horizontal`: on one rail. */
  axis(value: Axis): OrderStatusTimelineView;
  /** `default` (Bloom's comfortable rung) or `compact`. */
  density(value: ControlDensity): OrderStatusTimelineView;
}

/** Bloom `OrderStatusBar` of `status`, the live line ("Out for delivery"). */
export function OrderStatusBar(
  status: string,
  options: OrderStatusBarOptions = {},
): OrderStatusBarView {
  return new Node('orderStatusBar', { status, options }, []);
}
/** Bloom `OrderStatusTimeline` of `steps` (Bloom's `OrderStatusStep`s, in the order they happen). */
export function OrderStatusTimeline(
  steps: readonly OrderStatusStep[],
  options: OrderStatusTimelineOptions = {},
): OrderStatusTimelineView {
  return new Node('orderStatusTimeline', { steps, options }, []);
}

export const ORDER_STATUSES: Record<OrderStatusKind, ControlRenderer> = {
  orderStatusBar: product(BloomOrderStatusBar, {
    slots: ['leading', 'action'],
    own: (d) => ({ variant: d.own('style')?.value, tone: d.own('tint')?.value }),
  }),
  orderStatusTimeline: product(BloomOrderStatusTimeline, {
    own: (d) => ({ orientation: d.own('axis')?.value, density: rhythm(d) }),
  }),
};
