import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle, ImageStyle } from 'react-native';

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
  /** Press handler — wraps avatar in TouchableOpacity when provided */
  onPress?: () => void;
  testID?: string;
}
