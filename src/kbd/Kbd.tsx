import React, { memo } from 'react';
import { Platform, StyleSheet, View, type TextStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { borderRadius } from '../styles/tokens';
import type { KbdProps } from './types';

const SIZE_CONFIG = {
  sm: { minWidth: 18, height: 18, fontSize: 11, paddingHorizontal: 4 },
  md: { minWidth: 22, height: 22, fontSize: 12, paddingHorizontal: 6 },
} as const;

/**
 * A small keyboard-key chip. Bordered, monospace via the Bloom mono font
 * token, themed for light/dark. Used to surface shortcuts (e.g. `⌘K`,
 * `Esc`) inside menus, command palettes and tooltips.
 */
const KbdComponent = function Kbd({
  children,
  size = 'md',
  style,
  textStyle,
  testID,
}: KbdProps) {
  const theme = useTheme();
  const cfg = SIZE_CONFIG[size];

  const monoFamily: TextStyle =
    Platform.OS === 'web'
      ? { fontFamily: 'var(--bloom-font-mono)' }
      : { fontFamily: 'Geist Mono' };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          minWidth: cfg.minWidth,
          height: cfg.height,
          paddingHorizontal: cfg.paddingHorizontal,
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border,
        },
        style,
      ]}>
      <Text
        numberOfLines={1}
        style={[
          monoFamily,
          {
            fontSize: cfg.fontSize,
            lineHeight: cfg.height,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          },
          textStyle,
        ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const Kbd = memo(KbdComponent);
Kbd.displayName = 'Kbd';
