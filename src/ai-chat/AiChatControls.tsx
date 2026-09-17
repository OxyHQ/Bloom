import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Props as IconProps } from '../icons/shared';
import type { WebCssStyle } from '../styles/web-view-style';
import { useAiChatPlatform } from './context';
import { dataHook, IS_WEB, type AiChatPalette } from './shared';

/**
 * The family's small interactive pieces, shared by the message, image, code
 * and gallery blocks. Hover paint is state-driven (so it also paints on native);
 * the family sheet adds only the focus ring and the colour transitions.
 */

export type AiChatIcon = React.ComponentType<IconProps>;

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

/**
 * react-aria's `TooltipTrigger delay={200}`: open after a 200ms hover, close at
 * once. Controlled when `open` is given — `onOpenChange` then receives the hover
 * intent, as a controlled react-aria trigger does.
 */
export function useHoverTooltip({
  delay = 200,
  open: controlled,
  onOpenChange,
}: { delay?: number; open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeRef = useRef(onOpenChange);
  changeRef.current = onOpenChange;
  const isControlled = controlled !== undefined;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInner(next);
      changeRef.current?.(next);
    },
    [isControlled],
  );
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  const onHoverIn = useCallback(() => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay, setOpen]);
  const onHoverOut = useCallback(() => {
    clear();
    setOpen(false);
  }, [setOpen]);
  return { open, setOpen, onHoverIn, onHoverOut };
}

/** A control with the `sm` tooltip above it, opened by hover or keyboard focus. */
export function WithTooltip({
  label,
  open,
  onOpenChange,
  children,
}: {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { Tooltip, TooltipTrigger, TooltipTextBubble } = useAiChatPlatform();
  return (
    <Tooltip position="top" visible={open} onVisibleChange={onOpenChange}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipTextBubble size="sm">{label}</TooltipTextBubble>
    </Tooltip>
  );
}

/**
 * A 16px glyph button with no surface (the chat header's share / more, the code
 * panel's actions): icon-secondary, `foreground-icon-hover` on hover and focus.
 */
export function GlyphAction({
  icon: Icon,
  label,
  onPress,
  palette,
  size = 16,
  flip = false,
  hover = true,
  testID,
}: {
  icon: AiChatIcon;
  label: string;
  onPress?: () => void;
  palette: AiChatPalette;
  size?: number;
  flip?: boolean;
  /** Deepen on hover and focus. The undo glyph does not. */
  hover?: boolean;
  testID?: string;
}) {
  const [hovered, setLit] = useState(false);
  const lit = hover && hovered;
  const style: WebCssStyle = {
    flexShrink: 0,
    '--bloom-ai-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAiChatControl', 'bare')}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setLit(true)}
      onHoverOut={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
      style={style}>
      <View style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
        <Icon width={size} height={size} fill={lit ? palette.iconHover : palette.iconSecondary} />
      </View>
    </Pressable>
  );
}

/** Cross-fades between two glyphs: blur + scale 0.75 + fade, 200ms ease-out (the copy → check swap). */
export function SwapGlyph({ shown, size, children }: { shown: boolean; size: number; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    const target = shown ? 1 : 0;
    progress.value = reducedMotion ? target : withTiming(target, { duration: 200, easing: EASE_OUT });
  }, [shown, reducedMotion, progress]);
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.75 + 0.25 * progress.value }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${2 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, left: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * A square action on its own surface — the feedback buttons (`rounded-lg
 * bg-background-tertiary-default p-1.5`, secondary-hover on hover) and the
 * gallery panel's header actions (`rounded-md p-0.5`, primary-hover on hover).
 * The glyph deepens to icon-primary on hover. A tooltip names it.
 */
export function SurfaceAction({
  label,
  tooltip,
  tooltipOpen,
  onTooltipOpenChange,
  onPress,
  padding,
  radius,
  background,
  hoverBackground,
  palette,
  glyph,
  style,
  testID,
}: {
  label: string;
  /** Tooltip copy when it differs from the accessible name ("Copied!"). */
  tooltip?: string;
  /** Controlled tooltip, so a confirmation can hold it open and then dismiss it. */
  tooltipOpen?: boolean;
  onTooltipOpenChange?: (open: boolean) => void;
  onPress?: () => void;
  padding: number;
  radius: number;
  background: string;
  hoverBackground: string;
  palette: AiChatPalette;
  glyph: (color: string) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const tip = useHoverTooltip({ open: tooltipOpen, onOpenChange: onTooltipOpenChange });
  const [hovered, setHovered] = useState(false);
  // A press focuses the control too; only keyboard focus should raise the tooltip.
  const pointerDown = useRef(false);
  const surface: WebCssStyle = {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding,
    borderRadius: radius,
    backgroundColor: hovered ? hoverBackground : background,
    '--bloom-ai-chat-ring': palette.ring,
  };
  return (
    <WithTooltip label={tooltip ?? label} open={tip.open} onOpenChange={tip.setOpen}>
      <Pressable
        {...dataHook('bloomAiChatControl')}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          pointerDown.current = true;
          tip.onHoverOut();
        }}
        onPressOut={() => {
          pointerDown.current = false;
        }}
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
          tip.onHoverIn();
        }}
        onHoverOut={() => {
          setHovered(false);
          tip.onHoverOut();
        }}
        onFocus={() => {
          if (!pointerDown.current) tip.setOpen(true);
        }}
        onBlur={() => tip.setOpen(false)}
        style={[surface, style]}>
        {glyph(hovered ? palette.iconPrimary : palette.iconSecondary)}
      </Pressable>
    </WithTooltip>
  );
}
