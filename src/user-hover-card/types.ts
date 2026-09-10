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
  /** Makes the identity area (avatar + name + handle) pressable. */
  onPressProfile?: () => void;
  /**
   * Slot for a consumer-injected action — typically the app's SDK FollowButton.
   * Bloom does NOT implement follow logic; it only renders the card.
   */
  action?: ReactNode;
  /**
   * Marker slot in the handle row, rendered after `@username` — an account-kind
   * or federation marker, the kind of quiet glyph that says what this account
   * IS. Renders even when `username` is absent, because it describes the
   * account rather than the handle. A long handle truncates to make room; the
   * marker never shrinks.
   *
   * UNLIKE {@link UserHoverCardProps.footer}, this slot is INSIDE the identity
   * area, because that is where it has to be to sit beside the handle. What that
   * costs, measured rather than assumed:
   *
   * - The card's accessible name is unaffected. The identity area carries an
   *   explicit `accessibilityLabel`, and an explicit label wins over contents in
   *   the ARIA name computation — read back from Chrome's own accessibility tree
   *   with a badge nested inside: the button's name was exactly its label.
   * - The badge's press does NOT leak into `onPressProfile`, on either platform.
   *   react-native-web implements React Native's responder system, so a nested
   *   pressable wins there the same way it does natively. No `stopPropagation`
   *   is needed, and a doc that told you to add one would be describing a
   *   different ancestor: a RAW DOM handler (`onPointerUp` on a plain `View`)
   *   does receive the bubbled event.
   * - **Prefer an INERT marker.** When `onPressProfile` is set the identity area
   *   is a real `<button>`, so a pressable badge nests a button inside a button
   *   — invalid HTML, which Chrome tolerates and other user agents need not. A
   *   marker is usually a statement rather than a control anyway; make it
   *   pressable only where the answer it opens is worth that.
   */
  badge?: ReactNode;
  /**
   * Trailing content region, rendered after the stats row and spanning the full
   * inner width — the slot for whatever this app knows about a person that Bloom
   * does not (a contribution graph, a shared-followers strip, a mutual-friends
   * line). Bloom adds the vertical rhythm and nothing else: no label, no divider,
   * no clip.
   *
   * It is a SIBLING of the identity area, never a child. Nested, a press
   * anywhere on it — on a chart, on a line of text, on anything that is not
   * itself pressable — would open the profile through
   * {@link UserHoverCardProps.onPressProfile}.
   *
   * Size content against {@link USER_HOVER_CARD_CONTENT_WIDTH}, which is
   * exported for exactly that. The card does not clip, so anything wider paints
   * outside it.
   */
  footer?: ReactNode;
  /** Container style override. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
