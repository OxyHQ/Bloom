import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useDialogContext } from '../dialog/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { TicketGenieEnteredContext } from './context';
const styles = {
  band: 'bloom-ticket-detail-band',
  bands: 'bloom-ticket-detail-bands',
  genie: 'bloom-ticket-detail-genie',
  panel: 'bloom-ticket-detail-panel',
  shadow: 'bloom-ticket-detail-shadow',
  surface: 'bloom-ticket-detail-surface',
};
const CSS =
  '/* React Aria keeps the panel mounted for the shared Genie timeline.\n * Its pixels bend into the bottom-right dock; the shell never slides. */\n.bloom-ticket-detail-panel[data-entering], .bloom-ticket-detail-panel[data-exiting] { animation: bloom-ticket-detail-detail-presence 560ms linear both; }\n.bloom-ticket-detail-panel[data-exiting] { pointer-events: none; }\n@keyframes bloom-ticket-detail-detail-presence {\n  from { opacity: 0.9999; }\n  to { opacity: 1; }\n}\n.bloom-ticket-detail-genie, .bloom-ticket-detail-surface { position: relative; height: 100%; min-height: 0; }\n.bloom-ticket-detail-genie { isolation: isolate; }\n/* Start the chart\'s own drawing animation only after the visual bands hand\n * back to the live panel, so it never flashes a completed copy first. */\n.bloom-ticket-detail-genie:not([data-entered="true"]) .bloom-ticket-detail-chart svg {\n  visibility: hidden;\n}\n.bloom-ticket-detail-shadow {\n  position: absolute;\n  inset: 0;\n  border-radius: 24px;\n  pointer-events: none;\n  transform-origin: right bottom;\n  box-shadow: -10px 0 34px rgb(0 0 0 / 0.05), -10px 0 250px rgb(0 0 0 / 0.25);\n}\n.bloom-ticket-detail-bands { position: absolute; inset: 0; pointer-events: none; opacity: 0; }\n.bloom-ticket-detail-band {\n  position: absolute;\n  top: 0;\n  left: 0;\n  overflow: hidden;\n  contain: strict;\n  transform-origin: 0 0;\n  will-change: transform;\n  backface-visibility: hidden;\n}\n@media (prefers-reduced-motion: reduce) {\n  .bloom-ticket-detail-panel[data-entering], .bloom-ticket-detail-panel[data-exiting] { animation: none; }\n}\n';

const DURATION = 480;
const FRAMES = 32;
const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};
const phase = (start: number, end: number, value: number) =>
  smooth((value - start) / (end - start));

/** Map a rectangular band to a trapezoid. Adjacent bands share their exact
 * edges, producing a curved funnel using compositor-only transforms. */
function bandTransform(
  width: number,
  height: number,
  top: number,
  bottom: number,
  dockX: number,
  dockY: number,
  progress: number,
) {
  const neck = phase(0, 0.72, progress);
  const swallow = phase(0.32, 1, progress);
  const extension = dockY * phase(0, 0.42, progress);
  const scaleX = 1 - 0.88 * swallow;
  const scaleY = Math.max(0.001, ((height + extension) * (1 - swallow)) / height);
  const right = width + dockX * phase(0, 0.72, progress);
  const section = (y: number) => {
    const bend = neck * (y / height) ** 3;
    return {
      left: right - width * scaleX + width * scaleX * 0.92 * bend,
      right: right - width * scaleX * 0.03 * bend,
      y: height * (1 - scaleY) + extension + y * scaleY,
    };
  };
  const a = section(top);
  const b = section(bottom);
  const bandHeight = bottom - top;
  const topWidth = a.right - a.left;
  const ratio = topWidth / (b.right - b.left);
  return `matrix3d(${topWidth / width},0,0,0,${(b.left * ratio - a.left) / bandHeight},${(b.y * ratio - a.y) / bandHeight},0,${(ratio - 1) / bandHeight},0,0,1,0,${a.left},${a.y},0,1)`;
}

/** Match complete IDs, so a reference ending in -10 never matches -1. */
function rebaseIds(copy: HTMLElement, prefix: string) {
  const elements = [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))];
  const ids = new Map<string, string>();
  elements.forEach((element) => {
    if (element.id) {
      const id = `${prefix}-${ids.size}`;
      ids.set(element.id, id);
      element.id = id;
    }
  });
  elements.forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name === 'id') continue;
      let value = attribute.value.replace(
        /url\((["']?)#([^"')]+)\1\)/g,
        (reference, _quote, id: string) => (ids.has(id) ? `url(#${ids.get(id)})` : reference),
      );
      if (value.startsWith('#') && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
      if (value !== attribute.value) element.setAttribute(attribute.name, value);
    }
  });
}

