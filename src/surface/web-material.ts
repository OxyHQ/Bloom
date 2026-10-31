import { SURFACE_FILTER, SURFACE_LIGHTING } from './shared';

/**
 * The root attribute that turns transparency down, written by the theme provider's
 * `reduceTransparency` (`theme/apply-dark-class.ts`), beside the dark class.
 */
export const REDUCED_TRANSPARENCY_ATTRIBUTE = 'data-bloom-transparency';

/**
 * The root attribute that turns contrast up (`more`), written by the theme
 * provider's `increaseContrast` beside the transparency attribute. Increased
 * contrast reduces transparency as well, so the provider writes both.
 */
export const INCREASED_CONTRAST_ATTRIBUTE = 'data-bloom-contrast';

/**
 * The edge each host draws when contrast is increased, instead of the edge
 * light: a 1px line that holds 3:1 against its opaque body
 * (`surfaceContrastEdge`). `transparent` for a host that draws its own border.
 */
export const SURFACE_HAIRLINE_VAR = '--bloom-surface-hairline';

/**
 * A material host whose backdrop is known paints it baked
 * (`surface/baked-material.ts`): this attribute, set to `baked`, and its body
 * (the tint over the filtered backdrop) as one plain colour in
 * `--bloom-surface-baked-body`.
 */
export const BAKED_MATERIAL_ATTRIBUTE = 'data-bloom-material';
export const BAKED_BODY_VAR = '--bloom-surface-baked-body';

/**
 * `off` on the root keeps every material live: the measurement control for the
 * baked material's pixel and performance gates, never a second material.
 */
export const BAKE_OFF_ATTRIBUTE = 'data-bloom-material-bake';

/** Marks SurfacePaint's layer, which covers its host exactly. */
export const PAINT_LAYER_ATTRIBUTE = 'data-bloom-paint-layer';

/** The browser's own requests for more contrast; either one turns it up. */
const CONTRAST_MEDIA = ['(prefers-contrast: more)', '(forced-colors: active)'];

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
 * the hosts whose `::before` carries the body backdrop filter. A host is
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
 * The host keeps the material's existing circular corner geometry.
 *
 * Both layers take the host's own border radius, so they are exactly its shape.
 * `::before` is the material: the backdrop frosted, saturated, flattened and
 * brightened under the tint. `::after` paints the shared inset lighting: a fine
 * rim around the shape, a broad lit shoulder and an inner shade. The lighting
 * reads no backdrop, uses no mask and stays identical on a live or baked body.
 *
 * With transparency reduced (the provider's `reduceTransparency`, or the
 * system's `prefers-reduced-transparency`) neither layer filters the backdrop:
 * the body paints `solid` opaque and the decorative lighting is gone.
 *
 * With contrast increased (the provider's `increaseContrast`, or the system's
 * `prefers-contrast: more` or `forced-colors`) the body is the same opaque
 * colour, and the edge light becomes a plain 1px line in the host's
 * `--bloom-surface-hairline`, with no decorative shadow or backdrop filter.
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
  background-image: none;
  box-shadow: none;
}
${host}::after {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: none;
  filter: none;
  box-shadow: none;
}`;
  // Baked: only the body changes to one colour (a gradient would be dithered).
  // The same lighting layer paints above either body. `:where()` keeps the
  // specificity of the live rules, so reduced transparency and contrast win.
  const baked = `${selector}:where([${BAKED_MATERIAL_ATTRIBUTE}="baked"])`;
  const bakedLayers = `  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background-color: var(${BAKED_BODY_VAR});`;
  const contrast = (host: string) => `${reduced(host)}
${host}::after {
  border: 1px solid var(${SURFACE_HAIRLINE_VAR}, transparent);
}`;
  const presence = 'opacity var(--bloom-surface-presence-ms, 0ms) ease-out';
  const layerTransition = transition === 'none' ? presence : `${transition}, ${presence}`;
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
  box-shadow: var(--bloom-surface-lighting, ${SURFACE_LIGHTING});
}
${baked}::before {
${bakedLayers}
}
${reduced(`:root[${REDUCED_TRANSPARENCY_ATTRIBUTE}="reduced"] ${selector}`)}
@media (prefers-reduced-transparency: reduce) {
${reduced(selector)}
}
${contrast(`:root[${INCREASED_CONTRAST_ATTRIBUTE}="more"] ${selector}`)}
${CONTRAST_MEDIA.map((query) => `@media ${query} {\n${contrast(selector)}\n}`).join('\n')}`;
}
