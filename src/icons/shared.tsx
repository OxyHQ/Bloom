import React from 'react';
import { StyleSheet, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { type PathProps, type SvgProps } from 'react-native-svg';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

import { useTheme } from '../theme/use-theme';
import { gradients } from '../styles/tokens';

/**
 * Style prop for Bloom icons. Icons render via `<Svg>`, which is a View-like
 * host, so the style must be View-compatible. A `color` field is allowed as a
 * convenience for consumers who set fill via the CSS `color` shorthand (the
 * icon reads this as a fallback fill when no explicit `fill` prop is given).
 *
 * Note: we intentionally avoid `TextStyle` here — React Native 0.84 introduced
 * `cursor: CursorValue` on `ViewStyle` while `expo/types/react-native-web`
 * augments `TextStyle.cursor` to `string`, and the resulting invariance
 * breaks assignment of `StyleProp<TextStyle>` to `<Svg>`'s style slot.
 */
export type IconStyle = ViewStyle & { color?: ColorValue };

export type Props = {
  fill?: PathProps['fill'];
  style?: StyleProp<IconStyle>;
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

/** What {@link useCommonSVGProps} resolves; named so emitted declarations need no RN-internal path. */
export type CommonSVGProps = Omit<Props, 'fill' | 'size' | 'gradient' | 'style'> & {
  fill: PathProps['fill'];
  size: number;
  // `...rest` is spread last, so the CALLER's style wins over the flattened one.
  style: StyleProp<IconStyle>;
  gradient: React.JSX.Element | null;
};

export function useCommonSVGProps(props: Props): CommonSVGProps {
  const { colors } = useTheme();
  const reactId = React.useId();
  const { fill, size, gradient, ...rest } = props;
  const style: IconStyle | null | undefined = StyleSheet.flatten(rest.style);
  const _size = Number(size ? sizes[size] : rest.width || sizes.md);
  let _fill: PathProps['fill'] = fill ?? style?.color ?? colors.primary;
  let gradientDef: React.JSX.Element | null = null;

  if (gradient && gradients[gradient]) {
    const id = `${reactId}-${gradient}`;
    const config = gradients[gradient];
    _fill = `url(#${id})`;
    gradientDef = (
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="100%" y2="0" gradientTransform="rotate(45)">
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
