import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { BackHandler, Platform, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useModalOverlayActive } from '../overlay/use-modal-overlay-active';
import { useThemePaint } from '../theme/use-theme-paint';
import { useMessages } from '../locale/messages';
import { ScreenScope } from '../layout/screen-scope';
import { useClaimBottomEdge } from '../layout/bottom-edge';
import { ScrollOffsetProvider } from '../layout/scroll-offset';
import { EDGE_GAP, windowEdgeGap } from '../layout/edge';
import { StyledPressable } from '../styles/styled-primitives';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTouchInput } from '../styles/pointer';
import type { WebCssStyle } from '../styles/web-view-style';
import { pointerEventsStyle } from '../styles/pointer-events';
import { sheetPanIntent, resolveSheetDetents } from '../bottom-sheet/drag-geometry';
import type { SurfaceProps } from '../surface/types';
import type { ScrollAreaProps } from '../layout/types';
import { useCanvasRegion, useCanvasStore } from './context';
import { CANVAS_MESSAGES } from './messages';
import type { CanvasPanelProps, CanvasPanelSnap } from './types';
const SNAPS: readonly CanvasPanelSnap[] = ['peek', 'half', 'full'];
const HANDLE_CSS = interactiveWebCss({
  selector: '[data-bloom-canvas-handle]',
  varPrefix: 'bloom-canvas-handle',
  reset: 'none',
  transition: 'none',
  outlineOffset: -3,
});
const SPRING = { damping: 34, stiffness: 320, mass: 0.9, overshootClamping: true };

