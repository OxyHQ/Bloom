import React, { memo, useMemo } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { borderRadius } from '../styles/tokens';
import type { Theme } from '../theme/types';
import type { DividerAlign, DividerProps } from './types';

/**
 * The divider, with its colours built from Bloom's theme through the
 * neutral ramp every Bloom control paints from (`button/shared.ts`).
 *
 *              empty                          with content
 *   single     1px line                       row, gap 12, a line either side
 *   double     8 tall, 1px top + bottom       row, 1px top + bottom, py 10
 *   fill       8 tall pill, secondary surface row, radius 10, px 16, py 10
 *
 *   line       separator-border   neutral-200 / dark neutral-800
 *   fill       secondary surface  neutral-100 / dark neutral-900
 *   label      body-medium (Inter 14/20 500), text-secondary neutral-500 (both modes)
 */

interface DividerPalette {
  line: string;
  fill: string;
  label: string;
}

function resolveDividerPalette(theme: Theme): DividerPalette {
  const c = theme.colors;
  return { line: c.borderLight, fill: c.backgroundSecondary, label: c.textSecondary };
}

const JUSTIFY: Record<DividerAlign, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

const IS_WEB = Platform.OS === 'web';

const DividerComponent: React.FC<DividerProps> = ({
  variant = 'single',
  align = 'center',
  children,
  contentStyle,
  textStyle,
  color,
  thickness = 1,
  vertical = false,
  spacing = 0,
  style,
  testID,
}) => {
  const theme = useTheme();
  const palette = useMemo(() => resolveDividerPalette(theme), [theme]);
  const line = color ?? palette.line;
  const hasContent = children !== undefined && children !== null && children !== false;

  if (vertical) {
    return (
      <View
        testID={testID}
        role="separator"
        // react-native-web reads `aria-orientation`; React Native has no such
        // prop (and no orientation to announce), so it is web-only.
        {...(IS_WEB ? ({ 'aria-orientation': 'vertical' } as Record<string, unknown>) : {})}
        style={[
          {
            width: thickness,
            alignSelf: 'stretch',
            backgroundColor: line,
            marginHorizontal: spacing,
          },
          style,
        ]}
      />
    );
  }

  if (!hasContent) {
    const shape: ViewStyle =
      variant === 'double'
        ? {
            height: 8,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: line,
            borderBottomColor: line,
          }
        : variant === 'fill'
          ? { height: 8, borderRadius: borderRadius.full, backgroundColor: palette.fill }
          : { height: thickness, backgroundColor: line };
    return (
      <View
        testID={testID}
        role="separator"
        style={[{ width: '100%', marginVertical: spacing }, shape, style]}
      />
    );
  }

  const container: ViewStyle =
    variant === 'double'
      ? {
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: line,
          borderBottomColor: line,
          paddingTop: 10,
          paddingBottom: 10,
        }
      : variant === 'fill'
        ? {
            borderRadius: 10,
            backgroundColor: palette.fill,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
          }
        : { gap: 12 };

  const lineStyle: ViewStyle = { height: thickness, minWidth: 0, flex: 1, backgroundColor: line };
  const showLeadingLine = variant === 'single' && align !== 'start';
  const showTrailingLine = variant === 'single' && align !== 'end';

  return (
    <View
      testID={testID}
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: JUSTIFY[align],
          marginVertical: spacing,
        },
        container,
        style,
      ]}
    >
      {showLeadingLine ? <View aria-hidden style={lineStyle} /> : null}
      <View style={[{ flexShrink: 0 }, contentStyle]}>
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text variant="body-medium" style={[{ color: palette.label }, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      {showTrailingLine ? <View aria-hidden style={lineStyle} /> : null}
    </View>
  );
};

export const Divider = memo(DividerComponent);
Divider.displayName = 'Divider';
