import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Easing, useReducedMotion } from 'react-native-reanimated';
import { useDialogContext } from '../dialog/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { animateNumber } from './animation.web';
const styles = {
  dark: 'bloom-ticket-create-dark',
  genie: 'bloom-ticket-create-genie',
  panel: 'bloom-ticket-create-panel',
  shadow: 'bloom-ticket-create-shadow',
  surface: 'bloom-ticket-create-surface',
};
const CSS =
  '.bloom-ticket-create-panel {\n  transform-origin: center bottom;\n}\n\n.bloom-ticket-create-genie {\n  position: relative;\n  isolation: isolate;\n}\n\n.bloom-ticket-create-surface {\n  position: relative;\n  transform-origin: center bottom;\n}\n\n/* Paint once on a sibling layer, then animate only transform/opacity. The\n * broad shadows no longer sample and re-blur the changing dialog pixels. */\n.bloom-ticket-create-shadow {\n  position: absolute;\n  inset: 0;\n  border-radius: 24px;\n  pointer-events: none;\n  transform-origin: center bottom;\n  box-shadow:\n    0 1px 1px rgb(0 0 0 / 0.04),\n    0 4px 4px rgb(0 0 0 / 0.02),\n    0 0 120px rgb(0 0 0 / 0.1),\n    0 0 48px rgb(0 0 0 / 0.2);\n}\n\n.dark .bloom-ticket-create-shadow {\n  box-shadow:\n    0 1px 1px rgb(0 0 0 / 0.14),\n    0 4px 4px rgb(0 0 0 / 0.1),\n    0 0 120px rgb(0 0 0 / 0.1),\n    0 0 48px rgb(0 0 0 / 0.2);\n}\n\n/* React Aria waits for this animation before unmounting. Geometry is driven\n * by one Motion timeline on the surface, so the panel itself never slides. */\n.bloom-ticket-create-panel[data-entering],\n.bloom-ticket-create-panel[data-exiting] {\n  animation: bloom-ticket-create-ticket-presence 480ms linear both;\n}\n\n.bloom-ticket-create-panel[data-exiting] {\n  pointer-events: none;\n}\n\n.bloom-ticket-create-panel[data-entering] .bloom-ticket-create-surface,\n.bloom-ticket-create-panel[data-exiting] .bloom-ticket-create-surface,\n.bloom-ticket-create-panel[data-entering] .bloom-ticket-create-shadow,\n.bloom-ticket-create-panel[data-exiting] .bloom-ticket-create-shadow {\n  will-change: transform, opacity;\n}\n\n@keyframes bloom-ticket-create-ticket-presence {\n  from { opacity: 0.9999; }\n  to { opacity: 1; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .bloom-ticket-create-panel[data-entering],\n  .bloom-ticket-create-panel[data-exiting] {\n    animation: none;\n  }\n\n  .bloom-ticket-create-panel[data-entering] .bloom-ticket-create-surface,\n  .bloom-ticket-create-panel[data-exiting] .bloom-ticket-create-surface,\n  .bloom-ticket-create-panel[data-entering] .bloom-ticket-create-shadow,\n  .bloom-ticket-create-panel[data-exiting] .bloom-ticket-create-shadow {\n    will-change: auto;\n  }\n}\n';

// A smooth, steep center gradient creates a narrow neck with a displacement
// no larger than the dialog width. Its cubic mask leaves the top broad while
// the bottom contracts. The field is static, decoded once per mounted dialog.
const FIELD_STOPS = Array.from({ length: 33 }, (_, index) => {
  const x = index / 32;
  const red = 127.5 * (1 + Math.tanh((x - 0.5) * 16) / Math.tanh(8));
  return `<stop offset="${x}" stop-color="rgb(${red},128,128)"/>`;
}).join('');
const CURVE_STOPS = Array.from({ length: 33 }, (_, index) => {
  const y = index / 32;
  return `<stop offset="${y}" stop-color="white" stop-opacity="${y ** 3}"/>`;
}).join('');

