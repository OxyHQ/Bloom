import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { resolveButtonRamps } from '../button/shared';
import { Text, TYPE_SCALE } from '../typography';
import { borderRadius } from '../styles/tokens';
import type { KbdProps } from './types';

/**
 * `Kbd`: a keyboard-shortcut hint on a fully rounded neutral pill.
 *
 *              sm                   md (default)
 *   text       caption-2-semibold   caption-1-semibold (12/16 600)
 *   padding    4 × 1                4 × 2
 *   height     17                   20
 *
 *   fill       neutral-300 (dark: neutral-700)
 *   label      neutral-500 (dark: neutral-400), sans, tracking 0
 *
 * `md` is the base size; `sm` steps the ramp down one rung for a dense
 * menu row. `tracking-normal` overrides the caption's own tracking, so
 * the letter spacing is 0 at both sizes.
 */
const SIZE_CONFIG = {
  sm: { type: TYPE_SCALE['caption-2-semibold'], paddingVertical: 1 },
  md: { type: TYPE_SCALE['caption-1-semibold'], paddingVertical: 2 },
} as const;

/** Horizontal padding (`px-1`). */
const PADDING_HORIZONTAL = 4;

const KbdComponent = function Kbd({
  children,
  size = 'md',
  style,
  textStyle,
  testID,
}: KbdProps) {
  const theme = useTheme();
  const cfg = SIZE_CONFIG[size];
  const { neutral: n } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const dark = theme.isDark;

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius.full,
          paddingLeft: PADDING_HORIZONTAL,
          paddingRight: PADDING_HORIZONTAL,
          paddingTop: cfg.paddingVertical,
          paddingBottom: cfg.paddingVertical,
          backgroundColor: dark ? n[700] : n[300],
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          {
            ...cfg.type,
            letterSpacing: 0,
            color: dark ? n[400] : n[500],
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

export const Kbd = memo(KbdComponent);
Kbd.displayName = 'Kbd';
