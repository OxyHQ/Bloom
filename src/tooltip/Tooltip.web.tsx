import { useTooltipSize } from './use-tooltip-size';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { useSurfaceMaterial } from '../surface/use-surface-material.web';
import {
  surfacePresenceVars,
  useEnteredPresence,
  useSurfacePresenceContent,
} from '../surface/use-surface-presence';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { useMenuPalette } from '../floating/menu-palette';
import type { FloatingAnchor } from '../floating/types';
import { OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { atoms as a } from '../styles';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import {
  ARROW_DEPTH,
  ARROW_HALF_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
  TOOLTIP_MOTION_DURATION,
  TOOLTIP_OFFSET,
  TOOLTIP_SIZES,
  type TooltipSize,
} from './constants';
import { createTextBubble } from './TextBubble';
import { TooltipCaret } from './TooltipCaret';

/**
 * The tooltip motion: `transition duration-200 ease-out` between the resting
 * bubble and `scale-90 opacity-0 blur-[4px]`, the same shape in and out.
 *
 * The bubble paints the material, so only its SCALE is a keyframe pair here (it
 * mounts already open, so there is no earlier frame to transition from). The
 * fade and the blur never touch the bubble: an opacity or a filter on it would
 * make it a backdrop root and cut its own blur off (a keyframe ending on
 * `filter: none` even rests on `blur(0px)`, flat for good). Its layers fade
 * through the presence variables, its label and caret through
 * `useSurfacePresenceContent`, and its border and shadow by transition.
 *
 * Self-injected through `adoptStyleSheet`, never a `<style>` element.
 */
const STYLE_ID = 'bloom-tooltip-web-css';
const TOOLTIP_CSS = `
@keyframes bloom-tooltip-in {
  from { transform: scale(0.9); }
  to { transform: none; }
}
@keyframes bloom-tooltip-out {
  from { transform: none; }
  to { transform: scale(0.9); }
}
[data-bloom-tooltip] {
  animation: bloom-tooltip-in ${TOOLTIP_MOTION_DURATION}ms cubic-bezier(0, 0, 0.2, 1) both;
  user-select: none;
}
[data-bloom-tooltip][data-state="closed"] {
  animation-name: bloom-tooltip-out;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-tooltip] { animation: none; }
}
`;

type TooltipContextType = {
  position: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (open: boolean) => void;
  /** The trigger box the bubble anchors to. */
  triggerRef: React.RefObject<ComponentRef<typeof View> | null>;
};

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  visible: false,
  onVisibleChange: () => {},
  triggerRef: { current: null },
});
TooltipContext.displayName = 'TooltipContext';