/** Paint the chart once, before slicing. Chromium can cull SVG strokes and
 * gradient fills differently in each perspective-transformed clipping band.
 * A shared bitmap keeps every band on the same paint, at device resolution. */
async function snapshotCharts(source: HTMLDivElement, copy: HTMLDivElement) {
  const charts = source.querySelectorAll<SVGSVGElement>('.bloom-ticket-detail-chart svg');
  const copies = copy.querySelectorAll<SVGSVGElement>('.bloom-ticket-detail-chart svg');
  await Promise.allSettled(
    Array.from(charts, async (chart, index) => {
      const { width, height } = chart.getBoundingClientRect();
      if (!width || !height) return;
      const svg = chart.cloneNode(true) as SVGSVGElement;
      const originals = [chart, ...Array.from(chart.querySelectorAll<SVGElement>('*'))];
      const elements = [svg, ...Array.from(svg.querySelectorAll<SVGElement>('*'))];
      const paint = [
        'fill',
        'fill-opacity',
        'stroke',
        'stroke-opacity',
        'stroke-width',
        'stroke-dasharray',
        'stroke-dashoffset',
        'stroke-linecap',
        'stroke-linejoin',
        'opacity',
        'stop-color',
        'stop-opacity',
        'clip-path',
        'visibility',
      ];
      elements.forEach((element, elementIndex) => {
        const computed = getComputedStyle(originals[elementIndex]!);
        for (const property of paint) {
          // Resolve theme variables and make document-local paint references
          // local to the standalone SVG image too.
          const value = computed
            .getPropertyValue(property)
            .replace(/url\(["']?[^#)]*#([^"')]+)["']?\)/g, 'url(#$1)');
          element.style.setProperty(property, value);
        }
      });
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.ceil(width * ratio);
      canvas.height = Math.ceil(height * ratio);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const bitmap = new Image();
      bitmap.alt = '';
      bitmap.style.cssText = `display:block;width:${width}px;height:${height}px;max-width:none`;
      bitmap.src = canvas.toDataURL();
      await bitmap.decode();
      copies[index]?.replaceWith(bitmap);
    }),
  );
}

/** Private visual copy: never duplicate live React controls or accessible IDs. */
function copySurface(source: HTMLDivElement, prefix: string) {
  const copy = source.cloneNode(true) as HTMLDivElement;
  rebaseIds(copy, prefix);
  const originals = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const elements = [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))];
  elements.forEach((element, index) => {
    // Freeze nested chart reveals and progressive backdrop filters while the
    // browser paints each clipped band once. No filters animate on these bands.
    element.style.animation = 'none';
    element.style.transition = 'none';
    element.style.backdropFilter = 'none';
    if (originals[index]!.classList.contains('animate-chart-reveal')) {
      element.style.clipPath = getComputedStyle(originals[index]!).clipPath;
    }
    // Cloning preserves the DOM but not an internal scroll position.
    if (originals[index]!.scrollTop)
      element.dataset.genieScroll = String(originals[index]!.scrollTop);
  });
  copy.style.opacity = '1';
  copy.style.transform = 'none';
  copy.style.filter = 'none';
  return copy;
}

/** Tall panels use cached bands instead of re-running a full-height SVG
 * displacement + blur pass each frame. Only transform and opacity animate. */
