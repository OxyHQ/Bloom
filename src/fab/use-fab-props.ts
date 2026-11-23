import { createElement, useContext } from 'react';
import { useBloomAppearance } from '../appearance/context';
import { resolveButtonPalette } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { FAB_METRICS, FAB_SHAPES, fabCornerRadius } from './constants';
import { surfaceStyle } from '../shapes/surface-style';
import { FabDiameterContext } from './fab-diameter';
import { FabLabel } from './FabLabel';
import type { ButtonProps } from '../button/types';
import type { FabProps } from './types';

/**
 * A FAB's diameter: the bar's height beside a bottom bar (`FabDiameterContext`), else its size's (the
 * nearest `BloomScope`'s, `md` by default).
 */
export function useFabDiameter(size?: FabProps['size']): number {
  const resolved = useBloomAppearance({ size }, { size: 'md', tone: 'accent' });
  return useContext(FabDiameterContext) ?? FAB_METRICS[resolved.size].diameter;
}

export function useFabProps({
  label,
  icon,
  iconSize,
  size,
  shape = 'circle',
  collapsed = false,
  tone,
  appearance = 'solid',
  labelStyle,
  textStyle,
  style,
  ...props
}: FabProps): ButtonProps {
  const theme = useTheme();
  // Tinted with the accent by default: the theme's primary, its glyph the on-primary colour (Apple's
  // `glassProminent`).
  const resolved = useBloomAppearance({ size, tone }, { size: 'md', tone: 'accent' });
  const palette = resolveButtonPalette(appearance, theme, resolved.tone);
  const foreground = props.disabled ? palette.disabled.foreground : palette.rest.foreground;
  const diameter = useFabDiameter(resolved.size);
  const glyphSize =
    typeof iconSize === 'number' && Number.isFinite(iconSize) && iconSize > 0
      ? iconSize
      : FAB_METRICS[resolved.size].iconSize;
  return {
    ...props,
    ...resolved,
    // A FAB floats over the content: the native lens where the device has it.
    material: props.material ?? 'lens',
    appearance,
    icon,
    iconSize: glyphSize,
    trailing: label
      ? createElement(FabLabel, {
          label,
          collapsed,
          color: foreground,
          variant: props.textVariant ?? FAB_METRICS[resolved.size].labelVariant,
          style: [labelStyle, textStyle],
          testID: props.testID ? `${props.testID}-label` : undefined,
        })
      : undefined,
    accessibilityLabel: props.accessibilityLabel ?? label,
    textStyle: [labelStyle, textStyle],
    style: [
      {
        height: diameter,
        minHeight: diameter,
        // The silhouette: the lens takes this radius as its corner, so the glass, its press and a
        // menu's morph follow it.
        ...(shape === 'circle'
          ? null
          : surfaceStyle({
              radius: fabCornerRadius(shape, diameter),
              curve: FAB_SHAPES[shape].curve,
            })),
        ...(label
          ? {
              width: 'auto',
              minWidth: diameter,
              paddingLeft: Math.max(0, (diameter - glyphSize) / 2),
              paddingRight: Math.max(0, (diameter - glyphSize) / 2),
              gap: 0,
            }
          : { width: diameter }),
      },
      style,
    ],
  };
}
