import { SURFACE_BLUR_PX, SURFACE_RIM, SURFACE_SHEEN_CSS } from './shared';

/**
 * Paint only: the caller keeps its own root, layout, semantics and state.
 * Root must be positioned/isolated and transparent, with rounded clipping.
 * Both Surface and Button use these exact layers; state changes only their tint.
 *
 * Layers: a backdrop blur (`::before`), then tint + sheen + rim (`::after`).
 */
export function surfaceMaterialCss(selector: string, fill: string, transition = 'none'): string {
  return `
${selector}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  corner-shape: inherit;
  pointer-events: none;
}
${selector}::before {
  content: "";
  position: absolute;
  border-radius: inherit;
  corner-shape: inherit;
  pointer-events: none;
  z-index: -2;
  /* Inset to the pane bounds so the blurred layer cannot escape rounded clipping. */
  inset: 0;
  backdrop-filter: blur(${SURFACE_BLUR_PX}px);
  -webkit-backdrop-filter: blur(${SURFACE_BLUR_PX}px);
}
${selector}::after {
  z-index: -1;
  background-color: ${fill};
  background-image: var(--bloom-surface-sheen, ${SURFACE_SHEEN_CSS});
  box-shadow: var(--bloom-surface-rim, ${SURFACE_RIM});
  transition: ${transition};
}`;
}
