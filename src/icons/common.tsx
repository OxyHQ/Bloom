import React from 'react';
import { StyleSheet, type TextProps } from 'react-native';
import { type PathProps, type SvgProps } from 'react-native-svg';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { gradients } from '../styles/tokens';

export type Props = {
  fill?: PathProps['fill'];
  style?: TextProps['style'];
  size?: keyof typeof sizes;
  gradient?: keyof typeof gradients;
} & Omit<SvgProps, 'style' | 'size'>;

export const sizes = {
  '2xs': 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 48,
} as const;

export function useCommonSVGProps(props: Props) {
  const { colors } = useTheme();
  const reactId = React.useId();
  const { fill, size, gradient, ...rest } = props;
  const style = StyleSheet.flatten(rest.style);
  const _size = Number(size ? sizes[size] : rest.width || sizes.md);
  let _fill = fill || (style as Record<string, string>)?.color || colors.primary;
  let gradientDef = null;

  if (gradient && gradients[gradient]) {
    const id = `${reactId}-${gradient}`;
    const config = gradients[gradient];
    _fill = `url(#${id})`;
    gradientDef = (
      <Defs>
        <LinearGradient
          id={id}
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          gradientTransform="rotate(45)">
          {config.values.map(([stop, fillColor]) => (
            <Stop key={String(stop)} offset={String(stop)} stopColor={fillColor} />
          ))}
        </LinearGradient>
      </Defs>
    );
  }

  return {
    fill: _fill,
    size: _size,
    style,
    gradient: gradientDef,
    ...rest,
  };
}
