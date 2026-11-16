import { useSurfaceFill } from '../styles/surface-levels';
import {
  type ReactNode,
  type ComponentRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  cancelAnimation,
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
import { useMessages } from '../locale/messages';
import { SWIPE_ROW_MESSAGES } from './messages';
import { SwipeRowScrollContext } from './context';
import { useHapticFeedback } from '../hooks/use-haptics';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { webDataSet } from '../styles/web-data';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { canFullSwipe, fullSwipeThreshold } from './bubble-geometry';
import { SwipeRowBubble } from './SwipeRowBubble';
import { IS_WEB } from '../styles/platform';

const BUBBLE_SPRING = { damping: 18, stiffness: 260, mass: 0.7 };

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
 * travel, so a vertical drag never turns into a swipe. That is NOT what keeps the
 * list scrollable on web, though: RNGH stamps `touch-action: none` on the
 * detector's view unless told otherwise, and rows tile the whole list, so a
 * touch browser would be told never to scroll it — `failOffsetY` is a JS
 * decision taken after the browser has already been told not to. The detector
 * therefore passes `touchAction="pan-y"`: vertical panning stays the browser's
 * (it cancels the pointer, and with it the pan, once it scrolls) and horizontal
 * movement still reaches the pan. Native ignores the prop. Panes are laid UNDER
 * the row and grow with it rather than sliding in from outside: the row is what
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
  actionPresentation = 'panes',
  fullSwipeAction,
  actions,
  onAction,
  height,
  paint,
  background,
  radius = SWIPE_ROW_RADIUS,
  actionWidth = SWIPE_ACTION_WIDTH,
  closeLabel: closeLabelProp,
  onOpenChange,
  children,
  style,
  testID,
}: SwipeRowProps) {
  useInteractiveWebCss(
    'bloom-swipe-scroll-css',
    `
[data-bloom-swipe-content] :not(:has([data-bloom-swipe-scroll])):not([data-bloom-swipe-scroll]):not([data-bloom-swipe-scroll] *) { touch-action: pan-y; }
`,
  );
  const { messages } = useMessages(SWIPE_ROW_MESSAGES);
  const closeLabel = closeLabelProp ?? messages.closeActions;
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const rowWidth = useSharedValue(0);
  const committing = useSharedValue(false);
  const bubbles = actionPresentation === 'bubbles';
  const host = useRef<ComponentRef<typeof View>>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const beginDrag = useCallback(() => {
    suppressClick.current = true;
    setDragging(true);
  }, []);
  // RNW can synthesize a click after a mouse drag. Suppress that release only;
  // a new pointer press or a keyboard activation remains an ordinary action.
  useEffect(() => {
    if (!bubbles || !IS_WEB) return;
    const node = host.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const reset = () => {
      suppressClick.current = false;
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick.current || event.detail === 0) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener('pointerdown', reset, true);
    node.addEventListener('click', click, true);
    return () => {
      node.removeEventListener('pointerdown', reset, true);
      node.removeEventListener('click', click, true);
    };
  }, [bubbles]);
  useEffect(() => () => cancelAnimation(translateX), [translateX]);
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState<'left' | 'right' | null>(null);
  const [horizontalScrollers, setHorizontalScrollers] = useState(0);
  const registerScroller = useCallback(() => {
    setHorizontalScrollers((count) => count + 1);
    return () => setHorizontalScrollers((count) => count - 1);
  }, []);

  const tones = useMemo(() => paint ?? resolveSwipeRowPaint(theme), [paint, theme]);
  // The panes sit UNDER the row, so the travelling layer has to be opaque or
  // they read through it.
  // Defaults to the surface the row sits on, not the page colour: on a panel
  // the two differ, and an opaque face in the page colour reads as a selection.
  const surfaceFill = useSurfaceFill();
  const rowFill = background ?? surfaceFill;
  const left = actions.left ?? [];
  const right = actions.right ?? [];
  const leftWidth = left.length * actionWidth;
  const rightWidth = right.length * actionWidth;
  const leftPrimary = bubbles
    ? left.findIndex((action) => action.key === fullSwipeAction?.left)
    : -1;
  const rightPrimary = bubbles
    ? right.findIndex((action) => action.key === fullSwipeAction?.right)
    : -1;

  const openRef = useRef<'left' | 'right' | null>(null);
  const settle = useCallback(
    (next: 'left' | 'right' | null) => {
      openRef.current = next;
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  // A swipe that opens a side's actions ticks as it lands; closing is silent.
  const haptics = useHapticFeedback();
  const settleSwipe = useCallback(
    (next: 'left' | 'right' | null) => {
      if (next !== null && next !== openRef.current) haptics.tap();
      settle(next);
    },
    [haptics, settle],
  );

  const close = useCallback(() => {
    setDragging(false);
    committing.value = false;
    translateX.value = reducedMotion
      ? 0
      : bubbles
        ? withSpring(0, { ...BUBBLE_SPRING, overshootClamping: true })
        : withTiming(0, { duration: SWIPE_SNAP_DURATION });
    settle(null);
  }, [bubbles, committing, reducedMotion, settle, translateX]);

  // Keep the gesture identity stable when action objects change. Nested scrollers
  // register against that gesture, while completion must read the current callbacks.
  const completion = useRef({
    left: left[leftPrimary],
    right: right[rightPrimary],
    close,
    haptics,
    onAction,
  });
  completion.current = {
    left: left[leftPrimary],
    right: right[rightPrimary],
    close,
    haptics,
    onAction,
  };
  const completeSwipe = useCallback((side: 'left' | 'right') => {
    const current = completion.current;
    const action = current[side];
    current.close();
    if (!action) return;
    current.haptics.tap();
    action.onPress?.();
    current.onAction?.(action.key);
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-SWIPE_ACTIVATE_OFFSET, SWIPE_ACTIVATE_OFFSET])
        .failOffsetY([-SWIPE_ACTIVATE_OFFSET, SWIPE_ACTIVATE_OFFSET])
        .onStart(() => {
          'worklet';
          if (bubbles && !committing.value) runOnJS(beginDrag)();
        })
        .onChange((event) => {
          'worklet';
          if (committing.value) return;
          const next = translateX.value + event.changeX;
          const maxLeft = canFullSwipe(rowWidth.value, leftWidth, leftPrimary >= 0)
            ? rowWidth.value
            : leftWidth;
          const maxRight = canFullSwipe(rowWidth.value, rightWidth, rightPrimary >= 0)
            ? rowWidth.value
            : rightWidth;
          translateX.value = Math.max(-maxRight, Math.min(maxLeft, next));
        })
        .onEnd((_event, success) => {
          'worklet';
          if (!success || committing.value) return;
          const travelled = Math.abs(translateX.value);
          if (travelled < SWIPE_TAP_SLOP) {
            translateX.value = 0;
            runOnJS(settle)(null);
            return;
          }
          const opening = translateX.value > 0 ? 'left' : 'right';
          const full = opening === 'left' ? leftWidth : rightWidth;
          const primary = opening === 'left' ? leftPrimary : rightPrimary;
          if (
            canFullSwipe(rowWidth.value, full, primary >= 0) &&
            travelled >= fullSwipeThreshold(rowWidth.value, full)
          ) {
            committing.value = true;
            const target = opening === 'left' ? rowWidth.value : -rowWidth.value;
            if (reducedMotion) {
              translateX.value = target;
              runOnJS(completeSwipe)(opening);
            } else {
              translateX.value = withTiming(target, { duration: 220 }, (finished) => {
                if (finished) runOnJS(completeSwipe)(opening);
              });
            }
            return;
          }
          const commit = travelled >= full * SWIPE_COMMIT_FRACTION && full > 0;
          const target = commit ? (opening === 'left' ? leftWidth : -rightWidth) : 0;
          translateX.value = reducedMotion
            ? target
            : bubbles
              ? withSpring(target, BUBBLE_SPRING)
              : withTiming(target, { duration: SWIPE_SNAP_DURATION });
          runOnJS(settleSwipe)(commit ? opening : null);
        })
        .onFinalize((_event, success) => {
          'worklet';
          if (bubbles && !committing.value) runOnJS(setDragging)(false);
          if (success || committing.value) return;
          translateX.value = reducedMotion ? 0 : withTiming(0, { duration: SWIPE_SNAP_DURATION });
          runOnJS(settle)(null);
        }),
    [
      beginDrag,
      bubbles,
      committing,
      completeSwipe,
      leftPrimary,
      leftWidth,
      reducedMotion,
      rightPrimary,
      rightWidth,
      rowWidth,
      settle,
      settleSwipe,
      translateX,
    ],
  );

  const scrollContext = useMemo(
    () => ({ pan, register: registerScroller, ScrollGate: SwipeScrollGate }),
    [pan, registerScroller],
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
      {list.map((action, index) => {
        const tone = swipeActionPaint(action, tones);
        const Icon = action.icon;
        if (bubbles)
          return (
            <SwipeRowBubble
              key={action.key}
              action={action}
              side={side}
              index={index}
              count={list.length}
              primary={side === 'left' ? leftPrimary : rightPrimary}
              actionWidth={actionWidth}
              translateX={translateX}
              rowWidth={rowWidth}
              background={tone.background}
              foreground={tone.foreground}
              open={open === side}
              onPress={() => {
                action.onPress?.();
                onAction?.(action.key);
                close();
              }}
              testID={testID ? `${testID}-action-${action.key}` : undefined}
            />
          );
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
            <Text variant="caption-2-medium" numberOfLines={1} style={{ color: tone.foreground }}>
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
      ref={host}
      {...(bubbles ? webDataSet({ bloomSwipeActive: String(dragging || open !== null) }) : {})}
      onLayout={
        bubbles
          ? (event) => {
              rowWidth.value = event.nativeEvent.layout.width;
            }
          : undefined
      }
      style={[
        {
          position: 'relative',
          ...(height === undefined ? null : { height }),
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
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
      {/* A horizontal descendant needs an unrestricted ancestor path. The
          sheet keeps pan-y on non-scrolling branches, preserving row swipes. */}
      <GestureDetector gesture={pan} touchAction={horizontalScrollers > 0 ? 'auto' : 'pan-y'}>
        <Animated.View
          {...webDataSet({ bloomSwipeContent: '' })}
          style={[
            { backgroundColor: rowFill, borderRadius: bubbles ? radius : 0 },
            height === undefined ? null : { height },
            rowStyle,
          ]}
        >
          <SwipeRowScrollContext.Provider value={scrollContext}>
            {children}
          </SwipeRowScrollContext.Provider>
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

/** A horizontal scroller inside the row: its native gesture blocks the row's pan. */
function SwipeScrollGate({ children }: { children: ReactNode }) {
  const owner = useContext(SwipeRowScrollContext);
  const pan = owner?.pan;
  const gesture = useMemo(
    () =>
      pan
        ? // Let the ScrollView intercept actual travel before claiming the stream.
          // Activating on DOWN cancels its child Pressables on Android, so taps
          // on attachments never reach their actions. The row still waits for
          // this gesture, and cannot interrupt it once scrolling starts.
          Gesture.Native().blocksExternalGesture(pan).disallowInterruption(true)
        : null,
    [pan],
  );
  if (!gesture) return <>{children}</>;
  return (
    <GestureDetector gesture={gesture} touchAction="auto">
      {children}
    </GestureDetector>
  );
}
