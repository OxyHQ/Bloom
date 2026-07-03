import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle, ImageStyle } from 'react-native';
// Referenced by the `variant` prop docs below.
import type { ImageResolver } from '../image-resolver/context';

export type AvatarShape = 'circle' | 'squircle';

/** Gradient sweep direction for a multi-color {@link AvatarRingConfig}. */
export type AvatarRingGradientDirection = 'diagonal' | 'horizontal' | 'vertical';

export interface AvatarRingConfig {
  /** Solid ring: one color. Gradient ring: 2+ colors. */
  colors: string | string[];
  /** Ring stroke width in px. Default: size > 16 ? 2 : 1. */
  width?: number;
  /** Gap between avatar edge and ring. Default 0 (ring overlays the edge). */
  gap?: number;
  /** Gradient sweep direction for multi-color rings. Default 'diagonal'. */
  gradientDirection?: AvatarRingGradientDirection;
}

export interface AvatarProps {
  /**
   * Flexible image source — accepts a URL string, an ImageSourcePropType
   * (e.g. require('./img.png') or { uri: '...' }), or null/undefined.
   * Takes precedence over the `uri` prop when both are provided.
   */
  source?: string | ImageSourcePropType | null;
  /** Direct URI string. Use `source` for more flexible input. */
  uri?: string;
  /**
   * Rendition variant forwarded to the {@link ImageResolver} when `source` is a
   * bare file ID (a non-URL string). Selects a server-side rendition such as
   * `'thumb'`, `'small'`, or `'medium'`; omit it for the full-size image. Lists
   * and grids should pass `variant="thumb"`. Ignored when `source` is already a
   * full URL/`{uri}` or when no resolver is registered.
   */
  variant?: string;
  /** Fallback image source when source/uri is missing or errors (defaults to colored circle) */
  fallbackSource?: ImageSourcePropType;
  /** Avatar size in pixels (defaults to 40) */
  size?: number;
  /** Whether to show a verified badge */
  verified?: boolean;
  /** Custom verified badge icon (rendered at bottom-right) */
  verifiedIcon?: ReactNode;
  /** Shape of the avatar (defaults to 'circle'). 'squircle' requires react-native-svg. */
  shape?: AvatarShape;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Image style (circle shape only) */
  imageStyle?: StyleProp<ImageStyle>;
  /** Custom background color for the placeholder circle (overrides theme default) */
  placeholderColor?: string;
  /** Custom icon rendered inside the placeholder circle when no image is available */
  placeholderIcon?: ReactNode;
  /**
   * Contact/user name used to derive a deterministic initial and background color.
   * When no image resolves (missing `source`/`uri` or image error), the Avatar renders
   * a colored circle with the first letter of the name in white.
   * Consumers can still override via `placeholderColor` / `placeholderIcon`.
   */
  name?: string;
  /** Press handler — wraps avatar in TouchableOpacity when provided */
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
   * Text shown inside the live badge. Defaults to `'LIVE'`. Provide a localized
   * string for i18n — keep it extremely short (≈4 characters) as there is very
   * little room.
   */
  liveLabel?: string;
  /**
   * Override color for the live ring and badge background. Defaults to the theme
   * `negative` token. Prefer the theme default; only override for brand-specific
   * live treatments.
   */
  liveColor?: string;
  /**
   * Decorative ring drawn around the avatar. Pass a single color string for a
   * solid ring, or an array of 2+ colors for a gradient ring (e.g. an
   * Instagram-stories ring). The gradient form requires `react-native-svg`
   * (falls back to a solid ring of the first color if it is not installed).
   *
   * When `gap` is 0 (default) the ring overlays the avatar edge and the
   * component's footprint is unchanged. When `gap` > 0 the ring is drawn OUTSIDE
   * the avatar and the rendered footprint grows to `size + 2*(width + gap)` with
   * the avatar centered inside (matching how Instagram-stories rings sit outside
   * the avatar).
   *
   * `live` is sugar over this same primitive: when set (and no explicit `ring`
   * is passed) it renders a solid theme-`negative` ring plus the "LIVE" badge.
   * An explicit `ring` always wins for geometry and colors; the badge stays
   * controlled by `live`/`hideLiveBadge`.
   */
  ring?: AvatarRingConfig;
  testID?: string;
}