function smoothStep(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

const WARP_MAP = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="280" viewBox="0 0 560 280">
<defs>
  <linearGradient id="field">${FIELD_STOPS}</linearGradient>
  <linearGradient id="curve" x1="0" y1="0" x2="0" y2="1">${CURVE_STOPS}</linearGradient>
  <mask id="bend"><rect width="560" height="280" fill="url(#curve)"/></mask>
</defs>
<rect width="560" height="280" fill="rgb(128,128,128)"/>
<rect width="560" height="280" fill="url(#field)" mask="url(#bend)"/>
</svg>`)}`;

/** Warp the actual dialog pixels, including its content, during entry/exit. */
export function TicketGenieSurface({ children }: { children: ReactNode }) {
  const { isClosing: exiting = false } = useDialogContext();
  adoptStyleSheet('bloom-ticket-create', CSS);
  const id = `ticket-genie-${useId().replace(/:/g, '')}`;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const mapRef = useRef<SVGFEImageElement>(null);
  const progressRef = useRef(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const surface = surfaceRef.current;
    const shadow = shadowRef.current;
    const displacement = displacementRef.current;
    if (!surface || !shadow || !displacement) return;
    if (reduceMotion) {
      surface.style.willChange = 'auto';
      shadow.style.willChange = 'auto';
      surface.style.filter = 'none';
      surface.style.transform = 'none';
      surface.style.opacity = '1';
      shadow.style.transform = 'none';
      shadow.style.opacity = '1';
      progressRef.current = 0;
      return;
    }
    // SVG percentages otherwise resolve against the page viewport for an HTML
    // filter. Fit the displacement field to the dialog's untransformed pixels.
    const width = surface.offsetWidth;
    const height = surface.offsetHeight;
    mapRef.current?.setAttribute('width', String(width));
    mapRef.current?.setAttribute('height', String(height));
    // Reach just beyond the viewport. All geometry is measured once; each
    // frame only updates filter attributes and compositor transforms.
    const bounds = surface.parentElement!.getBoundingClientRect();
    const dockDistance = Math.max(0, window.innerHeight - bounds.bottom) + 24;
    surface.style.filter = `url("#${id}")`;
    surface.style.willChange = 'transform, opacity';
    shadow.style.willChange = 'transform, opacity';
    const deform = (progress: number) => {
      progressRef.current = progress;
      const neck = smoothStep(0, 0.72, progress);
      const extension = dockDistance * smoothStep(0, 0.42, progress);
      const swallow = smoothStep(0.32, 1, progress);
      // The bottom leads, stretching into a funnel while the top stays put.
      // Only then does the top follow the neck down into the offscreen dock.
      const stretch = Math.max(
        0.001,
        ((height + extension) * (1 - swallow)) / height,
      );
      displacement.setAttribute('scale', String(width * 0.98 * neck));
      blurRef.current?.setAttribute(
        'stdDeviation',
        String(2 * smoothStep(0.8, 1, progress)),
      );
      surface.style.transform = `translateY(${extension}px) scaleY(${stretch})`;
      surface.style.opacity = String(1 - smoothStep(0.94, 1, progress));
      shadow.style.transform = `translateY(${extension}px) scale(${1 - neck * 0.65}, ${1 - swallow * 0.9})`;
      shadow.style.opacity = String(1 - smoothStep(0.08, 0.72, progress));
    };
    // Reverse from the current shape if dismissed before opening completes.
    deform(progressRef.current);
    const animation = animateNumber(progressRef.current, exiting ? 1 : 0, {
      duration: 0.48,
      ease: Easing.bezier(0.42, 0, 0.58, 1).factory(),
      onUpdate: deform,
      onComplete: () => {
        surface.style.willChange = 'auto';
        shadow.style.willChange = 'auto';
        // Remove the filter at rest so text is crisp and controls stay native.
        if (!exiting) {
          surface.style.filter = 'none';
          surface.style.transform = 'none';
        }
      },
    });
    return () => animation.stop();
  }, [exiting, id, reduceMotion]);

  return (
    <>
      <svg
        width="0"
        height="0"
        aria-hidden
        className="pointer-events-none absolute"
      >
        <defs>
          <filter
            id={id}
            x="-5%"
            y="-10%"
            width="110%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodColor="rgb(128,128,128)" result="neutral" />
            <feImage
              ref={mapRef}
              href={WARP_MAP}
              x="0"
              y="0"
              width="560"
              height="230"
              preserveAspectRatio="none"
              result="field"
            />
            <feComposite
              in="field"
              in2="neutral"
              operator="over"
              result="warp"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="warp"
              scale={reduceMotion ? 0 : 200}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur ref={blurRef} stdDeviation={reduceMotion ? 0 : 4} />
          </filter>
        </defs>
      </svg>
      <div className={styles.genie}>
        {/* An independent, cacheable shadow moves with the panel. Filtering a
            parent would recompute every shadow from the changing warp. */}
        <div ref={shadowRef} aria-hidden className={styles.shadow} />
        <div
          ref={surfaceRef}
          className={styles.surface}
          style={{
            filter: reduceMotion ? 'none' : `url("#${id}")`,
            transform: reduceMotion ? 'none' : 'scaleY(0.001)',
            opacity: reduceMotion ? 1 : 0,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