export function createCanvasPanel(
  Surface: ComponentType<SurfaceProps>,
  ScrollArea: ComponentType<ScrollAreaProps>,
) {
  return function CanvasPanel({
    children,
    header,
    snap,
    onSnapChange,
    side,
    halfRatio = 0.45,
    topClearance = 0,
    scrollable = true,
    active = true,
    visible = true,
    animatedHeight,
    animatedProgress,
    accessibilityLabel,
    testID,
  }: CanvasPanelProps) {
    const region = useCanvasRegion(),
      store = useCanvasStore();
    const id = useId(),
      rtl = useIsRtl();
    const enabled = active && visible && region.active;
    const lateral = side !== undefined && region.viewport.width >= side.from;
    const dragEnabled = enabled && !lateral;
    const right = (side?.edge === 'end') !== rtl;
    const safe = region.safeArea;
    const colors = useThemePaint();
    const touchInput = useTouchInput();
    const handleHeight =
      Platform.OS === 'android' ? 48 : Platform.OS !== 'web' || touchInput ? 44 : 24;
    useInteractiveWebCss('bloom-canvas-handle', HANDLE_CSS);
    const { messages } = useMessages(CANVAS_MESSAGES);
    const reduced = usePrefersReducedMotion();
    const modalActive = useModalOverlayActive();
    const [headerHeight, setHeaderHeight] = useState(0);
    const [proposalRevision, setProposalRevision] = useState(0);
    const visibleBottom = region.viewport.y + region.viewport.height;
    const top = Math.min(
      visibleBottom,
      Math.max(region.viewport.y, region.occupied.top, safe.top) +
        EDGE_GAP +
        (lateral ? 0 : Math.max(0, topClearance)),
    );
    const bottom = region.bounds.height - visibleBottom;
    const bottomGap = lateral
      ? Math.min(windowEdgeGap(safe.bottom), Math.max(0, visibleBottom - top))
      : 0;
    const sideGap = windowEdgeGap(right ? safe.right : safe.left);
    const geometry = useMemo(
      () =>
        resolveSheetDetents(
          Math.max(0, region.viewport.y + region.viewport.height - top),
          handleHeight + headerHeight + safe.bottom,
          region.viewport.height * halfRatio,
        ),
      [
        region.viewport.y,
        region.viewport.height,
        top,
        handleHeight,
        headerHeight,
        safe.bottom,
        halfRatio,
      ],
    );
    const translate = useSharedValue(geometry.offsets[snap]);
    const start = useSharedValue(0),
      touchY = useSharedValue(0),
      scrollY = useSharedValue(0);
    const settled = useRef(snap),
      previousOffsets = useRef(geometry.offsets);
    const offsets = geometry.offsets,
      maxOffset = geometry.maxOffset,
      full = geometry.full;
    const commit = useCallback(
      (next: CanvasPanelSnap) => {
        settled.current = next;
        setProposalRevision((revision) => revision + 1);
        onSnapChange(next);
      },
      [onSnapChange],
    );
    const moveTo = useCallback(
      (next: CanvasPanelSnap) => {
        translate.value = reduced
          ? withTiming(offsets[next], { duration: 0 })
          : withSpring(offsets[next], SPRING);
        commit(next);
      },
      [translate, offsets, reduced, commit],
    );
    useEffect(() => {
      const changed = previousOffsets.current !== offsets;
      previousOffsets.current = offsets;
      if (settled.current === snap) {
        if (changed) translate.value = offsets[snap];
        return;
      }
      settled.current = snap;
      translate.value = reduced
        ? withTiming(offsets[snap], { duration: 0 })
        : withSpring(offsets[snap], SPRING);
    }, [snap, offsets, translate, reduced, proposalRevision]);
    useAnimatedReaction(
      () => translate.value,
      (value) => {
        if (animatedHeight) animatedHeight.value = dragEnabled ? Math.max(0, full - value) : 0;
        if (animatedProgress)
          animatedProgress.value =
            dragEnabled && maxOffset > 0 ? clamp(1 - value / maxOffset, 0, 1) : 0;
      },
      [dragEnabled, full, maxOffset, animatedHeight, animatedProgress],
    );
    useEffect(
      () => () => {
        if (animatedHeight) animatedHeight.value = 0;
        if (animatedProgress) animatedProgress.value = 0;
      },
      [animatedHeight, animatedProgress],
    );
    useClaimBottomEdge(enabled && !lateral ? bottom + geometry[snap] : 0);
    const sideFootprint =
      (right
        ? region.bounds.width - region.viewport.x - region.viewport.width
        : region.viewport.x) +
      sideGap +
      Math.min(side?.width ?? 0, Math.max(0, region.viewport.width - 2 * sideGap));
    useEffect(() => {
      const edge = right ? store.right : store.left;
      if (enabled && lateral) edge.claim(id, sideFootprint);
      else edge.release(id);
      return () => edge.release(id);
    }, [enabled, lateral, right, store, id, sideFootprint]);
    useEffect(() => {
      if (!dragEnabled || snap === 'peek' || modalActive) return;
      const close = () => {
        moveTo('peek');
        return true;
      };
      if (Platform.OS === 'web') {
        const key = (event: KeyboardEvent) => {
          if (event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault();
            close();
          }
        };
        // Bubble phase leaves nested overlays the first opportunity to handle Escape.
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', close);
      return () => subscription.remove();
    }, [dragEnabled, snap, moveTo, modalActive]);
    const nativeScroll = useMemo(() => Gesture.Native(), []);
    const makePan = useCallback(
      () =>
        Gesture.Pan()
          .enabled(dragEnabled)
          .onStart(() => {
            start.value = translate.value;
          })
          .onUpdate((event) => {
            translate.value = clamp(start.value + event.translationY, 0, maxOffset);
          })
          .onEnd((event) => {
            const projected = clamp(translate.value + event.velocityY * 0.15, 0, maxOffset);
            let next: CanvasPanelSnap = 'peek',
              distance = Number.POSITIVE_INFINITY;
            for (const name of SNAPS) {
              const d = Math.abs(offsets[name] - projected);
              if (d < distance) {
                distance = d;
                next = name;
              }
            }
            translate.value = reduced
              ? withTiming(offsets[next], { duration: 0 })
              : withSpring(offsets[next], SPRING);
            runOnJS(commit)(next);
          }),
      [dragEnabled, start, translate, maxOffset, offsets, reduced, commit],
    );
    const handlePan = useMemo(() => makePan(), [makePan]);
    const headerPan = useMemo(() => makePan(), [makePan]);
    const bodyPan = useMemo(() => {
      const pan = makePan().manualActivation(true);
      if (scrollable) pan.blocksExternalGesture(nativeScroll);
      return pan
        .onTouchesDown((event) => {
          'worklet';
          touchY.value = event.allTouches[0]?.absoluteY ?? 0;
        })
        .onTouchesMove((event, state) => {
          'worklet';
          const touch = event.changedTouches[0] ?? event.allTouches[0];
          if (!touch) return;
          const intent = sheetPanIntent(
            touch.absoluteY - touchY.value,
            scrollY.value,
            translate.value,
            'detents',
          );
          if (intent === 'activate') state.activate();
          else if (intent === 'fail') state.fail();
        });
    }, [makePan, scrollable, nativeScroll, touchY, scrollY, translate]);
    const onScroll = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
      },
    });
    const motion = useAnimatedStyle(
      () => ({ transform: [{ translateY: lateral ? 0 : translate.value }] }),
      [lateral, translate],
    );
    const step = useCallback(
      (delta: number) => {
        const next = SNAPS[Math.max(0, Math.min(2, SNAPS.indexOf(snap) + delta))];
        if (next && next !== snap) moveTo(next);
      },
      [snap, moveTo],
    );
    const onAccessibilityAction = (event: AccessibilityActionEvent) =>
      step(event.nativeEvent.actionName === 'increment' ? 1 : -1);
    const keyProps: Record<string, unknown> =
      Platform.OS === 'web'
        ? {
            dataSet: { bloomCanvasHandle: '' },
            onKeyDown: (event: { key: string; preventDefault: () => void }) => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                step(event.key === 'ArrowUp' ? 1 : -1);
              }
            },
          }
        : {};
    return (
      <Animated.View
        testID={testID}
        accessibilityElementsHidden={!enabled}
        aria-hidden={!enabled}
        importantForAccessibility={enabled ? 'auto' : 'no-hide-descendants'}
        style={[
          {
            position: 'absolute',
            bottom: bottom + bottomGap,
            top: lateral ? top : undefined,
            height: lateral ? undefined : full,
            left: lateral ? (right ? undefined : region.viewport.x + sideGap) : region.viewport.x,
            right: lateral
              ? right
                ? region.bounds.width - region.viewport.x - region.viewport.width + sideGap
                : undefined
              : region.bounds.width - region.viewport.x - region.viewport.width,
            width: lateral
              ? Math.min(side!.width, Math.max(0, region.viewport.width - 2 * sideGap))
              : undefined,
            display: enabled ? 'flex' : 'none',
          },
          pointerEventsStyle(enabled ? 'auto' : 'none'),
          motion,
        ]}
      >
        <Surface
          fill={colors.card}
          radius={24}
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
          accessibilityLabel={accessibilityLabel}
        >
          <ScreenScope sizing="fill">
            <ScrollOffsetProvider value={scrollY}>
              <GestureDetector gesture={handlePan}>
                <View style={{ display: lateral ? 'none' : 'flex' }}>
                  <StyledPressable
                    {...keyProps}
                    onPress={() => moveTo(SNAPS[(SNAPS.indexOf(snap) + 1) % 3]!)}
                    accessibilityRole="adjustable"
                    accessibilityLabel={accessibilityLabel}
                    accessibilityHint={messages.hint}
                    accessibilityValue={{
                      min: 0,
                      max: 2,
                      now: SNAPS.indexOf(snap),
                      text: messages[snap],
                    }}
                    aria-orientation="vertical"
                    aria-valuemin={0}
                    aria-valuemax={2}
                    aria-valuenow={SNAPS.indexOf(snap)}
                    aria-valuetext={messages[snap]}
                    accessibilityActions={[
                      { name: 'increment', label: messages.expand },
                      { name: 'decrement', label: messages.collapse },
                    ]}
                    onAccessibilityAction={onAccessibilityAction}
                    style={
                      {
                        '--bloom-canvas-handle-ring': colors.primary,
                        height: handleHeight,
                        alignItems: 'center',
                        justifyContent: 'center',
                      } as WebCssStyle
                    }
                    testID={testID ? `${testID}-handle` : undefined}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 5,
                        borderRadius: 5,
                        backgroundColor: colors.textTertiary,
                      }}
                    />
                  </StyledPressable>
                </View>
              </GestureDetector>
              <GestureDetector gesture={headerPan}>
                <View
                  onLayout={(event) => {
                    if (enabled) setHeaderHeight(event.nativeEvent.layout.height);
                  }}
                >
                  {header}
                </View>
              </GestureDetector>
              <GestureDetector gesture={bodyPan}>
                <View style={{ flex: 1, minHeight: 0 }}>
                  {scrollable ? (
                    <GestureDetector gesture={nativeScroll}>
                      <ScrollArea
                        animatedHandler={onScroll}
                        scrollEventThrottle={16}
                        keyboardShouldPersistTaps="handled"
                        style={{ flex: 1, minHeight: 0 }}
                        contentContainerStyle={{ paddingBottom: safe.bottom + EDGE_GAP }}
                        testID={testID ? `${testID}-scroll` : undefined}
                      >
                        {children}
                      </ScrollArea>
                    </GestureDetector>
                  ) : (
                    children
                  )}
                </View>
              </GestureDetector>
            </ScrollOffsetProvider>
          </ScreenScope>
        </Surface>
      </Animated.View>
    );
  };
}
