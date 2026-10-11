import type React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { styled } from 'react-native-css';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';

// The field owns two distinct boxes: layout and a non-layout inset ring. Keep
// their defaults below caller classes without moving the ring into box sizing.
//
// Horizontal padding is declared ONCE, as the logical pair. A rule that also
// declares `padding-left`/`padding-right` lets whichever comes later win for
// the same side, and an unset variable falls back to `initial`: with both
// families listed, `padding-inline-start: initial` silently zeroed every
// field's `paddingHorizontal` (7.17.0 to 7.33.0). Physical defaults are folded
// into the logical pair against this box's own `dir` (`horizontalPadding`).
const properties = [
  'width',
  'minWidth',
  'flex',
  'flexDirection',
  'alignItems',
  'position',
  'paddingInlineStart',
  'paddingInlineEnd',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'backgroundColor',
  'zIndex',
  'top',
  'right',
  'bottom',
  'left',
  'transitionProperty',
  'transitionDuration',
  'transitionTimingFunction',
] as const;
const cssName = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const fallbacks: Record<string, string> = {
  borderWidth: '0px',
  minWidth: '0px',
  flex: '0 0 auto',
  flexDirection: 'column',
};
/**
 * The resting horizontal padding as the logical pair. A logical value wins over
 * a physical one for the same side, as `paddingStart` wins over `paddingLeft`
 * in React Native; a physical value keeps its side by mapping through `dir`.
 */
export function horizontalPadding(
  defaults: React.CSSProperties,
  dir: 'ltr' | 'rtl',
): Pick<React.CSSProperties, 'paddingInlineStart' | 'paddingInlineEnd'> {
  const rtl = dir === 'rtl';
  return {
    paddingInlineStart:
      defaults.paddingInlineStart ?? (rtl ? defaults.paddingRight : defaults.paddingLeft),
    paddingInlineEnd:
      defaults.paddingInlineEnd ?? (rtl ? defaults.paddingLeft : defaults.paddingRight),
  };
}
export const FIELD_BOX_CSS = `@layer base { [data-bloom-field-box] { display:flex; box-sizing:border-box; border-style:solid; border-width:0; min-width:0; ${properties.map((name) => `${cssName(name)}:var(--bloom-field-${cssName(name)},${fallbacks[name] ?? 'initial'});`).join('')} } }`;
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
function FieldBoxComponent({
  children,
  className,
  style,
  baseStyle,
  stateStyle,
  dir,
  pointerEvents,
  onClick,
  onMouseOver,
  onMouseOut,
  testID,
}: FieldBoxProps) {
  useInteractiveWebCss('bloom-field-box', FIELD_BOX_CSS);
  if (Platform.OS !== 'web')
    return (
      <View pointerEvents={pointerEvents} testID={testID} style={[baseStyle, style, stateStyle]}>
        {children}
      </View>
    );
  const resolved = resolveNativeWebStyle(baseStyle);
  const defaults = { ...resolved, ...horizontalPadding(resolved, dir ?? 'ltr') };
  const variables: Record<string, unknown> = {};
  for (const name of properties) {
    const value = defaults[name as keyof React.CSSProperties];
    if (value === undefined || value === null) {
      variables[`--bloom-field-${cssName(name)}`] = 'initial';
      continue;
    }
    const unit = typeof value === 'number' && !['flex', 'zIndex'].includes(name) ? 'px' : '';
    variables[`--bloom-field-${cssName(name)}`] = `${value}${unit}`;
  }
  return (
    <div
      data-bloom-field-box=""
      data-testid={testID}
      className={className}
      dir={dir ?? 'ltr'}
      onClick={onClick}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={{
        ...variables,
        ...resolveNativeWebStyle(style),
        ...resolveNativeWebStyle(stateStyle),
        pointerEvents,
      }}
    >
      {/* RNW resolves logical styles from its own direction context. This
        context carrier has no CSS box; the div remains the sole layout host. */}
      <View {...{ dir: dir ?? 'ltr' }} style={{ display: 'contents' }}>
        {children}
      </View>
    </div>
  );
}
const NativeFieldBox = styled(FieldBoxComponent, { className: 'style' });
export const FieldBox = Platform.OS === 'web' ? FieldBoxComponent : NativeFieldBox;