export function Tooltip({
  children,
  position = 'bottom',
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const triggerRef = useRef<ComponentRef<typeof View>>(null);
  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange, triggerRef }),
    [position, visible, onVisibleChange],
  );

  // Outside-press dismissal WITHOUT a layer over the page. A full-screen
  // pressable used to sit over the trigger while the bubble was open: a
  // hover-opened tooltip got an immediate hover-out and closed within a frame,
  // and the next click landed on the layer instead of the control. A document
  // listener sees the press and lets it through; presses on the trigger itself
  // are the trigger's own business (the bubble is `pointer-events: none`).
  useEffect(() => {
    if (!visible || typeof document === 'undefined') return;
    const onPointerDown = (event: PointerEvent) => {
      const trigger = triggerRef.current as unknown as {
        contains?: (node: unknown) => boolean;
      } | null;
      if (typeof trigger?.contains === 'function' && trigger.contains(event.target)) return;
      onVisibleChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [visible, onVisibleChange]);

  return <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>;
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  const { triggerRef } = useContext(TooltipContext);
  // The bubble centres on THIS box, so in a stretching column it is the column's
  // width — wrap the trigger in a box that hugs it (`alignItems: 'flex-start'`).
  return (
    <View ref={triggerRef} collapsable={false} style={a.relative}>
      {children}
    </View>
  );
}

/**
 * The bubble — a light-surface tooltip: `bg-background-primary-default`,
 * 1px `border-button-default`, `shadow-dropdown`, `text-primary`, hugging its
 * content up to 240px, with a 12×7 caret pointing at the trigger and a 10px gap
 * to it. `size` picks `sm` (12px, the default) or `md` (14px).
 *
 * Non-interactive (`pointer-events-none select-none`), so a press on the bubble
 * falls through to the dismiss layer.
 */
export function TooltipContent({
  children,
  label,
  size: sizeProp,
}: {
  children: React.ReactNode;
  label: string;
  size?: TooltipSize;
}) {
  const size = useTooltipSize(sizeProp);
  const parentFill = useSurfaceFill();
  const palette = useMenuPalette();
  const publishedFill = resolveSurfaceMaterial({
    fill: palette.surface,
    parentFill: parentFill,
  }).publishedFill;
  const materialStyle = useSurfaceMaterial(
    '[data-bloom-tooltip]',
    'bloom-tooltip-surface-css',
    palette.surface,
    true,
    undefined,
    undefined,
    TOOLTIP_SIZES[size].borderRadius,
  );
  const { position, visible, triggerRef } = useContext(TooltipContext);

  // `visible` drives an `open` → `closing` → unmounted cycle, so the exit has
  // the animation's length to play before the bubble leaves the tree. Adjusted
  // during render, as `FloatingPanel` does, so no committed frame unmounts it
  // early.
  const [mounted, setMounted] = useState(visible);
  const [lastVisible, setLastVisible] = useState(visible);
  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) setMounted(true);
  }

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, TOOLTIP_CSS);
  }, []);

  useEffect(() => {
    if (visible || !mounted) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setMounted(false), reduced ? 0 : TOOLTIP_MOTION_DURATION);
    return () => clearTimeout(timer);
  }, [visible, mounted]);

  // The TRIGGER's viewport box, re-measured on scroll and resize. The bubble is
  // portaled and `position: fixed` against it. It used to be `position:
  // absolute` inside the tree, which on react-native-web (every `View` is
  // `position: relative`) anchored it to whatever box happened to contain the
  // Tooltip — the column, the card — rather than to its trigger.
  const anchor = useTrackedAnchor(triggerRef, mounted);
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const [bubble, setBubble] = useState<ComponentRef<typeof View> | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  // Present once it has been measured (the frame before, it would show at the
  // wrong place) and a frame has painted at zero for the fade to start from.
  const presence =
    useEnteredPresence(visible, mounted && anchor !== null) && bubbleWidth > 0 ? 1 : 0;
  const presenceMs = reducedMotion ? 0 : TOOLTIP_MOTION_DURATION;
  useSurfacePresenceContent(bubble, { presence, duration: presenceMs, blur: 4 });

  if (!mounted || !anchor) return null;

  const box = TOOLTIP_SIZES[size];
  const bubbleStyle: WebCssStyle = {
    ...materialStyle,
    ...surfaceFillVars(publishedFill),
    maxWidth: BUBBLE_MAX_WIDTH,
    paddingHorizontal: box.paddingHorizontal,
    paddingVertical: box.paddingVertical,
    borderRadius: box.borderRadius,
    borderWidth: 1,
    borderColor: presence ? palette.border : 'transparent',
    backgroundColor: 'transparent',
    boxShadow: presence ? palette.shadow : 'none',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: `${presenceMs}ms`,
    transitionTimingFunction: 'ease-out',
    ...surfacePresenceVars(presence, presenceMs),
  };

  const viewportWidth = typeof window === 'undefined' ? Infinity : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight;
  const centerX = (anchor.left + anchor.right) / 2;
  // Centred on the trigger, nudged back inside the viewport's gutter when the
  // bubble would cross an edge — the caret keeps pointing at the trigger.
  const width = bubbleWidth || 0;
  const left = Math.max(
    MIN_EDGE_SPACE,
    Math.min(centerX - width / 2, viewportWidth - MIN_EDGE_SPACE - width),
  );
  const caretLeft = Math.max(
    box.borderRadius,
    Math.min(centerX - left - ARROW_HALF_SIZE, width - box.borderRadius - ARROW_HALF_SIZE * 2),
  );

  return (
    <Portal>
      <OverlayRoot>
        <View
          aria-label={label}
          role="alert"
          pointerEvents="none"
          onLayout={(event: LayoutChangeEvent) => setBubbleWidth(event.nativeEvent.layout.width)}
          style={[
            styles.fixed,
            {
              left,
              maxWidth: BUBBLE_MAX_WIDTH,
            },
            position === 'top'
              ? { bottom: viewportHeight - anchor.top + TOOLTIP_OFFSET }
              : { top: anchor.bottom + TOOLTIP_OFFSET },
          ]}
        >
          <View
            ref={setBubble}
            {...({
              dataSet: { bloomTooltip: '', state: visible ? 'open' : 'closed' },
            } as Record<string, unknown>)}
            style={[
              bubbleStyle,
              {
                transformOrigin: `${caretLeft + ARROW_HALF_SIZE}px ${position === 'top' ? '100%' : '0%'}`,
              } as WebCssStyle,
            ]}
          >
            <SurfaceLevelProvider level={1} fill={publishedFill}>
              {children}
            </SurfaceLevelProvider>
            {/* Outside the padding box, overlapping the border by its 1px. */}
            <TooltipCaret
              position={position}
              fill={palette.surface}
              stroke={palette.border}
              style={[
                styles.caret,
                { left: caretLeft - 1 },
                position === 'top' ? { top: '100%' } : { bottom: '100%' },
              ]}
            />
          </View>
        </View>
      </OverlayRoot>
    </Portal>
  );
}

/**
 * The trigger's viewport box, followed every frame while the bubble is mounted.
 *
 * Not `floating/use-anchor-rect`'s scroll/resize listeners: a tooltip is often
 * open WHILE the page is still settling — a web font swapping in reflows every
 * line before the trigger and moves it without any scroll or resize. Measured
 * once, the Sizes story's bubbles drifted 2–15px off their triggers after Inter
 * loaded. One `getBoundingClientRect` per frame, and a state update only when
 * the box actually moved.
 */
function useTrackedAnchor(
  ref: React.RefObject<ComponentRef<typeof View> | null>,
  active: boolean,
): FloatingAnchor | null {
  const [anchor, setAnchor] = useState<FloatingAnchor | null>(null);
  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setAnchor(null);
      return;
    }
    let frame = 0;
    let last: FloatingAnchor | null = null;
    const tick = () => {
      const node = ref.current as unknown as { getBoundingClientRect?: () => DOMRect } | null;
      if (typeof node?.getBoundingClientRect === 'function') {
        const box = node.getBoundingClientRect();
        if (
          !last ||
          last.top !== box.top ||
          last.bottom !== box.bottom ||
          last.left !== box.left ||
          last.right !== box.right
        ) {
          last = { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
          setAnchor(last);
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [ref, active]);
  return anchor;
}

export const TooltipTextBubble = createTextBubble(TooltipContent);

const styles = StyleSheet.create({
  caret: {
    position: 'absolute',
    height: ARROW_DEPTH,
  },
  // Depth comes from `OverlayRoot`'s open-order stack, never a number here.
  fixed: {
    position: WEB_POSITION_FIXED,
  },
});
