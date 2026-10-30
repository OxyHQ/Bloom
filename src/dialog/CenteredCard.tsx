import type React from 'react';
import {
  type ComponentRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  type AnimatedStyle,
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeShell } from '../bottom-sheet/BottomSheet';
import { SheetKeyboardProvider } from '../bottom-sheet/context';
import type { BottomSheetRef } from '../bottom-sheet/types';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { ScreenScope } from '../layout';
import { ScrollArea } from '../layout/ScrollArea';
import { MOTION_RECIPES } from '../motion/recipes';
import type { SurfaceTransition } from '../motion/types';
import { useSurfaceTransition } from '../motion/use-surface-transition';
import { Backdrop } from '../overlay';
import type { BackdropAppearance } from '../overlay/types';
import { surfaceStyle } from '../shapes/surface-style';
import { pointerEventsStyles } from '../styles/pointer-events';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { useTheme } from '../theme/use-theme';
import {
  CENTER_FADE_OUT_DURATION,
  DEFAULT_CENTER_MAX_WIDTH,
  DEFAULT_MAX_HEIGHT_RATIO,
} from './placement';

/** The web card's zoom-in: `scale(0.95) → 1` over 300ms on this curve. */
export const CENTERED_CARD_ENTER_DURATION = 300;
export const CENTERED_CARD_ENTER_EASING = [0.16, 1, 0.3, 1] as const;
/** The web backdrop's fade-in, shorter than the card's so the dim lands first. */
export const CENTERED_CARD_BACKDROP_FADE_IN = 150;
/** The scale the card enters from and leaves to. */
export const CENTERED_CARD_HIDDEN_SCALE = 0.95;
/** Horizontal room the web keeps between the card and the window's edges. */
export const CENTERED_CARD_GUTTER = 20;

const ENTER_EASING = Easing.bezier(...CENTERED_CARD_ENTER_EASING);

export interface CenteredCardProps {
  material?: 'surface' | 'flat';
  backdrop?: BackdropAppearance;
  transition?: SurfaceTransition;
  /** The card's tint; the theme's page colour by default. */
  backgroundFill?: string;
  /** Seeds the first visibility; `present()` / `dismiss()` drive it after. */
  open?: boolean;
  /** Fires once the card has finished leaving, whoever closed it. */
  onDismiss?: () => void;
  /** Asked before a USER dismissal (backdrop, Escape, Back); `false` keeps it open. */
  onDismissAttempt?: () => boolean;
  maxWidth?: number;
  /** The card's height cap as a fraction of the window's height. */
  maxHeightRatio?: number;
  /** `false` hands scrolling to content with its own bounded scroller. */
  scrollable?: boolean;
  /** Written with the card's scroll offset (a Dialog nav header's collapse). */
  scrollY?: SharedValue<number>;
  /** Drawn over the scrolling body, clipped to the card (a sticky nav header). */
  headerOverlay?: React.ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  accessibilityLabel?: string;
  testID?: string;
  children: React.ReactNode;
}

/**
 * The centred modal card: the desktop presentation of a native modal surface,
 * the counterpart of the web `Dialog`'s centred card with its numbers — the
 * width cap, the height cap as a share of the window, the 20px gutter, the
 * hairline border, `shadow-m`, the zoom-in and the backdrop that fades in
 * first.
 *
 * It presents in the same RN `<Modal>` as `BottomSheet` (`NativeShell`): its
 * own native window, where Escape on macOS and Back on Android send
 * `onRequestClose`. Its imperative handle is `BottomSheet`'s, so an owner swaps
 * one for the other by the window it is in (`useDesktopPresentationSession`).
 */
