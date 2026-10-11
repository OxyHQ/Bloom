import { createElement } from 'react';
import { useBloomAppearance } from '../appearance/context';
import { resolveButtonPalette } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { FAB_METRICS } from './constants';
import { FabLabel } from './FabLabel';
import type { ButtonProps } from '../button/types';
import type { FabProps } from './types';

export function useFabProps({
  label,
  icon,
  iconSize,
  size,
  collapsed = false,
  tone,
  appearance = 'solid',
  labelStyle,
  textStyle,
  style,
  ...props
}: FabProps): ButtonProps {
  const theme = useTheme();
  const resolved = useBloomAppearance({ size, tone }, { size: 'md', tone: 'action' });
  const palette = resolveButtonPalette(appearance, theme, resolved.tone);
  const foreground = props.disabled ? palette.disabled.foreground : palette.rest.foreground;
  const diameter = FAB_METRICS[resolved.size].diameter;
  const glyphSize =
    typeof iconSize === 'number' && Number.isFinite(iconSize) && iconSize > 0
      ? iconSize
      : FAB_METRICS[resolved.size].iconSize;
  return {
    ...props,
    ...resolved,
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
