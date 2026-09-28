import { useEffect } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const SURFACE_REFRACTION_ID = 'bloom-surface-refraction-v1';
const ROOT_ID = `${SURFACE_REFRACTION_ID}-defs`;

const PRIMITIVES: ReadonlyArray<readonly [string, Record<string, string>]> = [
  ['feTurbulence', {
    type: 'fractalNoise', baseFrequency: '0.01 0.01', numOctaves: '1',
    seed: '8', result: 'noise',
  }],
  ['feGaussianBlur', { in: 'noise', stdDeviation: '3', result: 'smooth-noise' }],
  ['feDisplacementMap', {
    in: 'SourceGraphic', in2: 'smooth-noise', scale: '150',
    xChannelSelector: 'R', yChannelSelector: 'G',
  }],
];
// HMR updates this automatically when the recipe changes; mounted pages need
// no manual reload and unchanged mounts never rebuild the definition.
const FILTER_ATTRIBUTES = {
  x: '0', y: '0', width: '100%', height: '100%',
  'color-interpolation-filters': 'sRGB',
};
const RECIPE = JSON.stringify({ primitives: PRIMITIVES, attributes: FILTER_ATTRIBUTES });

/**
 * One static filter per document, retained across mounts and StrictMode effects.
 * No per-surface SVG, observer, canvas, pointer listener or animation loop.
 * This touches the DOM only after mount, so importing/rendering on the server
 * needs no browser globals. Existing markup also deduplicates multiple bundles.
 */
export function ensureSurfaceRefraction(doc: Document): void {
  const existing = doc.getElementById(ROOT_ID);
  if (existing?.getAttribute('data-recipe') === RECIPE) return;
  existing?.remove();
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.id = ROOT_ID;
  svg.setAttribute('data-recipe', RECIPE);
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  // Avoid display:none: some engines do not resolve hidden SVG filters.
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.style.overflow = 'hidden';
  const defs = doc.createElementNS(SVG_NS, 'defs');
  const filter = doc.createElementNS(SVG_NS, 'filter');
  const append = (tag: string, attributes: Record<string, string>) => {
    const element = doc.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    filter.appendChild(element);
  };
  filter.id = SURFACE_REFRACTION_ID;
  for (const [key, value] of Object.entries(FILTER_ATTRIBUTES)) filter.setAttribute(key, value);
  for (const [tag, attributes] of PRIMITIVES) append(tag, attributes);
  defs.appendChild(filter);
  svg.appendChild(defs);
  doc.body?.appendChild(svg);
}

export function useSurfaceRefraction(enabled: boolean): void {
  useEffect(() => {
    if (enabled && typeof document !== 'undefined') ensureSurfaceRefraction(document);
  }, [enabled, RECIPE]);
}
