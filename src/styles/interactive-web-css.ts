/**
 * The one recipe every raw-DOM Bloom control's stylesheet is built from.
 *
 * `Button.web`, `Fab.web` and `FrostedIconButton.web` each render a real
 * `<button>` through react-dom, so their hover / focus / active / disabled
 * behaviour cannot live in an inline `style` object — inline styles have no
 * pseudo-classes. Each of them used to carry its own `STYLE_ID`, its own CSS
 * blob and its own `use*Css()` hook for what is, rule for rule, the same
 * stylesheet: the same reset, the same disabled block, the same
 * `:not(:disabled):not([aria-disabled="true"])` interactive filter, the same
 * press-scale `:active` transform and the same focus ring.
 *
 * What genuinely differs between them is small and is what this takes as
 * arguments: the class name, the custom-property namespace, the family's own
 * base declarations (layout, border, font), the transition list, WHICH property
 * hover changes, and the focus ring's offset.
 *
 * TWO RULES THAT MUST SURVIVE ANY EDIT HERE:
 *
 * - **The keyboard focus ring is `:focus-visible`, never `:focus`.** An
 *   always-on ring fires on mouse press as well, so every click leaves a ring
 *   behind on the control the user just pressed; `:focus-visible` is the
 *   selector browsers resolve against their own keyboard-vs-pointer heuristic,
 *   which is the behaviour a keyboard user needs and a mouse user does not see.
 * - **Injection goes through `adoptStyleSheet`, never a `<style>` element with
 *   text content.** A style element's contents are exactly what a page under
 *   `style-src 'self'` blocks, and it fails silently: the rules are dropped, the
 *   control renders with none of its CSS, nothing throws, and an id-based guard
 *   still finds the element and reports success.
 *
 * No react-native import — these forks render DOM and must not pull the RN
 * runtime in behind a stylesheet.
 */
import { useEffect } from 'react';

import { adoptStyleSheet } from './adopt-style-sheet';

/**
 * The filter every interactive rule carries: a control that is disabled by
 * either spelling reacts to nothing. Exported so a family-specific `extraRules`
 * can compose it instead of restating it and drifting.
 */
export const NOT_DISABLED = ':not(:disabled):not([aria-disabled="true"])';

export interface InteractiveWebCssOptions {
  /** Base class every rule is scoped to, e.g. `bloom-btn`. */
  className: string;
  /**
   * Namespace for the per-instance custom properties the component sets inline.
   * `bloom-btn` yields `--bloom-btn-ring` and `--bloom-btn-press-scale`.
   */
  varPrefix: string;
  /**
   * The family's own base declarations, appended after the shared reset — its
   * layout (`flex-direction`, `gap`, `padding`), border, font and anything else
   * that is not common to all three. A declaration here overrides the reset.
   */
  base: string;
  /** Value of the base rule's `transition` shorthand. */
  transition: string;
  /** The hover rule. */
  hover: {
    /** Extra selector filter appended after {@link NOT_DISABLED}, e.g. `:not([data-active="true"])`. */
    filter?: string;
    /** Declarations the hover state sets. */
    declarations: string;
  };
  /** `outline-offset` for the focus ring, in px. */
  outlineOffset: number;
  /** Rules appended verbatim, for a family-specific modifier class. */
  extraRules?: string;
}

/** Indent a declaration block to two spaces, dropping blank lines. */
function block(declarations: string): string {
  return declarations
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `  ${line}`)
    .join('\n');
}

/**
 * Build the stylesheet for one raw-DOM control family.
 *
 * Pure — the caller adopts the result, which is what makes it testable without
 * a DOM.
 */
export function interactiveWebCss({
  className,
  varPrefix,
  base,
  transition,
  hover,
  outlineOffset,
  extraRules,
}: InteractiveWebCssOptions): string {
  const c = `.${className}`;
  const interactive = `${c}${NOT_DISABLED}`;

  return `
${c} {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  cursor: pointer;
  user-select: none;
  outline: none;
${block(base)}
  transition: ${transition};
}
${c}:disabled,
${c}[aria-disabled="true"] {
  cursor: default;
  opacity: 0.5;
}
${interactive}${hover.filter ?? ''}:hover {
${block(hover.declarations)}
}
${interactive}:active {
  transform: scale(var(--${varPrefix}-press-scale, 1));
}
${c}:focus-visible {
  outline: 2px solid var(--${varPrefix}-ring, currentColor);
  outline-offset: ${outlineOffset}px;
}
${extraRules ? `${extraRules.trim()}\n` : ''}`;
}

/**
 * Adopt a control family's stylesheet once, on mount.
 *
 * `adoptStyleSheet` is idempotent and keyed by id, so every instance of a family
 * calling this results in one adopted sheet.
 */
export function useInteractiveWebCss(styleId: string, css: string): void {
  useEffect(() => {
    adoptStyleSheet(styleId, css);
  }, [styleId, css]);
}
