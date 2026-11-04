import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { CollapsibleVisibilityContext, useCollapsibleVisibility } from './context';
import type { CollapsibleFrameProps } from './frame-types';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { surfacePresenceVars, useSurfacePresenceContent } from '../surface/use-surface-presence';
import { resolveSurfaceTransition } from '../motion/surface-transition';
import { DEFAULT_COLLAPSIBLE_TRANSITION } from './use-collapsible-motion';

const CSS = `@layer base {
.bloom-collapsible-panel,.bloom-collapsible-content { box-sizing:border-box;display:flex;flex-direction:column;flex-shrink:0;min-width:0; }

}`;
const PanelHost = forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
    style?: StyleProp<ViewStyle>;
    collapsable?: boolean;
  }
>(function PanelHost({ style, collapsable: _collapsable, ...props }, ref) {
  return <div {...props} ref={ref} style={resolveNativeWebStyle(style)} />;
});
const AnimatedPanel = Animated.createAnimatedComponent(PanelHost);

export function CollapsibleFrame({
  open,
  hidden,
  settled = false,
  progress,
  keepMounted = true,
  transition = DEFAULT_COLLAPSIBLE_TRANSITION,
  children,
  style,
  className,
  contentStyle,
  contentClassName,
  returnFocusRef,
  nativeID,
  testID,
  labelledBy,
  returnFocusId,
  region,
}: CollapsibleFrameProps) {
  useInteractiveWebCss('bloom-collapsible', CSS);
  const visible = useCollapsibleVisibility() && open;
  const panel = useRef<HTMLDivElement>(null);
  const focusWithin = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const previousOutside = useRef<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);
  const measure = useCallback(() => {
    const next = body.current?.getBoundingClientRect().height ?? 0;
    if (next > 0) setHeight((old) => (Math.abs(old - next) > 0.5 ? next : old));
  }, []);
  useLayoutEffect(() => {
    const node = body.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);
  // Children mounting again on opening are measured before paint, not a frame late.
  const mounted = keepMounted || !hidden;
  useLayoutEffect(() => {
    if (mounted) measure();
  }, [mounted, measure]);
  useLayoutEffect(() => {
    const active = document.activeElement;
    if (visible) {
      if (active instanceof HTMLElement && !panel.current?.contains(active))
        previousOutside.current = active;
      return;
    }
    if (!panel.current?.contains(active) && !focusWithin.current) return;
    focusWithin.current = false;
    const target =
      returnFocusRef?.current ??
      (returnFocusId ? document.getElementById(returnFocusId) : null) ??
      previousOutside.current;
    if (target instanceof HTMLElement && (!target.isConnected || target.closest('[inert]'))) {
      if (active instanceof HTMLElement) active.blur();
      return;
    }
    target?.focus({ preventScroll: true });
    if (panel.current?.contains(document.activeElement) && active instanceof HTMLElement)
      active.blur();
  }, [visible, returnFocusRef, returnFocusId]);
  const reduced = usePrefersReducedMotion();
  const fade = resolveSurfaceTransition(transition);
  const fadeMs = reduced ? 0 : fade.duration;
  useSurfacePresenceContent(panel, {
    presence: visible ? 1 : 0,
    duration: fadeMs,
    easing: fade.cssEasing,
  });
  const maxHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });
  return (
    <CollapsibleVisibilityContext.Provider value={visible}>
      <AnimatedPanel
        ref={panel}
        id={nativeID}
        data-testid={testID}
        role={region ? 'region' : undefined}
        aria-labelledby={labelledBy}
        aria-hidden={!visible}
        inert={!visible}
        onFocusCapture={() => {
          focusWithin.current = true;
        }}
        onBlurCapture={() => {
          focusWithin.current = false;
        }}
        className={['bloom-collapsible-panel', className].filter(Boolean).join(' ')}
        style={[
          {
            ...surfacePresenceVars(visible ? 1 : 0, fadeMs),
            maxHeight: settled || (height === 0 && open) ? undefined : maxHeight,
            overflow: settled ? 'visible' : 'hidden',
          },
          style,
        ]}
      >
        <div
          ref={body}
          className={['bloom-collapsible-content', contentClassName].filter(Boolean).join(' ')}
          style={resolveNativeWebStyle(contentStyle)}
        >
          {mounted ? children : null}
        </div>
      </AnimatedPanel>
    </CollapsibleVisibilityContext.Provider>
  );
}
