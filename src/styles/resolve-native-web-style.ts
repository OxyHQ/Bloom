import type { CSSProperties } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { flattenWebStyle } from './flatten-web-style';

/** Preserve RN-style overrides when a family moves from RNW hosts to DOM hosts. */
export function resolveNativeWebStyle(style: StyleProp<ViewStyle | TextStyle>): CSSProperties {
  const input = flattenWebStyle(style) as Record<string, unknown>;
  const output: Record<string, unknown> = { ...input };
  for (const property of ['padding', 'margin'] as const) {
    for (const [axis, sides] of [['Horizontal', ['Left', 'Right']], ['Vertical', ['Top', 'Bottom']]] as const) {
      const key = `${property}${axis}`;
      if (input[key] !== undefined) {
        for (const side of sides) {
          const longhand = `${property}${side}`;
          if (input[longhand] === undefined) output[longhand] = input[key];
        }
      }
      delete output[key];
    }
  }
  for (const [native, css] of Object.entries({
    paddingStart: 'paddingInlineStart', paddingEnd: 'paddingInlineEnd',
    marginStart: 'marginInlineStart', marginEnd: 'marginInlineEnd',
    start: 'insetInlineStart', end: 'insetInlineEnd',
    borderStartWidth: 'borderInlineStartWidth', borderEndWidth: 'borderInlineEndWidth',
    borderStartColor: 'borderInlineStartColor', borderEndColor: 'borderInlineEndColor',
  })) {
    if (input[native] !== undefined) output[css] = input[native];
    delete output[native];
  }
  if (typeof input.lineHeight === 'number') output.lineHeight = `${input.lineHeight}px`;
  if (Array.isArray(input.fontVariant)) output.fontVariant = input.fontVariant.join(' ');
  if (Array.isArray(input.transform)) output.transform = input.transform.flatMap(entry =>
    Object.entries(entry).map(([name, value]) => {
      if (name === 'matrix') return `${(value as number[]).length === 6 ? 'matrix' : 'matrix3d'}(${(value as number[]).join(',')})`;
      const unit = typeof value === 'number' && (name.startsWith('translate') || name === 'perspective') ? 'px' : '';
      return `${name}(${value}${unit})`;
    }),
  ).join(' ');
  return output as CSSProperties;
}
