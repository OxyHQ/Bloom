/**
 * The composer's anchored panel — NATIVE.
 *
 * Unlike Bloom's menu families this does NOT present a bottom sheet. The
 * composer's menus are small panels hanging off their trigger, and the model
 * picker opens a SECOND panel (effort) from inside the first — a sheet inside a
 * sheet is not something `BottomSheet` stacks. So each panel is a transparent
 * `Modal` holding a dismiss layer and the panel, placed against the trigger's
 * `measureInWindow` box: on the requested side when it fits, flipped when it
 * does not, clamped 8px inside the window's SAFE area. The Modal draws edge to
 * edge, so a clamp to the bare window put the effort panel under Android's
 * gesture bar (Pixel 8a, Android 16). Nested `Modal`s stack on both
 * platforms, so the effort panel opens above the picker.
 *
 * Motion is the popover entry without the blur (no filter on native):
 * 150ms `ease-out` fade + `scale(0.95 → 1)`, snapped under reduced motion.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
  type View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TRANSITION_MS } from './shared';
import type { ComposerPopoverProps } from './types';

const GUTTER = 8;
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ComposerPopover({
  open,
  onOpenChange,
  anchorRef,
  label,
  side,
  sideOffset,
  style,
  testID,
  children,
}: ComposerPopoverProps) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [anchor, setAnchor] = useState<Box | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const node = anchorRef.current as View | null;
      if (node && typeof node.measureInWindow === 'function') {
        node.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
      } else {
        setAnchor({ x: GUTTER, y: GUTTER, width: 0, height: 0 });
      }
      return;
    }
    if (reducedMotion) {
      progress.value = 0;
      setMounted(false);
      return;
    }
    progress.value = withTiming(0, { duration: TRANSITION_MS, easing: EASE_OUT }, (finished) => {
      'worklet';
      if (finished) runOnJS(setMounted)(false);
    });
  }, [open, anchorRef, reducedMotion, progress]);

  const placed = open && anchor !== null && size !== null;
  useEffect(() => {
    if (!placed) return;
    progress.value = reducedMotion
      ? 1
      : withTiming(1, { duration: TRANSITION_MS, easing: EASE_OUT });
  }, [placed, reducedMotion, progress]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.95 + 0.05 * progress.value }],
    }),
    [progress],
  );

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  if (!mounted) return null;

  let left = GUTTER;
  let top = GUTTER;
  if (anchor && size) {
    const minLeft = insets.left + GUTTER;
    const maxRight = window.width - insets.right - GUTTER;
    const minTop = insets.top + GUTTER;
    const maxBottom = window.height - insets.bottom - GUTTER;
    left = Math.max(minLeft, Math.min(anchor.x, maxRight - size.width));
    const above = anchor.y - sideOffset - size.height;
    const below = anchor.y + anchor.height + sideOffset;
    const fitsAbove = above >= minTop;
    const fitsBelow = below + size.height <= maxBottom;
    const preferAbove = side === 'top' ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;
    top = preferAbove ? above : below;
    top = Math.max(minTop, Math.min(top, maxBottom - size.height));
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <Animated.View
        testID={testID}
        accessibilityLabel={label}
        accessibilityViewIsModal
        onLayout={onLayout}
        style={[
          { position: 'absolute', left, top, maxWidth: window.width - 32 },
          style,
          animatedStyle,
          placed ? null : { opacity: 0 },
        ]}>
        {children}
      </Animated.View>
    </Modal>
  );
}
