import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '../typography';
import { actionPanePaint } from './parts';
import {
  CHAT_ROW_RADIUS,
  SWIPE_ACTION_WIDTH,
  SWIPE_COMMIT_FRACTION,
  SWIPE_TAP_SLOP,
  type ChatListPaint,
} from './shared';
import type { ChatAction, ChatSwipeActions } from './types';

export interface ChatSwipeRowProps {
  actions: ChatSwipeActions;
  onAction?: (key: string) => void;
  /** The row's height, so the panes match it exactly. */
  height: number;
  paint: ChatListPaint;
  /** Names the tap target that closes an open pane. Default `'Close actions'`. */
  closeLabel?: string;
  children: React.ReactNode;
  testID?: string;
}

/**
 * The drag affordance behind a chat row, on touch.
 *
 * Dragging RIGHT uncovers `actions.left` from the left edge, dragging LEFT
 * uncovers `actions.right`. The row travels with the finger up to the pane's
 * full width (`SWIPE_ACTION_WIDTH` per action) and snaps open past
 * `SWIPE_COMMIT_FRACTION` of it, closed below — so a half-hearted drag never
 * leaves a row stuck ajar. Anything under `SWIPE_TAP_SLOP` is a tap and the
 * gesture springs straight back.
 *
 * The gesture activates only past a horizontal threshold and FAILS on vertical
 * travel, so a list scroll never turns into a swipe. Panes are laid under the
 * row and grow with it rather than sliding in from outside: the row is what
 * moves, and the action underneath is revealed, not pushed.
 *
 * WEB gets none of this. `ChatListItem` renders the same actions as hover
 * buttons there, because a drag is undiscoverable with a mouse and a
 * `pointerdown`-driven pan fights text selection.
 *
 * Reduced motion keeps the panes and drops the SNAP animation — the row jumps
 * to its resting position instead of easing to it.
 */
export function ChatSwipeRow({
  actions,
  onAction,
  height,
  paint,
  closeLabel = 'Close actions',
  children,
  testID,
}: ChatSwipeRowProps) {
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState<'left' | 'right' | null>(null);

  const left = actions.left ?? [];
  const right = actions.right ?? [];
  const leftWidth = left.length * SWIPE_ACTION_WIDTH;
  const rightWidth = right.length * SWIPE_ACTION_WIDTH;

  const settle = useCallback((next: 'left' | 'right' | null) => {
    setOpen(next);
  }, []);

  const close = useCallback(() => {
    translateX.value = reducedMotion ? 0 : withTiming(0, { duration: 160 });
    setOpen(null);
  }, [reducedMotion, translateX]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onChange((event) => {
          'worklet';
          const next = translateX.value + event.changeX;
          translateX.value = Math.max(-rightWidth, Math.min(leftWidth, next));
        })
        .onFinalize(() => {
          'worklet';
          const travelled = Math.abs(translateX.value);
          if (travelled < SWIPE_TAP_SLOP) {
            translateX.value = 0;
            runOnJS(settle)(null);
            return;
          }
          const opening = translateX.value > 0 ? 'left' : 'right';
          const full = opening === 'left' ? leftWidth : rightWidth;
          const commit = travelled >= full * SWIPE_COMMIT_FRACTION && full > 0;
          const target = commit ? (opening === 'left' ? leftWidth : -rightWidth) : 0;
          translateX.value = reducedMotion ? target : withTiming(target, { duration: 160 });
          runOnJS(settle)(commit ? opening : null);
        }),
    [leftWidth, reducedMotion, rightWidth, settle, translateX],
  );

  const rowStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: translateX.value }] }),
    [translateX],
  );
  const leftPaneStyle = useAnimatedStyle(
    () => ({ width: Math.max(0, translateX.value) }),
    [translateX],
  );
  const rightPaneStyle = useAnimatedStyle(
    () => ({ width: Math.max(0, -translateX.value) }),
    [translateX],
  );

  // The buttons keep their full width and are CLIPPED by the growing pane, so
  // they are revealed in place rather than squashed as the row travels.
  const pane = (list: readonly ChatAction[], side: 'left' | 'right') => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        flexDirection: 'row',
      }}
    >
      {list.map((action) => {
        const tone = actionPanePaint(action, paint);
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            role="button"
            accessibilityLabel={action.label}
            onPress={() => {
              action.onPress?.();
              onAction?.(action.key);
              close();
            }}
            style={{
              width: SWIPE_ACTION_WIDTH,
              height,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backgroundColor: tone.background,
            }}
            testID={testID ? `${testID}-action-${action.key}` : undefined}
          >
            <Icon width={22} height={22} fill={tone.foreground} />
            <Text
              variant="caption-2-medium"
              numberOfLines={1}
              style={{ color: tone.foreground }}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View
      style={{ position: 'relative', height, borderRadius: CHAT_ROW_RADIUS, overflow: 'hidden' }}
      testID={testID}
    >
      {leftWidth > 0 ? (
        <Animated.View
          style={[
            { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
            leftPaneStyle,
          ]}
        >
          {pane(left, 'left')}
        </Animated.View>
      ) : null}
      {rightWidth > 0 ? (
        <Animated.View
          style={[
            { position: 'absolute', right: 0, top: 0, bottom: 0, overflow: 'hidden' },
            rightPaneStyle,
          ]}
        >
          {pane(right, 'right')}
        </Animated.View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ height }, rowStyle]}>
          {children}
          {open !== null ? (
            // While a pane is open the row itself closes it rather than opening
            // the conversation — the same rule a tap outside an open menu follows.
            <Pressable
              role="button"
              accessibilityLabel={closeLabel}
              onPress={close}
              style={StyleSheet.absoluteFill}
              testID={testID ? `${testID}-dismiss` : undefined}
            />
          ) : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
