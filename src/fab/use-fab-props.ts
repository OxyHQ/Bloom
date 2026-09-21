import { cloneElement, createElement, isValidElement, useMemo } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import { useBloomAppearance } from '../appearance/context';
import type { BloomSize, BloomTone } from '../appearance/types';
import { resolveButtonPalette } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { FAB_METRICS } from './constants';
import { FabLabel } from './FabLabel';
import type { ButtonProps } from '../button/types';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import type { WebCssStyle } from '../styles/web-view-style';
import { useFabMinimized } from './use-fab-minimized';
import type { FabProps } from './types';

const LEGACY_SIZE = { small: 'xs', medium: 'md', large: 'lg' } as const;
const LEGACY_TONE = { primary: 'accent', secondary: 'support', tertiary: 'action', surface: 'neutral' } as const;

export function useFabProps({ label, children, icon, iconSize, size, collapsed = false, variant, tone, appearance = 'solid', placement = 'static', offset = 16, minimizeBehavior = 'none', labelStyle, textStyle, zIndex, accessibilityHint: _hint, style, ...props }: FabProps): ButtonProps {
  const theme = useTheme();
  const normalizedSize: BloomSize | undefined = typeof size === 'number' ? 'md' : size && size in LEGACY_SIZE ? LEGACY_SIZE[size as keyof typeof LEGACY_SIZE] : size as BloomSize | undefined;
  const resolved = useBloomAppearance({ size: normalizedSize, tone: tone ?? (variant ? LEGACY_TONE[variant] as BloomTone : undefined) }, { size: 'md', tone: 'action' });
  const minimized = useFabMinimized(minimizeBehavior !== 'none');
  const bottomInset = useBottomEdgeInset();
  const hidden = minimized && minimizeBehavior === 'hide';
  const labelCollapsed = collapsed || (minimized && minimizeBehavior === 'collapse');
  const palette = resolveButtonPalette(appearance, theme, resolved.tone);
  const foreground = props.disabled ? palette.disabled.foreground : palette.rest.foreground;
  const diameter = typeof size === 'number' && Number.isFinite(size) ? Math.max(1, size) : FAB_METRICS[resolved.size].diameter;
  const glyphSize = typeof iconSize === 'number' && Number.isFinite(iconSize) && iconSize > 0 ? iconSize : FAB_METRICS[resolved.size].iconSize;
  const sourceIcon = icon ?? children;
  // Let Button paint legacy elements through the same state-aware icon path.
  const resolvedIcon = useMemo(() => {
    if (!isValidElement<{ width?: number; height?: number; fill?: string; color?: string }>(sourceIcon)) return sourceIcon;
    const element = sourceIcon;
    return function FabElementIcon(paint: { width?: number; height?: number; fill?: string }) {
      return cloneElement(element, {
        width: paint.width,
        height: paint.height,
        ...(element.props.fill == null && element.props.color == null ? { fill: paint.fill } : {}),
      });
    };
  }, [sourceIcon]);
  const position: ViewStyle & WebCssStyle = {};
  if (placement !== 'static') {
    const bottom = placement.startsWith('bottom');
    const right = placement.endsWith('right');
    if (Platform.OS === 'web') {
      Object.assign(position, { position: 'sticky', alignSelf: right ? 'flex-end' : 'flex-start', ...(bottom ? { bottom: offset + bottomInset, marginTop: 'auto', marginBottom: offset + bottomInset } : { top: offset, marginTop: offset }), marginLeft: right ? undefined : offset, marginRight: right ? offset : undefined });
    } else {
      Object.assign(position, { position: 'absolute', [bottom ? 'bottom' : 'top']: offset + (bottom ? bottomInset : 0), [right ? 'right' : 'left']: offset });
    }
  }
  return { ...props, ...resolved, appearance, icon: resolvedIcon, iconSize: glyphSize, trailing: label ? createElement(FabLabel, { label, collapsed: labelCollapsed, color: foreground, variant: props.textVariant ?? FAB_METRICS[resolved.size].labelVariant, style: [labelStyle, textStyle], testID: props.testID ? `${props.testID}-label` : undefined }) : undefined, accessibilityLabel: props.accessibilityLabel ?? label, textStyle: [labelStyle, textStyle], style: [{ height: diameter, minHeight: diameter, ...(label ? { width: 'auto', minWidth: diameter, paddingLeft: Math.max(0, (diameter - glyphSize) / 2), paddingRight: Math.max(0, (diameter - glyphSize) / 2), gap: 0 } : { width: diameter }), ...position, ...(zIndex == null ? {} : { zIndex }), ...(hidden ? { display: 'none' } : {}) }, style] };
}
