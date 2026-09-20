import { Platform, type ViewStyle } from 'react-native';
import { useBloomAppearance } from '../appearance/context';
import type { BloomSize, BloomTone } from '../appearance/types';
import type { ButtonProps } from '../button/types';
import { useBottomEdgeInset } from '../layout/bottom-edge';
import type { WebCssStyle } from '../styles/web-view-style';
import { useFabMinimized } from './use-fab-minimized';
import type { FabProps } from './types';

const DIAMETERS = { xs: 40, sm: 48, md: 56, lg: 64 } as const;
const LEGACY_SIZE = { small: 'xs', medium: 'md', large: 'lg' } as const;
const LEGACY_TONE = { primary: 'accent', secondary: 'support', tertiary: 'action', surface: 'neutral' } as const;

export function useFabProps({ label, children, icon, size, variant, tone, appearance = 'solid', placement = 'static', offset = 16, minimizeBehavior = 'none', labelStyle, textStyle, zIndex, accessibilityHint: _hint, style, ...props }: FabProps): ButtonProps {
  const normalizedSize: BloomSize | undefined = typeof size === 'number' ? 'md' : size && size in LEGACY_SIZE ? LEGACY_SIZE[size as keyof typeof LEGACY_SIZE] : size as BloomSize | undefined;
  const resolved = useBloomAppearance({ size: normalizedSize, tone: tone ?? (variant ? LEGACY_TONE[variant] as BloomTone : undefined) }, { size: 'md', tone: 'action' });
  const minimized = useFabMinimized(minimizeBehavior !== 'none');
  const bottomInset = useBottomEdgeInset();
  const hidden = minimized && minimizeBehavior === 'hide';
  const shownLabel = minimized && minimizeBehavior === 'collapse' ? undefined : label;
  const diameter = typeof size === 'number' && Number.isFinite(size) ? Math.max(1, size) : DIAMETERS[resolved.size];
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
  return { ...props, ...resolved, appearance, icon: icon ?? children, children: shownLabel, accessibilityLabel: props.accessibilityLabel ?? label, textStyle: [labelStyle, textStyle], style: [{ height: diameter, minHeight: diameter, ...(shownLabel ? { paddingLeft: 20, paddingRight: 20 } : { width: diameter }), ...position, ...(zIndex == null ? {} : { zIndex }), ...(hidden ? { display: 'none' } : {}) }, style] };
}
