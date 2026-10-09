import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { styled } from 'react-native-css';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';

// The field owns two distinct boxes: layout and a non-layout inset ring. Keep
// their defaults below caller classes without moving the ring into box sizing.
const properties = ['width', 'minWidth', 'flex', 'flexDirection', 'alignItems', 'position',
  'paddingLeft', 'paddingRight', 'paddingInlineStart', 'paddingInlineEnd', 'borderRadius',
  'borderWidth', 'borderColor', 'backgroundColor', 'zIndex', 'top', 'right', 'bottom', 'left',
  'transitionProperty', 'transitionDuration', 'transitionTimingFunction'] as const;
const cssName = (name: string) => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
const fallbacks: Record<string, string> = { borderWidth:'0px', minWidth:'0px', flex:'0 0 auto', flexDirection:'column' };
const CSS = `@layer base { [data-bloom-field-box] { display:flex; box-sizing:border-box; border-style:solid; border-width:0; min-width:0; ${properties.map(name => `${cssName(name)}:var(--bloom-field-${cssName(name)},${fallbacks[name] ?? 'initial'});`).join('')} } }`;
interface FieldBoxProps {
  children?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  baseStyle?: StyleProp<ViewStyle>;
  stateStyle?: StyleProp<ViewStyle>;
  dir?: 'rtl';
  pointerEvents?: 'none' | 'auto';
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  testID?: string;
}
function FieldBoxComponent({ children, className, style, baseStyle, stateStyle, dir, pointerEvents, onClick,
  onMouseOver, onMouseOut, testID }: FieldBoxProps) {
  useInteractiveWebCss('bloom-field-box', CSS);
  if (Platform.OS !== 'web') return <View pointerEvents={pointerEvents} testID={testID}
    style={[baseStyle, style, stateStyle]}>{children}</View>;
  const defaults = resolveNativeWebStyle(baseStyle);
  const variables: Record<string, unknown> = {};
  for (const name of properties) {
    const value = defaults[name as keyof React.CSSProperties];
    if (value === undefined || value === null) { variables[`--bloom-field-${cssName(name)}`] = 'initial'; continue; }
    const unit = typeof value === 'number' && !['flex', 'zIndex'].includes(name) ? 'px' : '';
    variables[`--bloom-field-${cssName(name)}`] = `${value}${unit}`;
  }
  return <div data-bloom-field-box="" data-testid={testID} className={className} dir={dir ?? 'ltr'}
    onClick={onClick} onMouseOver={onMouseOver} onMouseOut={onMouseOut}
    style={{ ...variables, ...resolveNativeWebStyle(style), ...resolveNativeWebStyle(stateStyle), pointerEvents }}>
    {/* RNW resolves logical styles from its own direction context. This
        context carrier has no CSS box; the div remains the sole layout host. */}
    <View {...{ dir: dir ?? 'ltr' }} style={{ display: 'contents' }}>{children}</View>
  </div>;
}
const NativeFieldBox = styled(FieldBoxComponent, { className: 'style' });
export const FieldBox = Platform.OS === 'web' ? FieldBoxComponent : NativeFieldBox;
