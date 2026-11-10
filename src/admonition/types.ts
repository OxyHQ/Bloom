import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { BloomSize } from '../appearance';
import type { ButtonProps } from '../button';

export type AdmonitionType = 'info' | 'tip' | 'warning' | 'error' | 'apology';

export interface AdmonitionIconProps {
  testID?: string;
}

export interface AdmonitionContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface AdmonitionTextProps {
  children?: ReactNode;
  style?: TextStyle;
}

export type AdmonitionButtonProps = ButtonProps;

export interface AdmonitionRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface AdmonitionRootProps {
  children: ReactNode;
  type?: AdmonitionType;
  size?: BloomSize;
  style?: StyleProp<ViewStyle>;
}

export interface AdmonitionProps {
  children?: ReactNode;
  type?: AdmonitionType;
  size?: BloomSize;
  style?: StyleProp<ViewStyle>;
}
