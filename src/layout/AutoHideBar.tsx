import React, { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useMessages } from '../locale/messages';
import { animateWithSpec, motionCss, type MotionSpec } from '../motion/spec';
import { IS_WEB } from '../styles/platform';
import { StyledView as View } from '../styles/styled-primitives';
import { useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { Muted } from '../typography';
import { surfacePresenceVars, useSurfacePresenceContent } from '../surface/use-surface-presence';
import {
  AUTO_HIDE_BAR_HIDE,
  AUTO_HIDE_BAR_REDUCED_FADE,
  AUTO_HIDE_BAR_SHOW,
  autoHideBarGeometry,
  composedCss,
  CONTROLS_OPACITY,
  interpolateStops,
  SUMMARY_OPACITY,
} from './auto-hide-bar-motion';
import { LAYOUT_MESSAGES } from './messages';
import type { AutoHideBarProps } from './types';
import { useAutoHideBarMode } from './use-auto-hide-bar';

const DEFAULT_HEIGHT = 41;
// The web runs on CSS transitions: its nodes are plain views, never per-frame
// animated ones.
const Host = (IS_WEB ? View : Animated.View) as typeof Animated.View;
const DEFAULT_COLLAPSED_HEIGHT = 20;

type WebBody = { tall: boolean; offset: number; animate: boolean };

const transition = (property: string, css: { duration: string; easing: string }): WebCssStyle => ({
  transitionProperty: property,
  transitionDuration: css.duration,
  transitionTimingFunction: css.easing,
});

/**
 * A bar that steps aside to a thin strip when its owner says so, and the body
 * under it. Collapsing, the controls fade early while the bar recedes (scale
 * 0.94, lifted) and its band shrinks to the strip; the summary arrives over the
 * second half. The body is laid out ONCE per change and translated: collapsing
 * lays it out tall and slides it up from where it was; expanding slides it
 * down, keeping the tall layout, and commits the short one when the motion
 * ends. Hovering the strip peeks the whole bar over the body, which does not
 * move. Web runs on CSS transitions, native on Reanimated, from the same specs.
 */
export function AutoHideBar({
  bar,
  summary,
  collapsed,
  height = DEFAULT_HEIGHT,
  collapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
  onReveal,
  peek = true,
  peekDelay = 150,
  unpeekDelay = 250,
  motion,
  background,
  revealLabel,
  children,
  style,
  testID,
}: AutoHideBarProps) {
  const direction = useDirectionProps();
  const { messages } = useMessages(LAYOUT_MESSAGES);
  const surface = useSurfaceFill();
  const reducedMotion = useReducedMotion();
  const hide: MotionSpec = motion?.hide ?? AUTO_HIDE_BAR_HIDE;
  const show: MotionSpec = motion?.show ?? AUTO_HIDE_BAR_SHOW;
  const strip = Math.max(0, Math.min(collapsedHeight, height));
  const room = height - strip;
  const controls = useAutoHideBarMode({ collapsed, peek, peekDelay, unpeekDelay, onReveal });
  const { mode } = controls;
  const barTarget = mode === 'collapsed' ? 1 : 0;
  const pageCollapsed = mode !== 'shown';

  // ---- native: four shared values, all moved on the UI thread ----------------
  const barProgress = useSharedValue(barTarget);
  const fade = useSharedValue(barTarget);
  const bodyTop = useSharedValue(pageCollapsed ? strip : height);
  const bodyOffset = useSharedValue(0);
  const previousBar = useRef(barTarget);
  const previousPage = useRef(pageCollapsed);

  // ---- web: the body's layout and its translate, with the FLIP's first frame -
  const [webBody, setWebBody] = useState<WebBody>({
    tall: pageCollapsed,
    offset: 0,
    animate: false,
  });
  const bodyRef = useRef<ComponentRef<typeof RNView>>(null);

  useLayoutEffect(() => {
    if (previousBar.current !== barTarget) {
      const spec = barTarget > previousBar.current ? hide : show;
      previousBar.current = barTarget;
      if (!IS_WEB) {
        animateWithSpec(barProgress, barTarget, spec, reducedMotion);
        animateWithSpec(fade, barTarget, reducedMotion ? AUTO_HIDE_BAR_REDUCED_FADE : spec);
      }
    }
    if (previousPage.current === pageCollapsed) return;
    previousPage.current = pageCollapsed;
    const spec = pageCollapsed ? hide : show;
    if (IS_WEB) {
      if (pageCollapsed)
        setWebBody({ tall: true, offset: reducedMotion ? 0 : room, animate: false });
      else if (reducedMotion) setWebBody({ tall: false, offset: 0, animate: false });
      else setWebBody({ tall: true, offset: room, animate: true });
      return;
    }
    const visual = bodyTop.value + bodyOffset.value;
    if (pageCollapsed) {
      bodyTop.value = strip;
      bodyOffset.value = visual - strip;
      animateWithSpec(bodyOffset, 0, spec, reducedMotion);
    } else {
      animateWithSpec(bodyOffset, height - bodyTop.value, spec, reducedMotion, (finished) => {
        'worklet';
        if (!finished) return;
        bodyTop.value = height;
        bodyOffset.value = 0;
      });
    }
  }, [barTarget, pageCollapsed]);

  // The FLIP's second step: the tall layout is on screen at its old place, now
  // slide it home. Reading the box flushes style so the browser sees a change.
  useLayoutEffect(() => {
    if (!IS_WEB || webBody.animate || webBody.offset === 0) return;
    (bodyRef.current as unknown as HTMLElement | null)?.getBoundingClientRect();
    setWebBody({ tall: true, offset: 0, animate: true });
  }, [webBody]);
  useLayoutEffect(() => {
    if (!IS_WEB) return;
    const node = bodyRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const ended = (event: TransitionEvent) => {
      if (event.target !== node || event.propertyName !== 'transform') return;
      setWebBody((body) =>
        body.offset === room && body.tall && !previousPage.current
          ? { tall: false, offset: 0, animate: false }
          : body,
      );
    };
    node.addEventListener('transitionend', ended);
    return () => node.removeEventListener('transitionend', ended);
  }, [room]);

  const geometryStyle = useAnimatedStyle(() => {
    const g = autoHideBarGeometry(barProgress.value, height, strip);
    return { transform: [{ translateY: g.controlsTranslateY }, { scale: g.controlsScale }] };
  }, [barProgress, height, strip]);
  const bandStyle = useAnimatedStyle(() => {
    const g = autoHideBarGeometry(barProgress.value, height, strip);
    return { transform: [{ translateY: g.bandTranslateY }, { scaleY: g.bandScaleY }] };
  }, [barProgress, height, strip]);
  const controlsFade = useAnimatedStyle(
    () => ({ opacity: interpolateStops(CONTROLS_OPACITY, fade.value) }),
    [fade],
  );
  const summaryFade = useAnimatedStyle(
    () => ({ opacity: interpolateStops(SUMMARY_OPACITY, fade.value) }),
    [fade],
  );
  const bodyStyle = useAnimatedStyle(
    () => ({ top: bodyTop.value, transform: [{ translateY: bodyOffset.value }] }),
    [bodyTop, bodyOffset],
  );

  // Web: target values and the transitions that reach them.
  const webSpec = barTarget === 1 ? hide : show;
  const fromBar = 1 - barTarget;
  const geometryCss = motionCss(webSpec, reducedMotion);
  const fadeSpec = reducedMotion ? AUTO_HIDE_BAR_REDUCED_FADE : webSpec;
  const webGeometry = autoHideBarGeometry(barTarget, height, strip);
  const controlsOpacity = interpolateStops(CONTROLS_OPACITY, barTarget);
  const summaryOpacity = interpolateStops(SUMMARY_OPACITY, barTarget);
  const controlsCss = composedCss(fadeSpec, CONTROLS_OPACITY, fromBar, barTarget, false);
  const summaryCss = composedCss(fadeSpec, SUMMARY_OPACITY, fromBar, barTarget, false);
  const controlsRef = useRef<ComponentRef<typeof RNView>>(null);
  const summaryRef = useRef<ComponentRef<typeof RNView>>(null);
  // The bar may hold material controls: fade its pieces, never an ancestor of
  // a material host (that would turn the material flat for the whole fade).
  useSurfacePresenceContent(controlsRef, {
    presence: controlsOpacity,
    duration: Number.parseFloat(controlsCss.duration),
    easing: controlsCss.easing,
  });
  useSurfacePresenceContent(summaryRef, {
    presence: summaryOpacity,
    duration: Number.parseFloat(summaryCss.duration),
    easing: summaryCss.easing,
  });
  const webControls: WebCssStyle = {
    ...surfacePresenceVars(controlsOpacity, Number.parseFloat(controlsCss.duration)),
    transform: [
      { translateY: webGeometry.controlsTranslateY },
      { scale: webGeometry.controlsScale },
    ] as never,
    ...transition('transform', geometryCss),
  };
  const webSummary: WebCssStyle = surfacePresenceVars(
    summaryOpacity,
    Number.parseFloat(summaryCss.duration),
  );
  const webBand: WebCssStyle = {
    transform: [
      { translateY: webGeometry.bandTranslateY },
      { scaleY: webGeometry.bandScaleY },
    ] as never,
    ...transition('transform', geometryCss),
  };
  const webBodyStyle: WebCssStyle = {
    top: webBody.tall ? strip : height,
    transform: [{ translateY: webBody.offset }] as never,
    ...transition(
      'transform',
      webBody.animate
        ? motionCss(pageCollapsed ? hide : show, reducedMotion)
        : motionCss(show, true),
    ),
  };

  const hiddenBar = mode === 'collapsed';
  const label = revealLabel ?? messages.showToolbar;
  const fill = background ?? surface;

  return (
    <View
      {...direction}
      testID={testID}
      style={[
        { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, overflow: 'hidden' },
        style,
      ]}
    >
      <Host
        ref={bodyRef}
        testID={testID ? `${testID}-body` : undefined}
        style={[
          { position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, bottom: 0 },
          IS_WEB ? webBodyStyle : bodyStyle,
        ]}
      >
        {children}
      </Host>
      <View
        pointerEvents="box-none"
        testID={testID ? `${testID}-bar` : undefined}
        style={{ position: 'absolute', top: 0, insetInlineStart: 0, insetInlineEnd: 0, height }}
      >
        <Host
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              insetInlineStart: 0,
              insetInlineEnd: 0,
              height,
              backgroundColor: fill,
            },
            IS_WEB ? webBand : bandStyle,
          ]}
        />
        <View
          onPointerEnter={controls.barHoverIn}
          onPointerLeave={controls.barHoverOut}
          {...({ onMouseEnter: controls.barHoverIn, onMouseLeave: controls.barHoverOut } as object)}
          pointerEvents={hiddenBar ? 'none' : 'box-none'}
          aria-hidden={hiddenBar || undefined}
          accessibilityElementsHidden={hiddenBar}
          importantForAccessibility={hiddenBar ? 'no-hide-descendants' : 'auto'}
          {...(IS_WEB && hiddenBar ? { inert: true } : {})}
          testID={testID ? `${testID}-controls` : undefined}
          style={StyleSheet.absoluteFill}
        >
          <Host
            ref={controlsRef}
            style={[{ height }, IS_WEB ? webControls : [geometryStyle, controlsFade]]}
          >
            {bar}
          </Host>
        </View>
        <Host
          ref={summaryRef}
          pointerEvents={hiddenBar ? 'auto' : 'none'}
          aria-hidden={!hiddenBar || undefined}
          accessibilityElementsHidden={!hiddenBar}
          importantForAccessibility={hiddenBar ? 'auto' : 'no-hide-descendants'}
          {...(IS_WEB && !hiddenBar ? { inert: true } : {})}
          style={[
            { position: 'absolute', top: 0, insetInlineStart: 0, insetInlineEnd: 0, height: strip },
            IS_WEB ? webSummary : summaryFade,
          ]}
        >
          <Pressable
            role="button"
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={controls.reveal}
            onHoverIn={controls.stripHoverIn}
            onHoverOut={controls.stripHoverOut}
            testID={testID ? `${testID}-strip` : undefined}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingInlineStart: 12,
              paddingInlineEnd: 12,
            }}
          >
            {typeof summary === 'string' ? (
              <Muted numberOfLines={1} style={{ fontSize: 11, lineHeight: 14, fontWeight: '500' }}>
                {summary}
              </Muted>
            ) : (
              summary
            )}
          </Pressable>
        </Host>
      </View>
    </View>
  );
}
