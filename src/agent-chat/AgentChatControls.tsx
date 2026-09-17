import React, { useMemo, useState } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { paintToCssImage, type ButtonStatePaint } from '../button/shared';
import { DISABLED_OPACITY } from '../styles/tokens';
import type { WebAriaProps } from '../styles/styled-primitives';
import type { WebCssStyle } from '../styles/web-view-style';
import { dataHook, IS_WEB, TRANSITION_MS, type AgentChatPalette } from './shared';

/**
 * The family's two bespoke control shapes. Both are plain `<button>`s
 * rather than `IconButton`/`Button` (a `DropdownTrigger` is itself a button,
 * so the trigger is styled directly instead of nesting one button in
 * another), and both are full circles under Bloom's pill rule for button-like
 * controls.
 */

type IconRender = (color: string) => React.ReactNode;

export interface IconActionProps {
  label: string;
  /** Box side: 28 (`size-7`) or 24 (`size-6`). */
  size: number;
  icon: IconRender;
  /** Resting glyph colour. */
  color: string;
  /** Glyph colour on hover / while `active`. */
  hoverColor: string;
  /** Fill on hover / while `active`. */
  hoverBackground: string;
  /** Painted as hovered (an open menu's trigger). */
  active?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  palette: AgentChatPalette;
  testID?: string;
  // Forwarded by `DropdownMenuTrigger asChild`.
  accessibilityLabel?: string;
  accessibilityRole?: 'button';
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
}

/** A transparent circle whose fill and glyph step up on hover. */
export function IconAction({
  label,
  size,
  icon,
  color,
  hoverColor,
  hoverBackground,
  active = false,
  disabled = false,
  onPress,
  palette,
  testID,
  accessibilityLabel,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHaspopup,
}: IconActionProps) {
  const [hovered, setHovered] = useState(false);
  const lit = !disabled && (hovered || active);
  const style: WebCssStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: lit ? hoverBackground : 'transparent',
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-agent-chat-ring': palette.ring,
  };
  const webAria: WebAriaProps | null =
    IS_WEB && ariaHaspopup ? { 'aria-haspopup': ariaHaspopup } : null;
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      {...webAria}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      aria-expanded={ariaExpanded}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled, expanded: ariaExpanded }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      {icon(lit ? hoverColor : color)}
    </Pressable>
  );
}

let gradientSeq = 0;

/** A two-stop top-to-bottom fill: a CSS gradient on web, an SVG rect on native. */
function GradientFill({
  paint,
  radius,
  opacity = 1,
}: {
  paint: ButtonStatePaint;
  radius: number;
  opacity?: number;
}) {
  const id = useMemo(() => `bloom-agent-chat-fill-${gradientSeq++}`, []);
  const [top, bottom] = paint.gradient ?? [paint.background, paint.background];
  if (IS_WEB) {
    const style: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radius,
      backgroundImage: paintToCssImage(paint),
      opacity,
      transitionProperty: 'opacity',
      transitionDuration: `${TRANSITION_MS}ms`,
      transitionTimingFunction: 'ease',
    };
    return <View pointerEvents="none" style={style} />;
  }
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export interface PrimaryDiscProps {
  label: string;
  size: number;
  disabled?: boolean;
  onPress?: () => void;
  /** Extra hover dimming (`hover:opacity-90`) on top of the hover gradient. */
  hoverOpacity?: number;
  palette: AgentChatPalette;
  /** The white glyph. */
  children: React.ReactNode;
  testID?: string;
}

/**
 * `bg-button-primary` on a bare circle: the accent gradient, the hover
 * gradient crossfading in over 150ms, the active gradient while held; disabled
 * paints the disabled gradient at the disabled opacity. No drop shadow — the utility
 * carries none (Bloom's `Button` adds one, which is why this is not a `Button`).
 */
export function PrimaryDisc({
  label,
  size,
  disabled = false,
  onPress,
  hoverOpacity = 1,
  palette,
  children,
  testID,
}: PrimaryDiscProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const paint = palette.primary;
  const base = disabled ? paint.disabled : pressed ? paint.active : paint.rest;
  const style: WebCssStyle = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size / 2,
    opacity: disabled ? DISABLED_OPACITY : hovered ? hoverOpacity : 1,
    '--bloom-agent-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <GradientFill paint={base} radius={size / 2} />
      {disabled ? null : (
        <GradientFill paint={paint.hover} radius={size / 2} opacity={hovered && !pressed ? 1 : 0} />
      )}
      <View pointerEvents="none" style={{ position: 'relative' }}>
        {children}
      </View>
    </Pressable>
  );
}
