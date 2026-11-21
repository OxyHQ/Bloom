import { Platform } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';

/**
 * A theme switch never plays a colour transition (docs/motion.mdx, Colours).
 *
 * Web: the theme's colours are CSS variables the provider writes on the
 * document, so a switch reaches no React render of the views that paint with
 * them. A host whose colours transition (`transitionStyle(timing, true)`)
 * carries `COLOR_TRANSITION_PROPS`, and the provider applies a switch through
 * `applyThemeAtOnce`: while the document is marked, a marked host transitions
 * only its transform and opacity, so its colours take their new values when the
 * browser computes the new style; once unmarked, no colour changed, so none
 * plays. Native colours are props a render changes: the view that transitions
 * them leaves them out of its transition on the render a switch makes (the
 * Bloom language's motion node).
 */
const HOST_ATTRIBUTE = 'data-bloom-color-transition';
const SWITCH_ATTRIBUTE = 'data-bloom-theme-switch';
const SHEET_ID = 'bloom-theme-switch';
const SHEET_CSS = `html[${SWITCH_ATTRIBUTE}] [${HOST_ATTRIBUTE}]{transition-property:transform,opacity!important}`;

/** Web: what a host whose colours transition carries (`data-bloom-color-transition`). Native: nothing. */
export const COLOR_TRANSITION_PROPS: Readonly<Record<string, unknown>> | undefined =
  Platform.OS === 'web'
    ? Object.freeze({ dataSet: Object.freeze({ bloomColorTransition: '' }) })
    : undefined;

/**
 * Applies a theme to the document so that no colour transition plays it: the
 * mark is up while the browser computes the new style (reading the root's
 * layout computes it for the whole document), and down after. With no host that
 * transitions its colours, it only applies. Native: it only applies.
 */
export function applyThemeAtOnce(apply: () => void): void {
  if (
    Platform.OS !== 'web' ||
    typeof document === 'undefined' ||
    document.querySelector(`[${HOST_ATTRIBUTE}]`) === null
  ) {
    apply();
    return;
  }
  adoptStyleSheet(SHEET_ID, SHEET_CSS);
  const root = document.documentElement;
  root.setAttribute(SWITCH_ATTRIBUTE, '');
  try {
    apply();
    void root.offsetWidth;
  } finally {
    root.removeAttribute(SWITCH_ATTRIBUTE);
  }
}
