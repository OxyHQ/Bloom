import { SURFACE_RIM, SURFACE_SHEEN_CSS } from './shared';
import { SURFACE_REFRACTION_ID } from './web-refraction';

/**
 * Paint only: the caller keeps its own root, layout, semantics and state.
 * Root must be positioned/isolated and transparent, with rounded clipping.
 * Both Surface and Button use these exact layers; state changes only their tint.
 */
export function surfaceMaterialCss(selector: string, fill: string, transition = 'none'): string {
  return `
${selector}::before,
${selector}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
${selector}::before {
  z-index: -2;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  filter: url(#${SURFACE_REFRACTION_ID});
}
${selector}::after {
  z-index: -1;
  background-color: ${fill};
  background-image: ${SURFACE_SHEEN_CSS};
  box-shadow: ${SURFACE_RIM};
  transition: ${transition};
}`;
}
