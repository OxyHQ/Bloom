import { SURFACE_EDGE_GLOW, SURFACE_FILTER, SURFACE_HIGHLIGHT_FILTER } from './shared';

/** Width of the edge line, in CSS px: the measured rim's reach. */
const EDGE_LINE_PX = 1.25;

/**
 * The edge line's strength, relative to the peak gain, as measured: full where the
 * border runs flat along the top and bottom (its first 1.25px of depth), about a
 * third once it curves into a corner, and gone before the corner turns vertical.
 * Measured by depth from the edge, so it holds for any radius, capsules included.
 */
const STRAIGHT = 0.75;
/**
 * The deepest a corner's light reaches, in CSS px: the measured profile is for a
 * 10–12px corner. Scaled to a capsule's end it would light half the side and read
 * as an outline, so on larger radii the light stops where it would on the tab.
 */
const CORNER_REACH_PX = 12;
const CORNER = 0.27;

/**
 * The root attribute that turns transparency down, written by the theme provider's
 * `reduceTransparency` (`theme/apply-dark-class.ts`), beside the dark class.
 */
export const REDUCED_TRANSPARENCY_ATTRIBUTE = 'data-bloom-transparency';

/**
 * The opaque body each host paints when transparency is reduced: the colour it
 * already publishes to the content on it (`--bloom-surface`), its tint
 * composited onto its parent. Every host sets it on itself, so none inherits an
 * enclosing surface's.
 */
const SURFACE_SOLID_VAR = '--bloom-surface-solid';

const MATERIAL_HOSTS = new Set<string>();

/**
 * Every selector the material has been painted on so far, as one selector list:
 * the hosts whose `::before`/`::after` carry a backdrop filter. A host is
 * registered the moment its CSS is built, which is before it can render, so
 * `use-surface-presence.ts` and the backdrop-root gates can find every material
 * host without a list of their own going stale.
 */
export function materialHostSelector(): string {
  return [...MATERIAL_HOSTS].join(', ');
}

/**
 * A surface appears and leaves by fading these layers (`--bloom-surface-presence`,
 * over `--bloom-surface-presence-ms`), never by fading its host: an ancestor with
 * `opacity` below 1 or a `filter` is where a backdrop filter stops seeing, so a
 * host that faded itself lost its blur for the whole fade and got it back at the end.
 *
 * Paint only: the caller keeps its own root, layout, semantics and state.
 * Root must be positioned/isolated and transparent, with rounded clipping that
 * leaves a pixel of margin (`overflow-clip-margin: 1px`) so the layers' own
 * antialiased edges are not cut by an aliased clip.
 *
 * The host's corners are always circular here: Chromium drops every mask inside
 * an element clipped with a non-round `corner-shape`, which would turn the edge
 * light into a flat brightening of the whole surface.
 *
 * Both layers take the host's own border radius, so they are exactly its shape.
 * `::before` is the material: the backdrop frosted, saturated, flattened and
 * brightened under the tint. `::after` brightens the backdrop again through a
 * mask: a line along the border (the box minus its padding box) kept near the top
 * and bottom, strongest where it runs flat and dimmer through each corner, plus
 * the glow within 8px of the top and bottom.
 *
 * With transparency reduced (the provider's `reduceTransparency`, or the
 * system's `prefers-reduced-transparency`) neither layer filters the backdrop:
 * the body paints `solid` opaque and the edge light is gone. That is the same
 * colour native paints, and on a slow GPU it is the difference between a
 * backdrop filter per surface every frame and none (measured on a Chromecast:
 * 7 fps with the filter, 16 without).
 */
export function surfaceMaterialCss(
  selector: string,
  fill: string,
  transition = 'none',
  solid = `var(${SURFACE_SOLID_VAR}, ${fill})`,
): string {
  MATERIAL_HOSTS.add(selector);
  const reduced = (host: string) => `${host}::before {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background-color: ${solid};
}
${host}::after {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}`;
  const presence = 'opacity var(--bloom-surface-presence-ms, 0ms) ease-out';
  const layerTransition = transition === 'none' ? presence : `${transition}, ${presence}`;
  const y = `min(var(--bloom-surface-corner-y, 16px), 50%, ${CORNER_REACH_PX}px)`;
  const strength = `linear-gradient(to bottom, rgba(0,0,0,${STRAIGHT}) 0, rgba(0,0,0,${STRAIGHT}) ${EDGE_LINE_PX}px, rgba(0,0,0,${CORNER}) ${2 * EDGE_LINE_PX}px, rgba(0,0,0,${CORNER}) calc(${y} * 0.58), transparent calc(${y} * 0.84), transparent calc(100% - ${y} * 0.84), rgba(0,0,0,${CORNER}) calc(100% - ${y} * 0.58), rgba(0,0,0,${CORNER}) calc(100% - ${2 * EDGE_LINE_PX}px), rgba(0,0,0,${STRAIGHT}) calc(100% - ${EDGE_LINE_PX}px), rgba(0,0,0,${STRAIGHT}) 100%)`;
  return `
${selector} {
  corner-shape: round !important;
}
${selector}::before,
${selector}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  corner-shape: inherit;
  pointer-events: none;
}
${selector}::before {
  z-index: -2;
  backdrop-filter: var(--bloom-surface-filter, ${SURFACE_FILTER});
  -webkit-backdrop-filter: var(--bloom-surface-filter, ${SURFACE_FILTER});
  background-color: ${fill};
  opacity: var(--bloom-surface-presence, 1);
  transition: ${layerTransition};
}
${selector}::after {
  z-index: -1;
  opacity: var(--bloom-surface-presence, 1);
  transition: ${presence};
  box-sizing: border-box;
  border: ${EDGE_LINE_PX}px solid transparent;
  backdrop-filter: var(--bloom-surface-highlight-filter, ${SURFACE_HIGHLIGHT_FILTER});
  -webkit-backdrop-filter: var(--bloom-surface-highlight-filter, ${SURFACE_HIGHLIGHT_FILTER});
  mask-image: var(--bloom-surface-edge-glow, ${SURFACE_EDGE_GLOW}), ${strength},
    linear-gradient(#000 0 0), linear-gradient(#000 0 0);
  mask-clip: border-box, border-box, padding-box, border-box;
  mask-origin: border-box;
  mask-composite: add, intersect, exclude;
}
${reduced(`:root[${REDUCED_TRANSPARENCY_ATTRIBUTE}="reduced"] ${selector}`)}
@media (prefers-reduced-transparency: reduce) {
${reduced(selector)}
}`;
}
