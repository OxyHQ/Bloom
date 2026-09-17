import React, { useState } from 'react';
import { Pressable } from 'react-native';

import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';

/**
 * The family's round glyph-only control: transparent (or `fill`) at rest,
 * `hoverFill` under the pointer — a colour change only. With `pressedState` it
 * is a toggle and carries `aria-pressed` (web) and `accessibilityState.selected`
 * (native).
 */
export function GlyphButton({
  label,
  onPress,
  size,
  children,
  fill,
  hoverFill,
  pressedState,
  ring,
  testID,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  size: number;
  children: React.ReactNode;
  fill: string;
  hoverFill: string;
  pressedState?: boolean;
  ring: string;
  testID?: string;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered ? hoverFill : fill,
    '--bloom-music-ring': ring,
  };
  const toggle = pressedState !== undefined;
  return (
    <Pressable
      {...webDataSet({ bloomMusicFocusable: '' })}
      role="button"
      accessibilityLabel={label}
      aria-pressed={toggle ? pressedState : undefined}
      accessibilityState={toggle ? { selected: pressedState } : undefined}
      onPress={onPress}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

