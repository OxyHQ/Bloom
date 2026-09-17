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
 * It grew because it was not being used. Thirty-odd families called only
 * `useInteractiveWebCss()` — the two-line adopter — and hand-wrote the sheet it
 * was supposed to build, which is exactly why rings, hovers and disabled states
 * drifted: three focus-ring mechanisms in one package, a `#FFFFFF` ring gap
 * baked into a dark-mode component, and disabled opacity at 0.4, 0.5 and 0.6.
 * The options below therefore cover what those callers actually needed — a
 * hover fill, a pressed fill, a disabled block and a focus ring whose GAP comes
 * from the surface — so that hand-writing one is a decision rather than the
 * default. **This is THE way to build a raw-DOM or `dataSet`-hooked control's
 * stylesheet in Bloom.**
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
import { DISABLED_OPACITY } from './tokens';

/**
 * The custom property every Bloom focus ring reads its GAP colour from.
 *
 * Three ring mechanisms existed: the canonical `outline` + `outline-offset`, a
 * two-step `box-shadow` whose gap was the literal `#FFFFFF`, and an inset
 * shadow. The literal is the one that broke — `ring-offset-color` defaults to
 * white in Tailwind and was never overridden, so in DARK mode a focused filter
 * chip, filter text button, stepper value or slider thumb drew a 2px white halo
 * against a near-black page. A gap is meant to be a hole in the ring, and a hole
 * is the colour of whatever is behind it.
 *
 * So the gap is a variable, set inline from the surface the control sits on
 * (`useRingOffsetStyle()` in `styles/surface-levels.ts`). The fallback below is
 * only for a control that sets nothing.
 */
export const RING_OFFSET_VAR = '--bloom-ring-offset';

/** What the gap falls back to when nothing sets {@link RING_OFFSET_VAR}. */
export const RING_OFFSET_FALLBACK = '#FFFFFF';

/** The two-step ring: a `gap`px hole in the surface colour, then a `width`px ring. */
export interface FocusRingSpec {
  /**
   * `outline` is the canonical recipe — a real `outline` with `outline-offset`,
   * which follows a rounded corner and never joins the paint. `ring` is the
   * `box-shadow` form, for a control whose ring must sit on a CHILD element (a
   * slider thumb, a checkbox glyph) where an outline on the focusable ancestor
   * would draw round the wrong box.
   */
  mode?: 'outline' | 'ring';
  /** The gap, in px, between the control's edge and the ring. */
  offset?: number;
  /** The ring's own thickness, in px. */
  width?: number;
}

/**
 * The `box-shadow` value of a `ring`-mode focus ring.
 *
 * `ringVar` is the full custom-property name the family already sets inline for
 * its accent, e.g. `--bloom-stepper-ring`. Anything in `extra` is appended, for
 * a control that also carries a resting shadow the ring must not erase.
 */
export function focusRingShadow(
  ringVar: string,
  { offset = 2, width = 2 }: FocusRingSpec = {},
  extra?: string,
): string {
  const gap = `0 0 0 ${offset}px var(${RING_OFFSET_VAR}, ${RING_OFFSET_FALLBACK})`;
  const ring = `0 0 0 ${offset + width}px var(${ringVar}, currentColor)`;
  return extra ? `${gap}, ${ring}, ${extra}` : `${gap}, ${ring}`;
}

/**
 * The filter every interactive rule carries: a control that is disabled by
 * either spelling reacts to nothing. Exported so a family-specific `extraRules`
 * can compose it instead of restating it and drifting.
 */
export const NOT_DISABLED = ':not(:disabled):not([aria-disabled="true"])';