export function TicketCornerGenieSurface({ children }: { children: ReactNode }) {
  const { isClosing: exiting = false } = useDialogContext();
  adoptStyleSheet('bloom-ticket-detail', CSS);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const bandsRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(1);
  const reducedMotion = useReducedMotion();
  const [entered, setEntered] = useState(reducedMotion);

  useEffect(() => {
    const root = rootRef.current;
    const surface = surfaceRef.current;
    const bands = bandsRef.current;
    const shadow = shadowRef.current;
    if (!root || !surface || !bands || !shadow) return;
    if (reducedMotion) {
      root.dataset.entered = 'true';
      setEntered(true);
      surface.style.opacity = '1';
      shadow.style.opacity = '1';
      bands.replaceChildren();
      progressRef.current = 0;
      return;
    }

    let cancelled = false;
    let frame = 0;
    let clock: Animation | undefined;
    const animations: Animation[] = [];
    const from = progressRef.current;
    const to = exiting ? 1 : 0;
    const start = async () => {
      if (cancelled) return;
      const width = surface.offsetWidth;
      const height = surface.offsetHeight;
      const bounds = root.getBoundingClientRect();
      const dockX = Math.max(0, window.innerWidth - bounds.right) + 24;
      const dockY = Math.max(0, window.innerHeight - bounds.bottom) + 24;
      const count = Math.min(36, Math.max(16, Math.ceil(height / 32)));
      const fragment = document.createDocumentFragment();
      const slices: { element: HTMLDivElement; top: number; bottom: number }[] = [];
      const template = copySurface(surface, `genie-${crypto.randomUUID()}`);
      if (root.dataset.entered === 'true') {
        await snapshotCharts(surface, template);
      } else {
        // The entrance reveals the live chart after the handoff. Capturing an
        // invisible plot adds SVG serialization, PNG encoding, and two decodes
        // to the cold opening path without contributing any visible pixels.
        template
          .querySelectorAll('.bloom-ticket-detail-chart svg')
          .forEach((chart) => chart.remove());
      }
      if (cancelled) return;
      for (let index = 0; index < count; index++) {
        const top = (height * index) / count;
        // Subpixel overlap prevents hairline seams at fractional browser zoom.
        const bottom = Math.min(height, (height * (index + 1)) / count + 0.5);
        const element = document.createElement('div');
        element.className = styles.band;
        element.style.width = `${width}px`;
        element.style.height = `${bottom - top}px`;
        element.style.transform = bandTransform(width, height, top, bottom, dockX, dockY, 0);
        const copy = template.cloneNode(true) as HTMLDivElement;
        // Definitions in each slice need unique IDs (e.g. chart gradients).
        rebaseIds(copy, `genie-band-${index}-${crypto.randomUUID()}`);
        Object.assign(copy.style, {
          position: 'absolute',
          width: `${width}px`,
          height: `${height}px`,
          top: `${-top}px`,
          left: '0',
        });
        element.append(copy);
        fragment.append(element);
        slices.push({ element, top, bottom });
      }
      bands.replaceChildren(fragment);
      bands.querySelectorAll<HTMLElement>('[data-genie-scroll]').forEach((element) => {
        element.scrollTop = Number(element.dataset.genieScroll);
      });
      if (!exiting) {
        // Paint at the final resolution before shrinking to the dock. Starting
        // cold at a near-zero scale makes Chromium rasterize growing layers
        // during the entrance; closing already has full-size painted content.
        // A nonzero, imperceptible opacity prevents paint culling. Two frames
        // give the compositor one complete paint before starting the timeline.
        bands.style.opacity = '0.001';
        await new Promise<void>((resolve) => {
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => resolve());
          });
        });
        if (cancelled) return;
      }
      surface.style.opacity = '0';
      bands.style.opacity = '1';
      const progress = Array.from(
        { length: FRAMES + 1 },
        (_, index) => from + (to - from) * smooth(index / FRAMES),
      );
      for (const { element, top, bottom } of slices) {
        animations.push(
          element.animate(
            progress.map((value) => ({
              transform: bandTransform(width, height, top, bottom, dockX, dockY, value),
            })),
            { duration: DURATION, fill: 'both', easing: 'linear' },
          ),
        );
      }
      clock = bands.animate(
        progress.map((value) => ({ opacity: 1 - phase(0.94, 1, value) })),
        { duration: DURATION, fill: 'both', easing: 'linear' },
      );
      animations.push(clock);
      animations.push(
        shadow.animate(
          progress.map((value) => ({
            transform: `translate(${dockX * phase(0, 0.72, value)}px, ${dockY * phase(0, 0.42, value)}px) scale(${1 - phase(0, 0.72, value) * 0.65}, ${1 - phase(0.32, 1, value) * 0.9})`,
            opacity: 1 - phase(0.08, 0.72, value),
          })),
          { duration: DURATION, fill: 'both', easing: 'linear' },
        ),
      );
      void clock.finished
        .then(() => {
          if (cancelled) return;
          progressRef.current = to;
          if (!exiting) {
            root.dataset.entered = 'true';
            setEntered(true);
            surface.style.opacity = '1';
            shadow.style.opacity = '1';
            shadow.style.transform = 'none';
            bands.style.opacity = '0';
            bands.replaceChildren();
            animations.forEach((animation) => animation.cancel());
          }
        })
        .catch(() => {
          /* Interrupted transitions reverse from their current shape. */
        });
    };
    // Let the panel obtain its first layout before preparing the visual bands.
    if (exiting) start();
    else
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(start);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (clock && (clock.playState === 'running' || clock.playState === 'paused')) {
        progressRef.current =
          from + (to - from) * smooth(Number(clock.currentTime ?? 0) / DURATION);
      }
      animations.forEach((animation) => animation.cancel());
      bands.replaceChildren();
    };
  }, [exiting, reducedMotion]);

  return (
    <TicketGenieEnteredContext.Provider value={entered}>
      <div ref={rootRef} className={styles.genie}>
        <div
          ref={shadowRef}
          aria-hidden
          className={styles.shadow}
          style={{ opacity: reducedMotion ? 1 : 0 }}
        />
        <div ref={surfaceRef} className={styles.surface} style={{ opacity: reducedMotion ? 1 : 0 }}>
          {children}
        </div>
        <div ref={bandsRef} aria-hidden inert className={styles.bands} />
      </div>
    </TicketGenieEnteredContext.Provider>
  );
}
