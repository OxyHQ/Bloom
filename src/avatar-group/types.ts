import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * A single member of an {@link AvatarGroup}. Mirrors the minimal shape needed to
 * render an {@link Avatar} plus drive the optional hover card. `uri` is the
 * avatar image URL; `name`/`displayName` feed Avatar's deterministic
 * name-based placeholder when no image resolves.
 */
export interface AvatarGroupItem {
  /** Stable identity used as a React key and passed back to handlers. */
  id?: string;
  /** Avatar image URL (null/undefined → name-based placeholder). */
  uri?: string | null;
  /** Fallback name used for the avatar placeholder when `displayName` is absent. */
  name?: string;
  /** Canonical, already-resolved display name (preferred over `name`). */
  displayName?: string;
  /** Handle without the leading `@`. */
  username?: string;
}

export interface AvatarGroupProps {
  /** Members to render, in stacking order (first item sits on top). */
  items: AvatarGroupItem[];
  /** Diameter of each avatar in pixels. */
  size?: number;
  /** Maximum number of avatars to render before collapsing into the overflow chip. */
  max?: number;
  /**
   * Real total count of members. When provided and larger than the number of
   * rendered avatars, the overflow chip shows `+ (total - shown)`. When omitted,
   * overflow is derived from `items.length - shown`.
   */
  total?: number;
  /**
   * Horizontal overlap between adjacent avatars in pixels. Defaults to ~35% of
   * `size`. Larger values pull avatars closer together.
   */
  overlap?: number;
  /**
   * Color of the ring/border drawn around each avatar so they separate cleanly.
   * Defaults to the theme `card` surface color.
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
