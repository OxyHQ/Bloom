import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Z_INDEX } from '../styles/z-index';
import { useTheme } from '../theme/use-theme';
import {
  ANIMATION_DURATION,
  BACKDROP_OPACITY,
  DEFAULT_BREAKPOINT,
  DEFAULT_LABEL,
  DEFAULT_MAX_HEIGHT_RATIO,
  DEFAULT_SIDE,
  DEFAULT_WIDTH,
  HANDLE_HEIGHT,
  HANDLE_RADIUS,
  HANDLE_WIDTH,
  PANEL_RADIUS,
  SIDE_SHEET_MIN_GUTTER,
} from './const';
import type { ResponsiveSheetProps } from './types';

/** Stable testID for the dimmed backdrop dismiss button. */
export const RESPONSIVE_SHEET_BACKDROP_TESTID = 'bloom-responsive-sheet-backdrop';

/**
 * Native variant of `<ResponsiveSheet>` (selected only by Metro).
 *
 * Uses `react-native-reanimated` to drive the same motion as the web/CSS
 * default fork: a shared `progress` value times 0 -> 1 on open and 1 -> 0 on
 * close, mapped to the panel translate/opacity and the backdrop opacity.
 * Native exit animations are safe here — the web-only `removeChild` crash does
 * not apply — so we keep the node mounted through the close timing and unmount
 * from the animation completion callback.
 *
 * The panel itself is measured (not percentage-translated): we offset by the
 * panel's own width/height so the hidden state sits fully off its side, which
 * is the reanimated-friendly equivalent of the web `translate(±100%)`.
 */
export function ResponsiveSheet({
  open,
  onClose,
  side = DEFAULT_SIDE,
  breakpoint = DEFAULT_BREAKPOINT,
  width = DEFAULT_WIDTH,
  maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
  inset,
  showHandle = true,
  dismissOnBackdrop = true,
  panelStyle,
  panelClassName,
  containerStyle,
  containerClassName,
  label = DEFAULT_LABEL,
  children,
}: ResponsiveSheetProps) {
  const theme = useTheme();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

  // Keep the tree mounted through the exit timing; unmount once it settles.
  const [mounted, setMounted] = useState(open);
  // `progress`: 0 = fully hidden, 1 = fully shown. Drives both transform and
  // opacity so a single timing controls the whole transition.
  const progress = useSharedValue(open ? 1 : 0);

  const isBottom = viewportWidth < breakpoint;

  // Measured panel extent along the travel axis. Falls back to the geometry
  // target so the very first frame is already off-screen before layout lands.
  const insetTop = inset?.top ?? 0;
  const insetBottom = inset?.bottom ?? 0;
  const insetLeft = inset?.left ?? 0;
  const insetRight = inset?.right ?? 0;
  const anchorInset = side === 'left' ? insetLeft : insetRight;
  const oppositeInset = side === 'left' ? insetRight : insetLeft;

  const sideWidth = useMemo(() => {
    const available = viewportWidth - anchorInset - oppositeInset - SIDE_SHEET_MIN_GUTTER;
    return Math.max(0, Math.min(width, available));
  }, [viewportWidth, anchorInset, oppositeInset, width]);

  const bottomMaxHeight = useMemo(
    () => Math.round(viewportHeight * maxHeightRatio),
    [viewportHeight, maxHeightRatio],
  );

  // Travel distance for the hidden state: the panel's measured extent (height
  // for the bottom-sheet, width for the side-sheet), with the geometry target
  // as the pre-measurement fallback.
  const travel = useSharedValue(isBottom ? bottomMaxHeight : sideWidth);
  useEffect(() => {
    travel.value = isBottom ? bottomMaxHeight : sideWidth;
  }, [isBottom, bottomMaxHeight, sideWidth, travel]);

  const finishClose = useCallback(() => {
    setMounted(false);
  }, []);

  useEffect(() => {
    cancelAnimation(progress);
    const timing = { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) };
    if (open) {
      setMounted(true);
      progress.value = withTiming(1, timing);
      return;
    }
    if (!mounted) return;
    progress.value = withTiming(0, timing, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [open, mounted, progress, finishClose]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onClose();
  }, [dismissOnBackdrop, onClose]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * BACKDROP_OPACITY,
  }));

  const hiddenSign = side === 'left' ? -1 : 1;
  const panelAnimatedStyle = useAnimatedStyle(() => {
    const hidden = 1 - progress.value;
    if (isBottom) {
      return {
        opacity: progress.value,
        transform: [{ translateY: hidden * travel.value }],
      };
    }
    return {
      opacity: progress.value,
      transform: [{ translateX: hidden * travel.value * hiddenSign }],
    };
  }, [isBottom, hiddenSign]);

  const measurePanel = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const measured = isBottom ? e.nativeEvent.layout.height : e.nativeEvent.layout.width;
      if (measured > 0) travel.value = measured;
    },
    [isBottom, travel],
  );

  const panelGeometry = useMemo<ViewStyle>(() => {
    if (isBottom) {
      return {
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: bottomMaxHeight,
        borderTopLeftRadius: PANEL_RADIUS,
        borderTopRightRadius: PANEL_RADIUS,
      };
    }
    return {
      top: insetTop,
      bottom: insetBottom,
      [side]: anchorInset,
      width: sideWidth,
      borderRadius: PANEL_RADIUS,
    } as ViewStyle;
  }, [isBottom, bottomMaxHeight, insetTop, insetBottom, side, anchorInset, sideWidth]);

  if (!mounted) return null;

  return (
    <View
      style={[styles.root, containerStyle]}
      {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} pointerEvents="auto">
        <Pressable
          testID={RESPONSIVE_SHEET_BACKDROP_TESTID}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${label}`}
          onPress={handleBackdropPress}
          disabled={!dismissOnBackdrop}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
        onLayout={measurePanel}
        style={[
          styles.panel,
          { backgroundColor: theme.colors.background, shadowColor: theme.colors.shadow },
          panelGeometry,
          panelAnimatedStyle,
          panelStyle,
        ]}
        pointerEvents="auto"
      >
        {isBottom && showHandle ? (
          <View style={styles.handleRow} pointerEvents="none">
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: Z_INDEX.fullscreen,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  handleRow: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: HANDLE_RADIUS,
    opacity: 0.5,
  },
});

export default ResponsiveSheet;
