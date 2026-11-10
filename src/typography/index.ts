export {
  Text,
  Title,
  Subtitle,
  Span,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Lead,
  Large,
  Small,
  Muted,
  Blockquote,
  fontFamilies,
} from './Typography';
export type { TextProps, BlockquoteProps } from './types';
export { TYPE_SCALE, typeScale } from './scale';
export type { TypeScaleFamily, TypeScaleStyle, TypeScaleVariant, TypeScaleWeight } from './scale';

export {
  DESKTOP_ROLE_FOR_FAMILY,
  DESKTOP_TEXT_STYLES,
  DESKTOP_TRACKING,
  DESKTOP_TYPE_SCALE,
  desktopTextStyle,
  desktopTracking,
  resolveTypeScale,
} from './desktop-scale';
export type { DesktopTextStyle } from './desktop-scale';

export { TypographyScope, useDesktopTypography } from './TypographyScope';
export type { TypographyScopeProps, TypographyMode, TypographyScale } from './TypographyScope';
