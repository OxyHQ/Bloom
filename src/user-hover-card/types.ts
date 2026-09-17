import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** A single labeled metric rendered in the {@link UserHoverCardProps.stats} row. */
export interface UserHoverCardStat {
  /** Human-readable label, e.g. `"Followers"`. */
  label: string;
  /** Pre-formatted value, e.g. `"1.2K"` or `42`. */
  value: string | number;
}

export interface UserHoverCardProps {
  /**
   * Avatar image source. Accepts a full image URL OR a resolver-handled id
   * (e.g. an Oxy file ID) — it is routed into {@link Avatar}'s `source` prop, so
   * non-URL strings resolve through the consumer's ImageResolver. Null/undefined
   * falls back to the deterministic name-based placeholder.
   */
  avatar?: string | null;
  /**
   * Rendition variant forwarded to {@link Avatar}'s `variant` prop when `avatar`
   * is a bare file ID. Omit for the full-size rendition (the default for this
   * larger identity avatar).
   */
  variant?: string;
  /** Canonical, already-resolved display name (an API contract — render directly). */
  displayName: string;
  /** Handle without the leading `@` (the component prefixes it). */
  username?: string;
  /** Optional short biography; truncated to a few lines. */
  bio?: string;
  /** Optional metrics row (e.g. Following / Followers). */
  stats?: UserHoverCardStat[];
  /** Whether to show the verified badge next to the display name. */
  verified?: boolean;
  /**
   * Optional cover image drawn full-bleed across the top of the card, with the
   * avatar overlapping its bottom edge. Accepts a
   * full URL OR a resolver-handled id, exactly like {@link avatar}: a non-URL
   * string goes through the consumer's ImageResolver (with
   * {@link coverVariant}). Omit for the compact card without a cover.
   */
  cover?: string | null;
  /** Rendition variant forwarded to the ImageResolver for a bare-id {@link cover}. */
  coverVariant?: string;
  /**
   * Renders the card's skeleton — avatar disc, name and handle bars, bio lines
   * and stat tiles in the same geometry — while the profile is being fetched.
   * The card announces itself busy (`aria-busy` on web, `accessibilityState.busy`
   * on native). `action` and `footer` are not rendered while loading.
   */
  loading?: boolean;
  /**
   * Plays the floating-panel entrance on mount (fade + `scale-95` +
   * `blur-[2px]` on web, 150ms `ease-out`) — the motion menus and popovers use.
   * Default `true`; skipped under reduced motion.
   */
  animateIn?: boolean;
  /** Makes the identity area (avatar + name + handle) pressable. */
  onPressProfile?: () => void;
  /**
   * Slot for a consumer-injected action — typically the app's SDK FollowButton.
   * Bloom does NOT implement follow logic; it only renders the card.
   */
  action?: ReactNode;
  /**
   * Trailing content region, rendered after the stats row and spanning the full
   * inner width — the slot for whatever this app knows about a person that Bloom
   * does not (a contribution graph, a shared-followers strip, a mutual-friends
   * line). Bloom adds the vertical rhythm and nothing else: no label, no divider,
   * no clip.
   *
   * It is a SIBLING of the identity area, never a child, so its own pressables
   * keep their presses instead of feeding {@link UserHoverCardProps.onPressProfile}
   * — and a screen reader reads it as content, not as part of the identity
   * button's name.
   *
   * The card is 280px wide with a 1px border and 15px padding, so content has
   * 248px of inner width; the card does not clip, so anything wider paints
   * outside it.
   */
  footer?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
