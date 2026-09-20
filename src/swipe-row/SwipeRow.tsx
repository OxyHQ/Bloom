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

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  SWIPE_ACTION_WIDTH,
  SWIPE_ACTIVATE_OFFSET,
  SWIPE_COMMIT_FRACTION,
  SWIPE_ROW_RADIUS,
  SWIPE_SNAP_DURATION,
  SWIPE_TAP_SLOP,
} from './constants';
import { resolveSwipeRowPaint, swipeActionPaint } from './shared';
import type { SwipeRowAction, SwipeRowProps } from './types';

/**
 * ONE drag affordance for every list row in this library.
 *
 * Dragging RIGHT uncovers `actions.left` from the left edge, dragging LEFT
 * uncovers `actions.right`. The row travels with the finger up to the pane's
 * full width (`actionWidth` per action) and snaps open past
 * `SWIPE_COMMIT_FRACTION` of it, closed below — so a half-hearted drag never
 * leaves a row stuck ajar. Anything under `SWIPE_TAP_SLOP` is a tap and the
 * gesture springs straight back.
 *
 * The gesture activates only past a horizontal threshold and FAILS on vertical
 * travel, so a list scroll never turns into a swipe. Panes are laid UNDER the
 * row and grow with it rather than sliding in from outside: the row is what
 * moves, and the action underneath is revealed, not pushed.
 *
 * It owns the gesture and almost nothing else. It draws no row and knows no
 * density; the one colour it insists on is the OPAQUE fill under the
 * travelling layer, because the panes are behind the row and would otherwise
 * read straight through it. It resolves no other row colours — the caller passes its children, and either the
 * pane pairs it already resolved or nothing at all, in which case the panes
 * come off the theme. That is what lets a chat row and a mail row share one
 * implementation instead of drifting into two.
 *
 * WHO GETS IT is `useSwipeAvailable()`: every touch pointer, on any platform.
 * A mouse gets whatever hover affordance the calling family draws, because a
 * drag is undiscoverable with a pointer.
 *
 * A SWIPE IS NOT REACHABLE BY KEYBOARD OR BY A SCREEN READER, and this
 * component does not pretend otherwise: while a pane is closed it is hidden
 * from assistive technology entirely, rather than leaving invisible buttons in
 * the tab order for focus to disappear into. The caller owes those actions a
 * second path — a hover rail, a row menu, or `accessibilityActions` on the row
 * itself. `mail-list` does the last two; see `docs/swipe-row.mdx`.
 *
 * Reduced motion keeps the panes and drops the SNAP animation — the row jumps
 * to its resting position instead of easing to it.
 */
export function SwipeRow({
  actions,
  onAction,
  height,
  paint,
  background,
  radius = SWIPE_ROW_RADIUS,
  actionWidth = SWIPE_ACTION_WIDTH,
  closeLabel = 'Close actions',
  onOpenChange,
  children,
  testID,
}: SwipeRowProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState<'left' | 'right' | null>(null);

  const tones = useMemo(() => paint ?? resolveSwipeRowPaint(theme), [paint, theme]);
  // The panes sit UNDER the row, so the travelling layer has to be opaque or
  // they read through it.
  const rowFill = background ?? theme.colors.background;
  const left = actions.left ?? [];
  const right = actions.right ?? [];
  const leftWidth = left.length * actionWidth;
  const rightWidth = right.length * actionWidth;

  const settle = useCallback(
    (next: 'left' | 'right' | null) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const close = useCallback(() => {
    translateX.value = reducedMotion ? 0 : withTiming(0, { duration: SWIPE_SNAP_DURATION });
    settle(null);
  }, [reducedMotion, settle, translateX]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE_ACTIVATE_OFFSET, SWIPE_ACTIVATE_OFFSET])
        .failOffsetY([-SWIPE_ACTIVATE_OFFSET, SWIPE_ACTIVATE_OFFSET])
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
          translateX.value = reducedMotion
            ? target
            : withTiming(target, { duration: SWIPE_SNAP_DURATION });
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
  const pane = (list: readonly SwipeRowAction[], side: 'left' | 'right') => (
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
        const tone = swipeActionPaint(action, tones);
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
              width: actionWidth,
              alignSelf: 'stretch',
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

  // A closed pane is 0 wide and clipped, so anything inside it is a control
  // nobody can see. Hiding it is the difference between "unreachable" and
  // "reachable, invisible, and it steals the focus ring".
  const hiddenWhenClosed = (side: 'left' | 'right') =>
    open === side
      ? null
      : ({ 'aria-hidden': true, importantForAccessibility: 'no-hide-descendants' } as const);

  return (
    <View
      style={{
        position: 'relative',
        ...(height === undefined ? null : { height }),
        borderRadius: radius,
        overflow: 'hidden',
      }}
      testID={testID}
    >
      {leftWidth > 0 ? (
        <Animated.View
          {...hiddenWhenClosed('left')}
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
          {...hiddenWhenClosed('right')}
          style={[
            { position: 'absolute', right: 0, top: 0, bottom: 0, overflow: 'hidden' },
            rightPaneStyle,
          ]}
        >
          {pane(right, 'right')}
        </Animated.View>
      ) : null}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            { backgroundColor: rowFill },
            height === undefined ? null : { height },
            rowStyle,
          ]}
        >
          {children}
          {open !== null ? (
            // While a pane is open the row itself closes it rather than opening
            // what it points at — the same rule a tap outside an open menu follows.
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