export interface InteractiveWebCssOptions {
  /**
   * The CSS selector every rule is scoped to, written in full: `.bloom-btn` for
   * a raw-DOM fork that renders its own class, `[data-bloom-chip]` for a
   * react-native-web control that cannot.
   *
   * A full selector rather than a bare class name because the two kinds of
   * caller cannot both use a class. A raw-DOM fork sets `className` on a real
   * element and gets one; a react-native-web component's `className` is consumed
   * by react-native-css and mapped into `style`, so no class ever reaches the
   * DOM. An attribute is the hook that IS available to it, and the interactive
   * rules are identical either way — only the thing they hang off differs.
   */
  selector: string;
  /**
   * Namespace for the per-instance custom properties the component sets inline.
   * `bloom-btn` yields `--bloom-btn-ring` and `--bloom-btn-press-scale`.
   */
  varPrefix: string;
  /**
   * `button` (the default) emits the `<button>` reset — `appearance`,
   * `display: inline-flex`, `cursor`, `user-select`. It is right for a raw-DOM
   * fork and WRONG for a react-native-web control: RNW lays a `View` out with
   * `display: flex`, so `inline-flex` from a stylesheet silently changes how the
   * control participates in its parent's layout. A `dataSet`-hooked caller
   * passes `none` and keeps its geometry in the inline style, where RNW can see
   * it on native too.
   */
  reset?: 'button' | 'none';
  /**
   * The family's own base declarations, appended after the shared reset — its
   * layout (`flex-direction`, `gap`, `padding`), border, font and anything else
   * that is not common to all three. A declaration here overrides the reset.
   * Optional: a control whose geometry lives entirely in its inline style (every
   * react-native-web one does, so native gets it too) has nothing to put here.
   */
  base?: string;
  /** Value of the base rule's `transition` shorthand. */
  transition: string;
  /**
   * The hover rule. Optional: a react-native-web control gets `onHoverIn` in JS
   * and paints hover through its inline style, so it has no hover rule to emit —
   * and a CSS one would then be a second source of truth for the same state.
   */
  hover?: {
    /** Extra selector filter appended after {@link NOT_DISABLED}, e.g. `:not([data-active="true"])`. */
    filter?: string;
    /** Declarations the hover state sets. */
    declarations: string;
  };
  /**
   * Extra declarations for the `:active` rule, ALONGSIDE the press scale.
   *
   * Appended to the one existing `:active` rule rather than emitted as a second
   * one, so the held state stays a single declaration block with a single
   * specificity — two rules for one state is how a press ends up half-applied
   * depending on which selector happens to win.
   */
  pressDeclarations?: string;
  /**
   * Whether to emit the `:active` press-scale rule. Defaults to true for the
   * `button` reset and false for `none` — Bloom's controls change COLOUR on
   * press, and the scale exists only for the three raw-DOM forks that shipped
   * with it.
   */
  pressScale?: boolean;
  /**
   * `outline-offset` for the focus ring, in px — shorthand for `focus.offset`.
   * Defaults to 2, the canonical gap.
   */
  outlineOffset?: number;
  /**
   * The focus ring, when the family needs the `ring` form or a thicker ring.
   * Omitted, it is `{ mode: 'outline', offset: outlineOffset }` — the canonical
   * recipe, unchanged.
   */
  focus?: FocusRingSpec;
  /**
   * The disabled block. Omitted, the control takes `cursor: default` and
   * {@link DISABLED_OPACITY}.
   *
   * `opacity: null` opts a family OUT of the opacity convention — for a control
   * that RECOLOURS when disabled (`Button` does, by token) and must not also
   * fade, which would apply the dimming twice.
   */
  disabled?: { opacity?: number | null; declarations?: string };
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
  selector,
  varPrefix,
  reset = 'button',
  base = '',
  transition,
  hover,
  pressDeclarations,
  pressScale = reset === 'button',
  outlineOffset,
  focus,
  disabled,
  extraRules,
}: InteractiveWebCssOptions): string {
  const c = selector;
  const interactive = `${c}${NOT_DISABLED}`;
  const resetDeclarations =
    reset === 'button'
      ? `  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  cursor: pointer;
  user-select: none;
  outline: none;
`
      : `  cursor: pointer;
  outline: none;
`;
  const ring: FocusRingSpec = { mode: 'outline', offset: outlineOffset ?? 2, width: 2, ...focus };
  const focusDeclarations =
    ring.mode === 'ring'
      ? `box-shadow: ${focusRingShadow(`--${varPrefix}-ring`, ring)};`
      : `outline: 2px solid var(--${varPrefix}-ring, currentColor);\n  outline-offset: ${ring.offset ?? 0}px;`;
  const disabledOpacity = disabled?.opacity === undefined ? DISABLED_OPACITY : disabled.opacity;

  const pressRule =
    pressScale || pressDeclarations
      ? `${interactive}:active {
${pressScale ? `  transform: scale(var(--${varPrefix}-press-scale, 1));\n` : ''}${pressDeclarations ? `${block(pressDeclarations)}\n` : ''}}
`
      : '';

  return `
${c} {
${resetDeclarations}${base.trim() ? `${block(base)}\n` : ''}  transition: ${transition};
}
${c}:disabled,
${c}[aria-disabled="true"] {
  cursor: default;
${disabledOpacity === null ? '' : `  opacity: ${disabledOpacity};\n`}${disabled?.declarations ? `${block(disabled.declarations)}\n` : ''}}
${
  hover
    ? `${interactive}${hover.filter ?? ''}:hover {
${block(hover.declarations)}
}
`
    : ''
}${pressRule}${c}:focus-visible {
  ${focusDeclarations}
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
