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
  EASE_OUT,
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
 * Default / web variant of `<ResponsiveSheet>`.
 *
 * This file is BOTH the package's default entry (`react-native` export
 * condition resolves it for downstream `tsc`, and non-Metro web bundlers pick
 * it via the `browser` condition through `index.web`) AND the canonical web
 * implementation. It MUST NOT import `react-native-reanimated` — reanimated has
 * no web build and its worklets Babel plugin is native-only, so a static import
 * here would break every web bundler and downstream type-check. The native
 * fork (`ResponsiveSheet.native.tsx`, selected only by Metro) drives the same
 * motion with reanimated.
 *
 * Motion is pure CSS transitions: react-native-web emits `transition-*` style
 * props to the DOM, and the panel/backdrop toggle their transform/opacity by a
 * `shown` flag. Presence is handled with a `mounted` + `shown` pair so both the
 * open AND close directions animate while the node stays mounted through the
 * exit. We deliberately do NOT use reanimated `exiting` on web — concurrent
 * React unmounts there throw `Failed to execute 'removeChild' on 'Node'`, the
 * exact bug this component exists to avoid.
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

  // Presence: `mounted` keeps the node in the tree through the exit transition;
  // `shown` drives the enter/exit transform & opacity. On open we mount first,
  // then flip `shown` on the next frame so the browser registers the start
  // state and animates to the end. On close we flip `shown` off, then unmount
  // after the transition duration.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<FrameToken | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
      // Defer to the next frame so the entry start state paints before we
      // transition to the shown state. Two frames guarantees the start
      // transform has committed before the toggle (a single frame can be
      // coalesced with the mount paint in some browsers).
      frameRef.current = scheduleFrame(() => {
        frameRef.current = scheduleFrame(() => setShown(true));
      });
      return () => {
        if (frameRef.current !== null) {
          cancelFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    }

    // Closing: only run the exit if something is currently mounted.
    setShown(false);
    if (!mounted) return;
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, ANIMATION_DURATION);
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, mounted]);

  // Escape-to-close while open (web only; document is undefined elsewhere).
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onClose();
  }, [dismissOnBackdrop, onClose]);

  const isBottom = viewportWidth < breakpoint;
  const panelBackground = theme.colors.background;

  const panelTransition = useMemo<ViewStyle>(
    () =>
      ({
        transitionProperty: 'transform, opacity',
        transitionDuration: `${ANIMATION_DURATION}ms`,
        transitionTimingFunction: EASE_OUT,
      }) as ViewStyle,
    [],
  );

  const backdropTransition = useMemo<ViewStyle>(
    () =>
      ({
        transitionProperty: 'opacity',
        transitionDuration: `${ANIMATION_DURATION}ms`,
        transitionTimingFunction: EASE_OUT,
      }) as ViewStyle,
    [],
  );

  const panelGeometry = useMemo<ViewStyle>(() => {
    if (isBottom) {
      return {
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: Math.round(viewportHeight * maxHeightRatio),
        borderTopLeftRadius: PANEL_RADIUS,
        borderTopRightRadius: PANEL_RADIUS,
        transform: [{ translateY: shown ? 0 : '100%' }],
        opacity: shown ? 1 : 0,
      } as ViewStyle;
    }

    // Side-sheet: full height minus top/bottom inset, anchored to `side`,
    // offset by the matching horizontal inset. Width is capped so the panel
    // always leaves a gutter on the opposite edge.
    const insetTop = inset?.top ?? 0;
    const insetBottom = inset?.bottom ?? 0;
    const insetLeft = inset?.left ?? 0;
    const insetRight = inset?.right ?? 0;
    const anchorInset = side === 'left' ? insetLeft : insetRight;
    const oppositeInset = side === 'left' ? insetRight : insetLeft;
    const available = viewportWidth - anchorInset - oppositeInset - SIDE_SHEET_MIN_GUTTER;
    const cappedWidth = Math.max(0, Math.min(width, available));
    const hiddenSign = side === 'left' ? '-100%' : '100%';

    return {
      top: insetTop,
      bottom: insetBottom,
      [side]: anchorInset,
      width: cappedWidth,
      borderRadius: PANEL_RADIUS,
      transform: [{ translateX: shown ? 0 : hiddenSign }],
      opacity: shown ? 1 : 0,
    } as ViewStyle;
  }, [isBottom, shown, side, width, inset, viewportWidth, viewportHeight, maxHeightRatio]);

  if (!mounted) return null;

  return (
    <View
      style={[styles.root, containerStyle]}
      // NativeWind reads `className` at runtime; RN core does not type it on
      // View, so spread it conditionally (matching the Button/Fab pattern).
      {...(containerClassName ? ({ className: containerClassName } as Record<string, string>) : {})}
      pointerEvents="box-none"
    >
      <Pressable
        testID={RESPONSIVE_SHEET_BACKDROP_TESTID}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss ${label}`}
        onPress={handleBackdropPress}
        disabled={!dismissOnBackdrop}
        style={[
          styles.backdrop,
          backdropTransition,
          { opacity: shown ? BACKDROP_OPACITY : 0 },
          isWeb ? webBackdropBlur : null,
        ]}
      />

      <View
        accessibilityViewIsModal
        aria-label={label}
        {...(panelClassName ? ({ className: panelClassName } as Record<string, string>) : {})}
        style={[
          styles.panel,
          { backgroundColor: panelBackground, shadowColor: theme.colors.shadow },
          panelGeometry,
          panelTransition,
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
      </View>
    </View>
  );
}

// This module is the web/default impl, but it is also the fallback resolved by
// a downstream consumer's `tsc` for the native target, so guard the web-only
// `backdrop-blur` style behind a runtime check rather than assuming web.
const isWeb = typeof document !== 'undefined';

/**
 * Opaque token returned by `scheduleFrame`. `requestAnimationFrame` returns a
 * number; the `setTimeout` fallback returns a timer handle — both are kept so
 * `cancelFrame` can route to the matching canceller.
 */
type FrameToken = { raf: number } | { timer: ReturnType<typeof setTimeout> };

/**
 * Schedule a callback for the next paint. Uses `requestAnimationFrame` in the
 * browser; degrades to a 0ms timeout when rAF is unavailable (SSR/hydration,
 * non-DOM test envs) so the enter transition's `shown` flip still fires.
 */
function scheduleFrame(cb: () => void): FrameToken {
  if (typeof requestAnimationFrame === 'function') {
    return { raf: requestAnimationFrame(cb) };
  }
  return { timer: setTimeout(cb, 0) };
}

function cancelFrame(token: FrameToken): void {
  if ('raf' in token) {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(token.raf);
    return;
  }
  clearTimeout(token.timer);
}

// `backdrop-filter` is web-only; react-native-web passes it through to the DOM.
const webBackdropBlur = { backdropFilter: 'blur(2px)' } as unknown as ViewStyle;

const styles = StyleSheet.create({
  root: {
    // `position: fixed` pins the overlay to the viewport on web; react-native
    // does not type `'fixed'`, so cast to the RN-accepted `'absolute'`. On
    // native the `.native` fork uses `StyleSheet.absoluteFill` instead.
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDEX.fullscreen,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
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
