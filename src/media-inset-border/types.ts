import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { borderRadius } from '../styles/tokens';

export interface MediaInsetBorderProps {
  /**
   * Render a solid, full-contrast border instead of the default softened one.
   * Use where the inset border must line up with adjacent opaque borders, such
   * as external link-preview cards.
   */
  opaque?: boolean;
  /**
   * Extra style merged last. Override `borderRadius` here to match the corner
   * radius of the surrounding media box.
   */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}
