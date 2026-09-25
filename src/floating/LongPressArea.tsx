/**
 * A long-press target that never becomes the touch RESPONDER — native only,
 * the trigger `ContextMenuTrigger` renders around content it does not own.
 *
 * ── WHY NOT A `Pressable` ───────────────────────────────────────────────────
 *
 * On Android the view holding the JS responder intercepts every later MOVE of
 * that touch natively (`JSResponderHandler.onInterceptTouchEvent` returns true
 * for the responder's own id). A `Pressable` claims the responder on touch
 * start, so a horizontal `ScrollView` INSIDE it never sees the drag: a turn
 * wrapped in the context menu's trigger could not scroll its code block
 * sideways (Pixel 8a, Android 16; the same block scrolled without the wrapper).
 * A vertical scroller ABOVE the trigger kept working, because a parent
 * intercepts before its child — which is why only the inner one broke.
 *
 * So the hold is timed off the RAW touch events, which every ancestor receives
 * without claiming anything: a scroller that takes the drag cancels the touch,
 * and a finger that travels past the slop or lifts early cancels the timer.
 * Taps keep going to whatever the content itself makes pressable.
 *
 * Assistive tech reaches the menu through the `longpress` accessibility action
 * (TalkBack's double-tap-and-hold, VoiceOver's actions rotor).
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
} from 'react-native';

import type { TriggerHandleProps } from './types';

/** `Pressable`'s own default, so a context menu opens on the platform's usual hold. */
export const LONG_PRESS_MS = 500;
/** How far the finger may drift and still be holding, in dp (`Pressability`'s deactivation distance). */
export const LONG_PRESS_SLOP = 10;

export type LongPressAreaProps = Partial<TriggerHandleProps> & {
  children?: React.ReactNode;
};

export function LongPressArea({
  children,
  onLongPress,
  // A press is the content's own business: the area never claims one.
  onPress: _onPress,
  disabled,
  accessibilityLabel,
  accessibilityRole,
  ...aria
}: LongPressAreaProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  const onTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      cancel();
      // A second finger is a pinch or a scroll, not a hold.
      if (disabled || !onLongPressRef.current || event.nativeEvent.touches?.length > 1) return;
      origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      timer.current = setTimeout(() => {
        timer.current = null;
        origin.current = null;
        onLongPressRef.current?.(event);
      }, LONG_PRESS_MS);
    },
    [cancel, disabled],
  );
  const onTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      const start = origin.current;
      if (!start) return;
      const dx = event.nativeEvent.pageX - start.x;
      const dy = event.nativeEvent.pageY - start.y;
      if (dx * dx + dy * dy > LONG_PRESS_SLOP * LONG_PRESS_SLOP) cancel();
    },
    [cancel],
  );
  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'longpress' && !disabled) {
        onLongPressRef.current?.(event as unknown as GestureResponderEvent);
      }
    },
    [disabled],
  );

  return (
    <View
      {...aria}
      // One node, as the `Pressable` it replaces was: the hold is its action.
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={disabled ? undefined : [{ name: 'longpress', label: accessibilityLabel }]}
      onAccessibilityAction={onAccessibilityAction}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={cancel}
      onTouchCancel={cancel}>
      {children}
    </View>
  );
}
