/**
 * `LevelPicker` — NATIVE. A stepped level slider over a disclosure that reveals
 * a region of detail rows, laid out for the surface a native menu IS: a sheet.
 *
 * The web fork (`LevelPicker.web.tsx`) is the second half, and the split is not
 * cosmetic. Three things differ, and each of them is the platform:
 *
 *  1. **The details region holds sub-menus, and a native sub-menu is an INLINE
 *     disclosure** (`floating/menu-sub-inline.tsx`) that grows the region when
 *     it opens. The web fork can therefore lay its regions out against a height
 *     it computes; this one cannot, so the picker is a plain column and every
 *     reveal is measured (`onLayout`) rather than assumed.
 *  2. **There is no hover.** The end captions swap in while the rail is being
 *     DRAGGED here, which is the only "the user is working the slider" signal a
 *     touch screen has; the web fork adds pointer-over and keyboard focus.
 *  3. **The gesture is a `PanResponder`**, not pointer capture, and the keyboard
 *     is an accessibility ACTION (`increment`/`decrement`) rather than arrow
 *     keys, because that is what an `adjustable` role exposes to VoiceOver and
 *     TalkBack.
 *
 * Everything both forks agree about — the stops, the inset, the hit mapping,
 * the colour roles — is in `constants.ts` and is read from there by both, so
 * the two cannot drift into disagreeing about the same control.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';

import { ROW_ICON_SIZE } from '../floating/constants';
import { cx, MenuRowChevron, MenuRowShell, SUB_TRIGGER_CLASS } from '../floating/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '../icons/Chevron';
import { StyledText, StyledView } from '../styles/styled-primitives';
import { animation } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import {
  LEVEL_CAPTION_CLASS,
  LEVEL_FILL_CLASS,
  LEVEL_ROW_INSET,
  LEVEL_SEPARATOR_CLASS,
  LEVEL_SLIDER_ROW_HEIGHT,
  LEVEL_STOP_CLASS,
  LEVEL_STOP_REACHED_CLASS,
  LEVEL_STOP_SIZE,
  LEVEL_THUMB_CLASS,
  LEVEL_THUMB_SIZE,
  LEVEL_TRACK_CLASS,
  LEVEL_TRACK_HEIGHT,
  levelFromOffset,
  levelStopPosition,
} from './constants';
import type { LevelPickerProps } from './types';

/**
 * Built at MODULE scope, from `StyledView`, so one node carries the transform,
 * the class and the style — `button/Button.tsx`'s rule, for its reasons: an
 * element type constructed during render remounts its subtree every frame, and
 * a second layout node would make LAYOUT classes inert on native.
 */
const AnimatedStyledView = Animated.createAnimatedComponent(StyledView);

/**
 * Drive a 0→1 `Animated.Value` from a boolean.
 *
 * `useNativeDriver` is off because one of the two callers animates `maxHeight`,
 * which the native driver cannot own; the other animates opacity and could,
 * but a single shape for both is worth more than the frame it costs on a
 * cross-fade. The spring is Bloom's `gentle`, the same one `Accordion`'s reveal
 * takes — the web fork's `cubic-bezier` is a CSS spelling with no RN equivalent,
 * so the two curves are deliberately each their platform's own.
 */
function useRevealProgress(on: boolean): Animated.Value {
  const progress = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: on ? 1 : 0,
      useNativeDriver: false,
      ...animation.spring.gentle,
    }).start();
  }, [on, progress]);
  return progress;
}

/**
 * What an `adjustable` exposes to VoiceOver and TalkBack. Declared once at
 * module scope: a fresh array each render is a new prop value every time.
 */
const ADJUST_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

