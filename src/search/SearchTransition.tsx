import { useEffect, type ReactNode } from 'react';
import { SEARCH_EXPAND } from './context';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { animateWithSpec, motionCss } from '../motion/spec';
import { StyledView } from '../styles/styled-primitives';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { useSurfacePresence } from '../surface/use-surface-presence';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
// Critically damped: a soft landing without overshooting the available space.
const EXPAND = SEARCH_EXPAND;
const CONTENT_MS = 160;

/** Persistent controls share an animated capsule; neither input nor trigger remounts. */
export function SearchTransition({
  expanded,
  collapsedWidth,
  height,
  align,
  onLayout,
  trigger,
  children,
}: {
  expanded: boolean;
  collapsedWidth: number | '100%';
  height: number;
  align?: ViewStyle['alignSelf'];
  onLayout?: (event: LayoutChangeEvent) => void;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const progress = useSharedValue(Number(expanded));
  const available = useSharedValue(0);
  const css = motionCss(EXPAND, reduced);
  const duration = reduced ? 0 : CONTENT_MS;
  const field = useSurfacePresence(Number(expanded), { duration });
  const button = useSurfacePresence(Number(!expanded), { duration });
  useEffect(() => {
    if (!IS_WEB) animateWithSpec(progress, Number(expanded), EXPAND, reduced);
  }, [expanded, progress, reduced]);
  const widthStyle = useAnimatedStyle(
    () => ({
      width:
        collapsedWidth === '100%'
          ? '100%'
          : collapsedWidth +
            (Math.max(available.value, collapsedWidth) - collapsedWidth) * progress.value,
    }),
    [collapsedWidth, available, progress],
  );
  const fieldStyle = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);
  const buttonStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }), [progress]);
  const webWidth: WebCssStyle = {
    width: expanded ? '100%' : collapsedWidth,
    transitionProperty: 'width',
    transitionDuration: css.duration,
    transitionTimingFunction: css.easing,
  };
  return (
    <StyledView
      style={{ width: '100%', minWidth: 0 }}
      onLayout={(event) => {
        available.value = event.nativeEvent.layout.width;
        onLayout?.(event);
      }}
    >
      <AnimatedView
        testID="search-capsule"
        style={[
          {
            alignSelf: align ?? 'flex-end',
            height,
            minWidth: 0,
            borderRadius: height / 2,
            overflow: 'hidden',
          },
          IS_WEB ? webWidth : widthStyle,
        ]}
      >
        <AnimatedView
          ref={button.ref}
          aria-hidden={expanded}
          accessibilityElementsHidden={expanded}
          importantForAccessibility={expanded ? 'no-hide-descendants' : 'auto'}
          pointerEvents={expanded ? 'none' : 'auto'}
          {...(IS_WEB && expanded ? { inert: true } : {})}
          style={[{ position: 'absolute', inset: 0 }, button.style, !IS_WEB && buttonStyle]}
        >
          {trigger}
        </AnimatedView>
        <AnimatedView
          ref={field.ref}
          aria-hidden={!expanded}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
          pointerEvents={expanded ? 'auto' : 'none'}
          {...(IS_WEB && !expanded ? { inert: true } : {})}
          style={[{ width: '100%', minWidth: 0 }, field.style, !IS_WEB && fieldStyle]}
        >
          {children}
        </AnimatedView>
      </AnimatedView>
    </StyledView>
  );
}
