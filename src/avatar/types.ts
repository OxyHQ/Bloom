import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
// Referenced by the `variant` prop docs below.
import type { ImageResolver } from '../image-resolver/context';

import type { Shape, GradientDirection, ImageSource } from '../shapes';

export interface AvatarRingConfig {
  /** Solid ring: one color. Gradient ring: 2+ colors. */
  colors: string | string[];
  /** Ring stroke width in px. Default: size > 16 ? 2 : 1. */
  width?: number;
  /** Gradient sweep direction for multi-color rings. Default 'diagonal'. */
  gradientDirection?: GradientDirection;
}

/**
 * Size rungs: `xs` 20 (breadcrumb marks), `sm` 24 (table rows), `md` 32
 * (sidebar / team card), `lg` 36 (people cards).
 */
export type AvatarSizeToken = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Initials tints. `neutral` is the quiet grey disc; the three hues are
 * painted from the theme — `blue` from `primary`, `lime` from `success`,
 * `pink` from `negative` — through the ramp recipe.
 */
export type AvatarColor = 'neutral' | 'blue' | 'lime' | 'pink';

export interface AvatarProps {
  /**
   * Flexible image source — accepts a URL string, an ImageSource
   * (e.g. require('./img.png') or { uri: '...' }), or null/undefined.
   * Takes precedence over the `uri` prop when both are provided.
   */
  source?: string | ImageSource | null;
  /** Direct URI string. Use `source` for more flexible input. */
  uri?: string;
  /**
   * Rendition variant forwarded to the {@link ImageResolver} when `source` is a
   * bare file ID (a non-URL string). Selects a server-side rendition such as
   * `'thumb'`, `'small'`, or `'medium'`. Defaults to `'thumb'` so an avatar
   * never accidentally requests the full-size original; pass an explicit
   * variant (e.g. a larger rendition) when you need a bigger image. Ignored when
   * `source` is already a full URL/`{uri}` or when no resolver is registered.
   */
  variant?: string;
  /** Fallback image source when source/uri is missing or errors (defaults to colored shape) */
  fallbackSource?: ImageSource;
  /**
   * Avatar size: a diameter in pixels, or one of the size rungs
   * (`'xs'` 20, `'sm'` 24, `'md'` 32, `'lg'` 36). Defaults to 40.
   */
  size?: number | AvatarSizeToken;
  /**
   * Tint of the initials disc. Defaults to a tint derived
   * deterministically from `name`, or `'neutral'` for explicit `initials`.
   */
  color?: AvatarColor;
  /**
   * Explicit initials for the fallback disc, e.g. `"M"` or `"AL"`. Wins
   * over the letter derived from `name`.
   */
  initials?: string;
  /**
   * Accessible description of the photo. When omitted the
   * avatar is decorative unless `onPress` makes it a control named by `name`.
   */
  alt?: string;
  /** Whether to show a verified badge */
  verified?: boolean;
  /** Custom verified badge icon (rendered at bottom-right) */
  verifiedIcon?: ReactNode;
  /** Shared Shapes name or SVG outline. Images and fallback fills preserve the same silhouette. */
  shape?: Shape;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Custom background color for the placeholder shape (overrides the tint) */
  placeholderColor?: string;
  /** Custom icon rendered inside the placeholder shape when no image is available */
  placeholderIcon?: ReactNode;
  /**
   * Contact/user name used to derive a deterministic initial and tint.
   * When no image resolves (missing `source`/`uri` or image error), the Avatar renders
   * a tinted initials shape with the first letter of the name.
   * Consumers can still override via `placeholderColor` / `placeholderIcon`.
   */
  name?: string;
  /** Press handler — wraps the avatar in a `Pressable` when provided. */
  onPress?: () => void;
  /**
   * When true, marks the user as live-streaming: draws a solid red ring that
   * overlays the avatar edge and, unless `hideLiveBadge` is set, a small red
   * "LIVE" pill hanging off the bottom-center. Static (no animation). The badge
   * is only shown for `size > 16`.
   */
  live?: boolean;
  /** Suppress the "LIVE" pill badge while keeping the live ring (ring only). */
  hideLiveBadge?: boolean;
  /**
   * Text shown inside the live badge — the locale's word (`'LIVE'` in English),
   * via `BloomProvider locale`. Set it to override; keep it extremely short
   * (≈4 characters) as there is very little room.
   */
  liveLabel?: string;
  /**
   * Override color for the live ring and badge background. Defaults to the theme
   * `negative` token. Prefer the theme default; only override for brand-specific
   * live treatments.
   */
  liveColor?: string;
  /** Decorative inner border: one color or a gradient. Does not change layout size. */
  ring?: AvatarRingConfig;
  testID?: string;
}