export function LevelPicker({
  levels,
  value,
  onValueChange,
  accessibilityLabel,
  minLabel,
  maxLabel,
  detailsLabel = 'Details',
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  className,
  style,
  testID,
}: LevelPickerProps) {
  const theme = useTheme();
  const [isExpanded, setExpanded] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const [trackWidth, setTrackWidth] = useState(0);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const [dragging, setDragging] = useState(false);

  const reveal = useRevealProgress(isExpanded);
  const active = useRevealProgress(dragging);

  // The latest props, read by a `PanResponder` that is created once. Read
  // inside its CALLBACKS and never during render, so no memoized position ever
  // holds a stale copy.
  const stateRef = useRef({ value, trackWidth, count: levels.length });
  stateRef.current = { value, trackWidth, count: levels.length };
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  // Where the gesture started, so a MOVE can be resolved as that point plus the
  // gesture's own `dx`. `locationX` is only trustworthy on the grant.
  const grantOffsetRef = useRef(0);

  const commitOffset = useCallback((offsetX: number) => {
    const { value: current, trackWidth: width, count } = stateRef.current;
    const next = levelFromOffset(offsetX, width, count);
    if (next !== current) onValueChangeRef.current(next);
  }, []);

  const step = useCallback((delta: number) => {
    const { value: current, count } = stateRef.current;
    const next = Math.max(0, Math.min(count - 1, current + delta));
    if (next !== current) onValueChangeRef.current(next);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event: GestureResponderEvent) => {
          setDragging(true);
          grantOffsetRef.current = event.nativeEvent.locationX;
          commitOffset(grantOffsetRef.current);
        },
        onPanResponderMove: (
          _event: GestureResponderEvent,
          gesture: PanResponderGestureState,
        ) => {
          commitOffset(grantOffsetRef.current + gesture.dx);
        },
        onPanResponderRelease: () => setDragging(false),
        onPanResponderTerminate: () => setDragging(false),
      }),
    [commitOffset],
  );

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setTrackWidth((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  }, []);

  const onDetailsLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    // Sub-pixel churn would re-render on every frame of the spring.
    setDetailsHeight((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
  }, []);

  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'increment') step(1);
      if (event.nativeEvent.actionName === 'decrement') step(-1);
    },
    [step],
  );

  /** A stop's centre, in pixels from the rail's left edge. */
  const offsetOf = (index: number): number => {
    const { percent, offset } = levelStopPosition(index, levels.length);
    return (percent / 100) * trackWidth + offset;
  };

  const hasCaptions = minLabel !== undefined || maxLabel !== undefined;
  const childTestId = (part: string): string | undefined =>
    testID === undefined ? undefined : `${testID}-${part}`;

  return (
    <StyledView className={cx('w-full', className)} style={style} testID={testID}>
      {/* The rail, and the row it sits in, collapsing to nothing when the
          details take its place. */}
      <AnimatedStyledView
        aria-hidden={isExpanded}
        pointerEvents={isExpanded ? 'none' : 'auto'}
        style={{
          overflow: 'hidden',
          opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          maxHeight: reveal.interpolate({
            inputRange: [0, 1],
            outputRange: [LEVEL_SLIDER_ROW_HEIGHT, 0],
          }),
        }}
        testID={childTestId('slider')}>
        <StyledView
          style={{
            height: LEVEL_SLIDER_ROW_HEIGHT,
            justifyContent: 'center',
            paddingHorizontal: LEVEL_ROW_INSET,
          }}>
          <StyledView
            accessibilityRole="adjustable"
            accessibilityLabel={accessibilityLabel}
            accessibilityActions={ADJUST_ACTIONS}
            onAccessibilityAction={onAccessibilityAction}
            // The FLAT `aria-value*` props: React Native folds them back into
            // `accessibilityValue`, and they are the only spelling
            // react-native-web reads. `slider/Slider.tsx` carries the same note.
            aria-valuemin={0}
            aria-valuemax={levels.length - 1}
            aria-valuenow={value}
            aria-valuetext={levels[value]}
            onLayout={onTrackLayout}
            className={LEVEL_TRACK_CLASS}
            style={{ height: LEVEL_TRACK_HEIGHT }}
            testID={childTestId('track')}
            {...panResponder.panHandlers}>
            {trackWidth > 0 ? (
              <>
                <StyledView
                  className={LEVEL_FILL_CLASS}
                  style={{ top: 0, bottom: 0, width: offsetOf(value) }}
                />
                {levels.map((label, index) => (
                  <StyledView
                    key={label}
                    className={index <= value ? LEVEL_STOP_REACHED_CLASS : LEVEL_STOP_CLASS}
                    style={{
                      width: LEVEL_STOP_SIZE,
                      height: LEVEL_STOP_SIZE,
                      top: (LEVEL_TRACK_HEIGHT - LEVEL_STOP_SIZE) / 2,
                      left: offsetOf(index) - LEVEL_STOP_SIZE / 2,
                    }}
                  />
                ))}
                <StyledView
                  className={LEVEL_THUMB_CLASS}
                  style={{
                    width: LEVEL_THUMB_SIZE,
                    height: LEVEL_THUMB_SIZE,
                    top: (LEVEL_TRACK_HEIGHT - LEVEL_THUMB_SIZE) / 2,
                    left: offsetOf(value) - LEVEL_THUMB_SIZE / 2,
                  }}
                  testID={childTestId('thumb')}
                />
              </>
            ) : null}
          </StyledView>
        </StyledView>
      </AnimatedStyledView>

      {/* The summary row, with the end captions riding over it: one is showing
          whenever the other is not. */}
      <StyledView>
        <AnimatedStyledView
          // Only a drag takes the row out of the way — there is no hover here,
          // and the row must stay pressable the moment the finger lifts.
          pointerEvents={dragging ? 'none' : 'auto'}
          style={{
            opacity: active.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}>
          <MenuRowShell
            role="menuitem"
            expanded={isExpanded}
            disabled={false}
            title={detailsLabel}
            trailing={
              <MenuRowChevron>
                <AnimatedStyledView
                  style={{
                    transform: [
                      {
                        rotate: reveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '90deg'],
                        }),
                      },
                    ],
                  }}>
                  <ChevronRightIcon
                    width={ROW_ICON_SIZE}
                    height={ROW_ICON_SIZE}
                    fill={theme.colors.textSecondary}
                  />
                </AnimatedStyledView>
              </MenuRowChevron>
            }
            onPress={() => setExpanded(!isExpanded)}
            className={SUB_TRIGGER_CLASS}
            testID={childTestId('summary')}
          />
        </AnimatedStyledView>
        {hasCaptions ? (
          <AnimatedStyledView
            aria-hidden
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: LEVEL_ROW_INSET,
              opacity: active,
            }}
            testID={childTestId('captions')}>
            <StyledText className={LEVEL_CAPTION_CLASS}>{minLabel}</StyledText>
            <StyledText className={LEVEL_CAPTION_CLASS}>{maxLabel}</StyledText>
          </AnimatedStyledView>
        ) : null}
      </StyledView>

      {/* The details. Measured rather than assumed: an inline sub-menu opening
          inside it changes its height, and only `onLayout` sees that. */}
      <AnimatedStyledView
        aria-hidden={!isExpanded}
        pointerEvents={isExpanded ? 'auto' : 'none'}
        style={{
          overflow: 'hidden',
          opacity: reveal,
          // Before the first measurement an OPEN region must not be clipped to
          // zero — `Accordion`'s rule, for its reason: the unmeasured frame
          // takes the answer its state already implies.
          maxHeight:
            detailsHeight === 0 && isExpanded
              ? undefined
              : reveal.interpolate({ inputRange: [0, 1], outputRange: [0, detailsHeight] }),
        }}
        testID={childTestId('details')}>
        <StyledView onLayout={onDetailsLayout}>
          <StyledView
            className={LEVEL_SEPARATOR_CLASS}
            style={{ marginHorizontal: LEVEL_ROW_INSET, marginBottom: 4 }}
          />
          {children}
        </StyledView>
      </AnimatedStyledView>
    </StyledView>
  );
}

LevelPicker.displayName = 'LevelPicker';