export const CenteredCard = forwardRef(
  (props: CenteredCardProps, ref: React.ForwardedRef<BottomSheetRef>) => {
    const {
      material: surfaceMaterial = 'surface',
      backdrop,
      transition,
      backgroundFill,
      open,
      onDismiss,
      onDismissAttempt,
      maxWidth = DEFAULT_CENTER_MAX_WIDTH,
      maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
      scrollable = true,
      scrollY,
      headerOverlay,
      onLayout,
      style,
      accessibilityLabel,
      testID,
      children,
    } = props;

    const motion = useSurfaceTransition(transition);
    const theme = useTheme();
    const insets = useCssSafeAreaInsets(useSafeAreaInsets());
    const { height: windowHeight } = useWindowDimensions();
    const [visible, setVisible] = useState(() => open ?? false);
    const [rendered, setRendered] = useState(() => open ?? false);
    const presence = useSharedValue(0);
    const backdropProgress = useSharedValue(0);
    const keyboardHeight = useSharedValue(0);
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const generationRef = useRef(0);
    const closedRef = useRef(false);
    const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    const finishClose = useCallback((generation: number) => {
      if (generation !== generationRef.current || closedRef.current) return;
      closedRef.current = true;
      if (fallbackRef.current) {
        clearTimeout(fallbackRef.current);
        fallbackRef.current = null;
      }
      setRendered(false);
      onDismissRef.current?.();
    }, []);

    useEffect(() => {
      if (visible) {
        if (fallbackRef.current) {
          clearTimeout(fallbackRef.current);
          fallbackRef.current = null;
        }
        closedRef.current = false;
        generationRef.current += 1;
        const enter = motion.reducedMotion ? 0 : (motion.duration ?? CENTERED_CARD_ENTER_DURATION);
        presence.value = withTiming(1, {
          ...MOTION_RECIPES.present,
          duration: enter,
          easing: transition ? motion.easing : ENTER_EASING,
        });
        backdropProgress.value = withTiming(1, {
          ...MOTION_RECIPES.present,
          duration: motion.reducedMotion ? 0 : (motion.duration ?? CENTERED_CARD_BACKDROP_FADE_IN),
          easing: transition ? motion.easing : Easing.out(Easing.ease),
        });
        return;
      }
      if (!rendered) return;
      const generation = generationRef.current;
      const exit = motion.reducedMotion ? 0 : (motion.duration ?? CENTER_FADE_OUT_DURATION);
      const timing = {
        ...MOTION_RECIPES.dismiss,
        duration: exit,
        easing: transition ? motion.easing : Easing.in(Easing.ease),
      };
      backdropProgress.value = withTiming(0, timing);
      presence.value = withTiming(0, timing, (finished) => {
        if (finished) runOnJS(finishClose)(generation);
      });
      fallbackRef.current = setTimeout(() => finishClose(generation), exit + 50);
    }, [
      visible,
      rendered,
      presence,
      backdropProgress,
      finishClose,
      motion.duration,
      motion.easing,
      motion.reducedMotion,
      !!transition,
    ]);

    const closingRef = useRef(false);
    closingRef.current = rendered && !visible;

    useEffect(
      () => () => {
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
        if (closingRef.current && !closedRef.current) {
          closedRef.current = true;
          onDismissRef.current?.();
        }
      },
      [],
    );

    const present = useCallback(() => {
      setRendered(true);
      setVisible(true);
    }, []);
    const dismiss = useCallback(() => {
      setVisible(false);
    }, []);
    const scrollTo = useCallback((y: number, animated = true) => {
      scrollRef.current?.scrollTo({ y, animated });
    }, []);

    useImperativeHandle(
      ref,
      () => ({ present, dismiss, close: dismiss, expand: present, collapse: dismiss, scrollTo }),
      [present, dismiss, scrollTo],
    );

    const requestDismiss = useCallback(() => {
      if (onDismissAttempt && !onDismissAttempt()) return;
      dismiss();
    }, [onDismissAttempt, dismiss]);

    const onScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (scrollY) scrollY.value = event.nativeEvent.contentOffset.y;
      },
      [scrollY],
    );

    const cardMotion = useAnimatedStyle(
      () => ({
        opacity: presence.value,
        transform: [
          { scale: CENTERED_CARD_HIDDEN_SCALE + (1 - CENTERED_CARD_HIDDEN_SCALE) * presence.value },
        ],
      }),
      [presence],
    );
    const keyboardRoom = useAnimatedStyle(
      () => ({ paddingBottom: Math.max(insets.bottom, keyboardHeight.value) }),
      [keyboardHeight, insets.bottom],
    );

    const flatStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>);
    const material = resolveSurfaceMaterial({
      fill: String(backgroundFill ?? flatStyle?.backgroundColor ?? theme.colors.background),
      parentFill: theme.colors.background,
      level: 0,
      paint: surfaceMaterial !== 'flat',
    });
    const { paintFill, publishedFill: surfaceFill } = material;
    const radius = flatStyle?.borderRadius ?? SURFACE_SHAPES.dialog.radius;

    if (!rendered) return null;

    const body = (
      <SheetKeyboardProvider value={keyboardHeight}>
        <ScreenScope>{children}</ScreenScope>
      </SheetKeyboardProvider>
    );

    return (
      <NativeShell
        visible={rendered}
        onRequestClose={requestDismiss}
        keyboardHeight={keyboardHeight}
      >
        <View style={StyleSheet.absoluteFill}>
          <Backdrop
            {...backdrop}
            onPress={requestDismiss}
            progress={backdropProgress}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.frame,
              pointerEventsStyles['box-none'],
              {
                paddingTop: insets.top,
                paddingLeft: CENTERED_CARD_GUTTER + insets.left,
                paddingRight: CENTERED_CARD_GUTTER + insets.right,
              },
              keyboardRoom,
            ]}
          >
            <Animated.View
              accessibilityViewIsModal
              accessibilityLabel={accessibilityLabel}
              onAccessibilityEscape={requestDismiss}
              testID={testID}
              onLayout={onLayout}
              style={[
                styles.card,
                surfaceStyle(SURFACE_SHAPES.dialog),
                surfaceFillVars(surfaceFill),
                {
                  maxWidth,
                  maxHeight: Math.round(windowHeight * maxHeightRatio),
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
                cardMotion,
                style,
                { backgroundColor: surfaceMaterial === 'flat' ? paintFill : 'transparent' },
              ]}
            >
              {surfaceMaterial === 'flat' ? null : (
                <SurfacePaint
                  floating
                  fill={paintFill}
                  shape={{ curve: SURFACE_SHAPES.dialog.curve }}
                  radius={radius}
                />
              )}
              <View style={[styles.clip, { borderRadius: radius }]}>
                <SurfaceLevelProvider level={material.level} fill={surfaceFill}>
                  {scrollable ? (
                    <ScrollArea
                      ref={scrollRef}
                      style={styles.scroller}
                      keyboardShouldPersistTaps="handled"
                      onScroll={onScroll}
                      scrollEventThrottle={16}
                    >
                      {body}
                    </ScrollArea>
                  ) : (
                    <View style={styles.bounded}>{body}</View>
                  )}
                  {headerOverlay}
                </SurfaceLevelProvider>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </NativeShell>
    );
  },
);

CenteredCard.displayName = 'CenteredCard';

const styles = StyleSheet.create({
  frame: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    ...bloomShadowStyle('m'),
  },
  clip: {
    flexShrink: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  scroller: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bounded: {
    flex: 1,
    flexBasis: 'auto',
    minHeight: 0,
  },
});
