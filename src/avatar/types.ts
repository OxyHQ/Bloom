import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle, ImageStyle } from 'react-native';
// Referenced by the `variant` prop docs below.
import type { ImageResolver } from '../image-resolver/context';

export type AvatarShape = 'circle' | 'squircle';

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
  testID?: string;
}
