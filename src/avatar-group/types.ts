import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * A single member of an {@link AvatarGroup}. Mirrors the minimal shape needed to
 * render an {@link Avatar} plus drive the optional hover card. `uri` carries the
 * avatar value (routed into Avatar's `source` prop); `name`/`displayName`/
 * `username` are used for the hover card and accessibility only.
 */
export interface AvatarGroupItem {
  /** Stable identity used as a React key and passed back to handlers. */
  id?: string;
  /**
   * Avatar value, routed into {@link Avatar}'s `source` prop. Accepts a full
   * image URL OR a resolver-handled id (e.g. an Oxy file ID) — non-URL strings
   * resolve through the consumer's ImageResolver. Null/undefined renders
   * Avatar's neutral default placeholder.
   */
  uri?: string | null;
  /** Name used for the hover card / accessibility when `displayName` is absent. */
  name?: string;
  /** Canonical, already-resolved display name (preferred over `name`). */
  displayName?: string;
  /** Handle without the leading `@`. */
  username?: string;
}

export interface AvatarGroupProps {
  /** Members to render, in stacking order (first item sits on top). */
  items: AvatarGroupItem[];
  /**
   * How the avatars are arranged.
   * - `'stack'` (default): overlapping facepile with a thin separator ring, a
   *   trailing `+N` overflow chip, and the first item on top.
   * - `'row'`: avatars placed adjacent with a positive `spacing` gap and NO
   *   separator ring — an "adjacent row" of icons (e.g. a top-tokens strip).
   *   Still collapses into the `+N` overflow chip at `max`.
   */
  layout?: 'stack' | 'row';
  /** Diameter of each avatar in pixels. */
  size?: number;
  /**
   * Rendition variant forwarded to each {@link Avatar}'s `variant` prop, which
   * the consumer's ImageResolver uses to build the right rendition for file-ID
   * items. Stacked avatars are small, so `'thumb'` is recommended. Defaults to
   * `'thumb'`; pass `undefined` to request full-size renditions.
   */
  variant?: string;
  /** Maximum number of avatars to render before collapsing into the overflow chip. */
  max?: number;
  /**
   * Real total count of members. When provided and larger than the number of
   * rendered avatars, the overflow chip shows `+ (total - shown)`. When omitted,
   * overflow is derived from `items.length - shown`.
   */
  total?: number;
  /**
   * Horizontal overlap between adjacent avatars in pixels. Defaults to ~1/3 of
   * `size`. Larger values pull avatars closer together. `layout='stack'` only.
   */
  overlap?: number;
  /**
   * Horizontal gap between adjacent avatars in pixels when `layout='row'`.
   * Defaults to ~1/3 of `size`. `layout='row'` only.
   */
  spacing?: number;
  /**
   * Color of the thin ring/border drawn around each avatar so overlapping
   * avatars separate cleanly. Defaults to the theme `background` color so the
   * avatars read as punched out of the surface behind them.
   */
  ringColor?: string;
  /**
   * Per-avatar press handler. When provided, each avatar (and the overflow chip)
   * becomes pressable. When omitted, the group is purely presentational.
   */
  onPressItem?: (item: AvatarGroupItem, index: number) => void;
  /**
   * Enables the hover card on web. Hovering an avatar reveals a
   * {@link UserHoverCard} for that item. No-op on native.
   */
  hoverCard?: boolean;
  /**
   * Per-item action slot rendered inside the hover card — typically the app's
   * SDK FollowButton. Only used when `hoverCard` is enabled (web).
   */
  renderItemAction?: (item: AvatarGroupItem, index: number) => ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
