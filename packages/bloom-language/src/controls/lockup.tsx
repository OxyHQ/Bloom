import {
  Lockup as BloomLockup,
  type LockupProps,
  LockupSkeleton as BloomLockupSkeleton,
  type LockupSkeletonProps,
} from '@oxy.so/bloom/lockup';

import { type Child, Node, type ViewModifiers } from '../node';
import type { LockupSize, ShapeName } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, type TextSlot } from './product';

/** A product's lockup: its icon, name and action in a row, and its placeholder. */
export type LockupKind = 'lockup' | 'lockupSkeleton';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';
type Looks = 'size' | 'iconShape' | 'divider' | 'titleNumberOfLines';
/**
 * Bloom `Lockup`'s data (its subtitle, icon, rank, link); `caption` is a
 * string (drawn in the caption style) or a view, `action` a view.
 */
export type LockupOptions = Omit<
  LockupProps,
  Drawn | Looks | 'title' | 'onPress' | 'caption' | 'action'
> & { readonly caption?: TextSlot; readonly action?: Child };
/** Bloom `LockupSkeleton`'s lines: whether it draws the caption and the action's pill. */
export type LockupSkeletonOptions = Omit<LockupSkeletonProps, Drawn | 'size' | 'divider'>;

/** Bloom `Lockup`; `.onPress()` opens the product, `.label()` names the link. */
export interface LockupView extends ViewModifiers<LockupView> {
  /** `sm`, `md` (default) or `lg` (the head of a product's own page). */
  size(value: LockupSize): LockupView;
  /** The icon's outline: `squircle` by default. */
  shape(value: ShapeName): LockupView;
  /** A hairline under the text column. */
  divider(value?: boolean): LockupView;
  /** Where the title truncates: 1 by default, 2 at `lg`; `0` never does. */
  lines(value: number): LockupView;
}
/** Bloom `LockupSkeleton`; `.label()` names the placeholder. */
export interface LockupSkeletonView extends ViewModifiers<LockupSkeletonView> {
  size(value: LockupSize): LockupSkeletonView;
  divider(value?: boolean): LockupSkeletonView;
}

/** Bloom `Lockup` of the product `title`. */
export function Lockup(title: string, options: LockupOptions = {}): LockupView {
  return new Node('lockup', { title, options }, []);
}
/** Bloom `LockupSkeleton`: a lockup's placeholder while it loads. */
export function LockupSkeleton(options: LockupSkeletonOptions = {}): LockupSkeletonView {
  return new Node('lockupSkeleton', { options }, []);
}

export const LOCKUPS: Record<LockupKind, ControlRenderer> = {
  lockup: product(BloomLockup, {
    slots: ['caption', 'action'],
    press: true,
    own: (d) => ({
      size: d.own('size')?.value,
      iconShape: d.own('shape')?.value,
      divider: d.own('divider')?.value,
      titleNumberOfLines: d.own('lines')?.value,
    }),
  }),
  lockupSkeleton: product(BloomLockupSkeleton, {
    own: (d) => ({ size: d.own('size')?.value, divider: d.own('divider')?.value }),
  }),
};
