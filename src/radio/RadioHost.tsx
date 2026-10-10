import React, { forwardRef, type KeyboardEvent, type ReactNode } from 'react';
import { Platform, type View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { Text } from '../typography';
import { TYPE_SCALE, type TypeScaleVariant } from '../typography/scale';

// RNW's unlayered View reset outranks consumer @layer classes. Radio owns its
// small DOM hosts so authored classes keep authority, while native uses styled
// primitives and the same styles/selection logic.
const BASE = `@layer base {
.bloom-radio-host { box-sizing:border-box; display:flex; flex-shrink:0; min-width:0; border:0 solid; padding:0; margin:0; background:transparent; font:inherit; text-align:start; }
.bloom-radio-group { display:flex; flex-direction:column; min-width:0; }
.bloom-radio-label { font-family:var(--bloom-font-sans); white-space:pre-wrap; overflow-wrap:break-word; }
}`;
interface HostProps {
  children?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: 'radio';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  nativeID?: string;
  testID?: string;
  hitSlop?: number | { top: number; bottom: number; left: number; right: number };
  dataSet?: Record<string, string>;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  tabIndex?: 0 | -1;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: KeyboardEvent<HTMLElement>) => void;
}
export const RadioHost = forwardRef<View, HostProps>(function RadioHost(props, ref) {
  useInteractiveWebCss('bloom-radio-host', BASE);
  if (Platform.OS !== 'web') return <StyledPressable {...props} ref={ref} />;
  const { children, className, style, disabled, accessibilityLabel, accessibilityHint,
    nativeID, testID, dataSet, onPress, onPressIn, onPressOut, onHoverIn, onHoverOut,
    onBlur, onKeyDown, onKeyUp, tabIndex } = props;
  const data = Object.fromEntries(Object.entries(dataSet ?? {}).map(([key, value]) =>
    [`data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value]));
  return <button ref={ref as unknown as React.Ref<HTMLButtonElement>} type="button" role="radio"
    {...data} id={nativeID} data-testid={testID} disabled={disabled} tabIndex={tabIndex}
    aria-label={accessibilityLabel} aria-description={accessibilityHint}
    aria-checked={props['aria-checked']} aria-disabled={disabled || undefined}
    aria-invalid={props['aria-invalid']} aria-describedby={props['aria-describedby']}
    className={['bloom-radio-host', className].filter(Boolean).join(' ')}
    style={resolveNativeWebStyle(style)}
    onClick={() => { if (!disabled) onPress(); }}
    onPointerDown={() => { if (!disabled) onPressIn?.(); }} onPointerUp={onPressOut} onPointerCancel={onPressOut}
    onMouseEnter={onHoverIn} onMouseLeave={() => { onHoverOut?.(); onPressOut?.(); }}
    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') onPressIn?.(); onKeyDown?.(event); }}
    onKeyUp={event => { onPressOut?.(); onKeyUp?.(event); }}
    onBlur={() => { onPressOut?.(); onBlur?.(); }}
  >{children}</button>;
});

interface LayoutProps {
  children?: ReactNode; className?: string; style?: StyleProp<ViewStyle>; dir?: 'rtl';
  accessibilityRole?: 'radiogroup'; accessibilityLabel?: string; testID?: string;
  'aria-label'?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean;
  'aria-disabled'?: boolean; 'aria-required'?: boolean;
}
export function RadioGroupHost(props: LayoutProps) {
  useInteractiveWebCss('bloom-radio-host', BASE);
  if (Platform.OS !== 'web') return <StyledView {...props} />;
  const { className, style, accessibilityRole, accessibilityLabel, testID, children, ...aria } = props;
  return <div {...aria} role={accessibilityRole} aria-label={accessibilityLabel}
    className={['bloom-radio-group', className].filter(Boolean).join(' ')} style={resolveNativeWebStyle(style)} data-testid={testID}>{children}</div>;
}

export function RadioLabel({ className, style, variant, children, numberOfLines }: {
  className?: string; style?: StyleProp<TextStyle>; variant: TypeScaleVariant; children?: ReactNode; numberOfLines?: number;
}) {
  if (Platform.OS !== 'web') return <Text className={className} variant={variant} style={style} numberOfLines={numberOfLines}>{children}</Text>;
  return <span className={['bloom-radio-label', className].filter(Boolean).join(' ')}
    style={{ ...(numberOfLines === 1 ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : {}), ...resolveNativeWebStyle([!className && TYPE_SCALE[variant], style]) }}>{children}</span>;
}
