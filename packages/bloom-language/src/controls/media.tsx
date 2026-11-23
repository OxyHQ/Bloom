import {
  FollowButton as BloomFollowButton,
  type FollowButtonProps,
} from '@oxy.so/bloom/media-header';
import {
  Shelf as BloomShelf,
  type ShelfProps,
  ShelfSkeleton as BloomShelfSkeleton,
  type ShelfSkeletonProps,
} from '@oxy.so/bloom/media-shelf';
import {
  SubscriptionPlans as BloomSubscriptionPlans,
  type SubscriptionPlansProps,
  SubscriptionPrice as BloomSubscriptionPrice,
  type SubscriptionPriceValue,
} from '@oxy.so/bloom/subscription-plans';
import {
  UserHoverCard as BloomUserHoverCard,
  type UserHoverCardProps,
} from '@oxy.so/bloom/user-hover-card';
import type { BloomAppearance, BloomTone } from '@oxy.so/bloom/appearance';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ButtonMaterial, FollowButtonSize, ShelfLayout, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { length, product } from './product';

/** Media and account pieces apps share: the follow button, shelves, subscription plans, a person's hover card. */
export type MediaKind =
  | 'followButton'
  | 'shelf'
  | 'shelfSkeleton'
  | 'subscriptionPlans'
  | 'subscriptionPrice'
  | 'userHoverCard';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';
type Lengths<P, L extends keyof P> = Omit<P, L> & { readonly [K in L]?: SpaceToken };

export type FollowButtonOptions = Omit<
  FollowButtonProps,
  | Drawn
  | 'className'
  | 'labelClassName'
  | 'textStyle'
  | 'following'
  | 'onFollowChange'
  | 'appearance'
  | 'tone'
  | 'size'
  | 'loading'
  | 'color'
  | 'material'
  | 'iconOnly'
>;
export type ShelfOptions = Lengths<
  Omit<ShelfProps, Drawn | 'title' | 'children' | 'layout' | 'gap'>,
  'itemWidth' | 'minItemWidth' | 'peek' | 'rowGap' | 'contentInset'
>;
export type ShelfSkeletonOptions = Lengths<
  Omit<ShelfSkeletonProps, Drawn | 'layout' | 'gap' | 'round' | 'eyebrow'>,
  'itemWidth' | 'minItemWidth'
>;
type PlanSlots = 'heroBackground' | 'controls' | 'terms' | 'footer' | 'fallback';
export type SubscriptionPlansOptions = Lengths<
  Omit<SubscriptionPlansProps, Drawn | 'value' | 'onValueChange' | PlanSlots>,
  'heroBackgroundHeight'
> & { readonly [K in PlanSlots]?: Child };
export type UserHoverCardOptions = Omit<
  UserHoverCardProps,
  Drawn | 'displayName' | 'action' | 'badge' | 'footer'
> & { readonly action?: Child; readonly badge?: Child; readonly footer?: Child };

/** Bloom `FollowButton`: follow or unfollow, as its binding holds. */
export interface FollowButtonView extends ViewModifiers<FollowButtonView> {
  style(value: BloomAppearance): FollowButtonView;
  tint(value: BloomTone): FollowButtonView;
  /** `sm`, `md` (default) or `lg`. */
  size(value: FollowButtonSize): FollowButtonView;
  loading(value?: boolean): FollowButtonView;
  /** The shared Button's material: its `surface` (default), `flat`, the `shared` island's or the `lens`. */
  material(value: ButtonMaterial): FollowButtonView;
  /** The compact toggle of icons, under the same accessible name. */
  iconOnly(value?: boolean): FollowButtonView;
}
/** Bloom `Shelf`: a titled row, grid or pages of media. */
export interface ShelfView extends ViewModifiers<ShelfView> {
  /** `row` (default), `grid` or `paged`. */
  style(value: ShelfLayout): ShelfView;
  spacing(value: SpaceToken): ShelfView;
}
export interface ShelfSkeletonView extends ViewModifiers<ShelfSkeletonView> {
  style(value: ShelfLayout): ShelfSkeletonView;
  spacing(value: SpaceToken): ShelfSkeletonView;
  /** Round covers (artists). */
  round(value?: boolean): ShelfSkeletonView;
  /** The eyebrow's placeholder. */
  eyebrow(value?: boolean): ShelfSkeletonView;
}
/** Bloom `SubscriptionPlans`: a product's plans, the chosen one as its binding holds. */
export type SubscriptionPlansView = ViewModifiers<SubscriptionPlansView>;
export type SubscriptionPriceView = ViewModifiers<SubscriptionPriceView>;
export type UserHoverCardView = ViewModifiers<UserHoverCardView>;

export function FollowButton(
  following: Binding<boolean>,
  options: FollowButtonOptions = {},
): FollowButtonView {
  return new Node('followButton', { binding: following, options }, []);
}
/** Bloom `Shelf` titled `title`, of `items` (a list of views, keyed by `.id()`). */
export function Shelf(title: string, items: Child, options: ShelfOptions = {}): ShelfView {
  return new Node('shelf', { title, options }, [items]);
}
export function ShelfSkeleton(options: ShelfSkeletonOptions = {}): ShelfSkeletonView {
  return new Node('shelfSkeleton', { options }, []);
}
export function SubscriptionPlans(
  plan: Binding<string>,
  options: SubscriptionPlansOptions,
): SubscriptionPlansView {
  return new Node('subscriptionPlans', { binding: plan, options }, []);
}
/** Bloom `SubscriptionPrice` of `price` (its amount, currency and words). */
export function SubscriptionPrice(price: SubscriptionPriceValue): SubscriptionPriceView {
  return new Node('subscriptionPrice', { options: price }, []);
}
export function UserHoverCard(
  displayName: string,
  options: UserHoverCardOptions = {},
): UserHoverCardView {
  return new Node('userHoverCard', { displayName, options }, []);
}

const gap = (d: Parameters<ControlRenderer>[0]) =>
  length(d.own('spacing')?.value as SpaceToken | undefined);

export const MEDIA: Record<MediaKind, ControlRenderer> = {
  followButton: product(BloomFollowButton, {
    binding: ['following', 'onFollowChange'],
    press: true,
    own: (d) => ({
      appearance: d.own('style')?.value,
      tone: d.own('tint')?.value,
      size: d.own('size')?.value,
      loading: d.own('loading')?.value,
      material: d.own('material')?.value,
      iconOnly: d.own('iconOnly')?.value,
    }),
  }),
  shelf: product(BloomShelf, {
    lengths: ['itemWidth', 'minItemWidth', 'peek', 'rowGap', 'contentInset'],
    own: (d) => ({ layout: d.own('style')?.value, gap: gap(d) }),
  }),
  shelfSkeleton: product(BloomShelfSkeleton, {
    lengths: ['itemWidth', 'minItemWidth'],
    own: (d) => ({
      layout: d.own('style')?.value,
      gap: gap(d),
      round: d.own('round')?.value,
      eyebrow: d.own('eyebrow')?.value,
    }),
  }),
  subscriptionPlans: product(BloomSubscriptionPlans, {
    binding: ['value', 'onValueChange'],
    slots: ['heroBackground', 'controls', 'terms', 'footer', 'fallback'],
    lengths: ['heroBackgroundHeight'],
  }),
  subscriptionPrice: product(BloomSubscriptionPrice),
  userHoverCard: product(BloomUserHoverCard, { slots: ['action', 'badge', 'footer'] }),
};
