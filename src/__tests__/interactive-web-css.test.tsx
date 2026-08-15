/**
 * @jest-environment jsdom
 */

/**
 * The shared recipe behind every raw-DOM Bloom control's stylesheet.
 *
 * Three families used to carry a private copy of it. What made that expensive is
 * not the duplication itself but that a rule can be WRONG in one copy and right
 * in the other two with nothing to notice: a `:focus` where `:focus-visible` was
 * meant leaves a ring behind after every mouse click, and a hover rule missing
 * `:not([aria-disabled="true"])` makes a disabled control light up under the
 * pointer. Both render fine, neither throws, and nothing snapshots injected CSS.
 *
 * So this asserts the invariants that must hold for EVERY family, by mounting
 * the three real components rather than calling the builder with a fixture — a
 * fixture would keep passing after a family stopped using the builder at all.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Button } from '../button/Button.web';
import { Checkbox } from '../checkbox';
import { Chip } from '../chip';
import { Fab } from '../fab/Fab.web';
import { FrostedIconButton } from '../frosted-icon-button/FrostedIconButton.web';
import { NOT_DISABLED, interactiveWebCss } from '../styles/interactive-web-css';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Every family built from the shared recipe, with the style id each adopts, the
 * CSS selector its rules hang off, and WHERE its held state lives.
 *
 * Three render a raw DOM `<button>` and hang off a class; `Chip` and `Checkbox`
 * are react-native-web controls, whose `className` is consumed by
 * react-native-css before any DOM class exists, so they hang off a `data-*`
 * attribute instead. The assertions below are selector-agnostic on purpose —
 * that difference must not become a second recipe.
 *
 * `press` is the second, deeper split, and it is not cosmetic. A raw-DOM fork
 * has no JS press state at all, so its `:active` rule IS its press: dropping it
 * removes the feedback silently. A react-native-web control drives the same
 * colour from `useInteractionState` on both platforms, and react-native-web
 * writes that as an inline style — which outranks an adopted sheet in BOTH
 * directions, making a `:active` rule there dead while they agree and wrong in
 * the one frame they do not. So each family is asserted against the mechanism it
 * actually uses, and against the ABSENCE of the other one.
 */
const FAMILIES = [
  {
    name: 'Button',
    styleId: 'bloom-button-web-css',
    selector: '.bloom-btn',
    varPrefix: 'bloom-btn',
    press: 'css',
    element: <Button>Go</Button>,
  },
  {
    name: 'Fab',
    styleId: 'bloom-fab-web-css',
    selector: '.bloom-fab',
    varPrefix: 'bloom-fab',
    press: 'css',
    element: <Fab accessibilityLabel="Compose" icon={<span />} />,
  },
  {
    name: 'FrostedIconButton',
    styleId: 'bloom-frosted-icon-button-web-css',
    selector: '.bloom-frosted-icon-btn',
    varPrefix: 'bloom-frosted',
    press: 'css',
    element: <FrostedIconButton accessibilityLabel="Back" icon={<span />} />,
  },
  {
    name: 'Chip',
    styleId: 'bloom-chip-web-css',
    selector: '[data-bloom-chip]',
    varPrefix: 'bloom-chip',
    press: 'js',
    element: <Chip onPress={() => {}}>Filter</Chip>,
  },
  {
    name: 'Checkbox',
    styleId: 'bloom-checkbox-web-css',
    selector: '[data-bloom-checkbox]',
    varPrefix: 'bloom-checkbox',
    press: 'js',
    element: <Checkbox checked={false} onCheckedChange={() => {}} label="Remember me" />,
  },
] as const;

/** Exactly the families whose press is CSS, so neither list can drift silently. */
const CSS_PRESS_FAMILIES = FAMILIES.filter((f) => f.press === 'css');

it('splits the five families between the two press mechanisms, with both non-empty', () => {
  expect(CSS_PRESS_FAMILIES).toHaveLength(3);
  expect(FAMILIES.filter((f) => f.press === 'js')).toHaveLength(2);
});

/** Escape a selector for use inside a `RegExp`. */
const escapeSelector = (selector: string): string =>
  selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function mountAndReadCss(element: React.ReactElement, styleId: string): string {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root | undefined;
  act(() => {
    root = createRoot(container);
    root.render(<BloomThemeProvider mode="light">{element}</BloomThemeProvider>);
  });
  const css = document.getElementById(styleId)?.textContent ?? '';
  act(() => root?.unmount());
  container.remove();
  return css;
}

/** The `style` attribute the family writes onto its own root element. */
function mountAndReadInlineStyle(element: React.ReactElement, selector: string): string {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root | undefined;
  act(() => {
    root = createRoot(container);
    root.render(<BloomThemeProvider mode="light">{element}</BloomThemeProvider>);
  });
  const attribute = container.querySelector(selector)?.getAttribute('style') ?? '';
  act(() => root?.unmount());
  container.remove();
  return attribute;
}

/** Every CSS property name a `:hover` or `:active` rule in `css` declares. */
function propertiesTouchedByInteractiveRules(css: string): string[] {
  const found = new Set<string>();
  // Each rule is `selector {\n  decl;\n  decl;\n}` — the builder emits exactly
  // that shape, one declaration per line.
  const rules = css.split('}');
  for (const rule of rules) {
    const [selector, body] = rule.split('{');
    if (!selector || !body) continue;
    if (!selector.includes(':hover') && !selector.includes(':active')) continue;
    for (const line of body.split('\n')) {
      const name = line.split(':')[0]?.trim();
      if (name) found.add(name);
    }
  }
  return [...found];
}

/**
 * Specificity of a selector, as the (class, attribute, pseudo-class) count that
 * decides CSS's second cascade tier. Only the shapes this builder emits are
 * handled — a class, attribute selectors, `:not()` wrappers and pseudo-classes —
 * which is why it counts occurrences rather than parsing. `:not()` is
 * deliberately NOT free: it contributes its argument's specificity, and that is
 * exactly the rule that made a hover selector outrank a press one here.
 */
function specificity(selector: string): number {
  const classes = (selector.match(/\.[a-z0-9-]+/gi) ?? []).length;
  const attributes = (selector.match(/\[[^\]]+\]/g) ?? []).length;
  // Every `:x` that is not the head of a `:not(` wrapper — the wrapper itself
  // adds nothing, its contents already counted above or here.
  const pseudos = (selector.match(/:(?!not\()[a-z-]+/gi) ?? []).length;
  return classes + attributes + pseudos;
}

describe('interactiveWebCss', () => {
  describe.each(FAMILIES)('$name', (family) => {
    const css = (): string => mountAndReadCss(family.element, family.styleId);

    // Vacuity floor. Every assertion below reads a substring out of this string;
    // an empty one would make the `not.toMatch` case pass for the wrong reason.
    it('adopts a non-empty sheet under its own id', () => {
      const sheet = css();
      expect(sheet.length).toBeGreaterThan(200);
      expect(sheet).toContain(`${family.selector} {`);
    });

    it('rings the keyboard focus with :focus-visible, never a bare :focus', () => {
      const sheet = css();
      expect(sheet).toContain(`${family.selector}:focus-visible`);
      // A bare `:focus` rule fires on mouse press too, stranding a ring on every
      // clicked control — the reason this selector is not a free choice.
      expect(sheet).not.toMatch(new RegExp(`${escapeSelector(family.selector)}:focus[^-]`));
      expect(sheet).toContain(`var(--${family.varPrefix}-ring`);
    });

    it('never scales anything — the press is a colour, on every family', () => {
      const sheet = css();
      // Not `not.toContain('scale(')` alone: a `scale(1)` reads as "no scale"
      // while meaning the mechanism is still wired and merely neutral, which is
      // exactly how this could come back. Nothing here may mention `transform`
      // or the custom property the scale was read from at all.
      expect(sheet).not.toContain('transform');
      expect(sheet).not.toContain('press-scale');
      expect(sheet).not.toContain('scale(');
    });

    it('answers a press through the mechanism its platform actually uses', () => {
      const sheet = css();
      const activeRule = `${family.selector}${NOT_DISABLED}:active`;
      if (family.press === 'css') {
        expect(sheet).toContain(activeRule);
        expect(sheet).toContain(`background-color: var(--${family.varPrefix}-press-bg)`);
      } else {
        // A react-native-web control states its held colour in JS. A rule here
        // would be dead at best — see the FAMILIES note.
        expect(sheet).not.toContain(':active');
      }
    });

    it('excuses a control disabled by EITHER spelling from every interactive rule', () => {
      const sheet = css();
      // react-dom sets `disabled` on a real <button>; a caller can also mark one
      // `aria-disabled`. A rule filtering on one alone lets the other react.
      const interactiveRules = sheet
        .split('\n')
        .filter(
          (line) =>
            line.startsWith(family.selector) &&
            (line.includes(':hover') || line.includes(':active')),
        );
      // The `:active` count is EXACT — one for a CSS-press family, none for a
      // JS one — because that is the number a silent regression moves. Hover
      // stays a floor because a family may legitimately add its own (`Button`'s
      // `--link` underline rule is a second hover rule and always has been).
      expect(interactiveRules.filter((rule) => rule.includes(':active'))).toHaveLength(
        family.press === 'css' ? 1 : 0,
      );
      expect(interactiveRules.filter((rule) => rule.includes(':hover')).length).toBeGreaterThanOrEqual(
        1,
      );
      for (const rule of interactiveRules) {
        expect(rule).toContain(':not(:disabled)');
        expect(rule).toContain(':not([aria-disabled="true"])');
      }
    });

    it('dims and un-points a disabled control', () => {
      const sheet = css();
      expect(sheet).toContain(`${family.selector}[aria-disabled="true"]`);
      expect(sheet).toMatch(/opacity:\s*0\.5/);
    });

    // ── The two ways an interactive rule is present and UNREACHABLE ──────────
    //
    // Both were live in this file's own three families, both were invisible to
    // every existing assertion here (the CSS text was correct in each case), and
    // both were found only by pressing the real control in a real browser. They
    // are asserted here so the browser gate is a confirmation rather than the
    // only instrument. Companion: `scripts/verify-press-feedback.mjs`.

    if (family.press === 'css') {
      it('never writes inline a property its own hover/active rules change', () => {
        // An inline declaration outranks EVERY rule in an adopted stylesheet, so
        // a fork that writes its rest fill inline silences its own `:hover` and
        // `:active` rules for that property. Measured: `Button`'s press,
        // `Fab`'s hover lift and `FrostedIconButton`'s hover pair were all dead
        // this way, with the rules present and the variables resolving.
        //
        // Scoped to the raw-DOM families because they own their `style`
        // attribute outright; the react-native-web ones have RNW in between and
        // state their held colour in JS, which the case above pins.
        const inline = mountAndReadInlineStyle(family.element, family.selector);
        const touched = propertiesTouchedByInteractiveRules(css());
        expect(touched.length).toBeGreaterThan(0);
        for (const property of touched) {
          // A CUSTOM property of the same name cannot collide, and is in fact
          // how the value is meant to arrive — match the bare declaration only.
          expect(inline).not.toMatch(new RegExp(`(^|;)\\s*${property}\\s*:`));
        }
        // Vacuity floor: the element IS styled inline, so the misses above are
        // about these properties and not about an element that never mounted.
        expect(inline.length).toBeGreaterThan(20);
      });

      it('gives :active at least the specificity of :hover, so a held control wins', () => {
        // A press is always also a hover, so the two rules always compete. They
        // are ordered by SOURCE only when their specificity ties — and `:not()`
        // is not free: one extra `:not([data-active="true"])` on the hover
        // selector put it a full step above `:active` and the press did nothing.
        const sheet = css();
        const selectors = sheet
          .split('\n')
          .filter((line) => line.trim().endsWith('{') && line.startsWith(family.selector));
        const hover = selectors.filter((s) => s.includes(':hover'));
        const active = selectors.filter((s) => s.includes(':active'));
        expect(active).toHaveLength(1);
        expect(hover.length).toBeGreaterThan(0);
        const activeWeight = specificity(active[0] ?? '');
        for (const rule of hover) {
          expect(activeWeight).toBeGreaterThanOrEqual(specificity(rule));
        }
      });
    }
  });

  it("appends a family's own rules verbatim, composing the shared filter", () => {
    const sheet = interactiveWebCss({
      selector: '.x',
      varPrefix: 'x',
      base: 'color: red;',
      transition: 'none',
      hover: { declarations: 'opacity: 0.9;' },
      outlineOffset: 2,
      extraRules: `.x--link${NOT_DISABLED}:hover { text-decoration: underline; }`,
    });
    expect(sheet).toContain('.x--link:not(:disabled):not([aria-disabled="true"]):hover');
  });

  it('an extra hover filter narrows only the hover rule', () => {
    const sheet = interactiveWebCss({
      selector: '.x',
      varPrefix: 'x',
      base: 'color: red;',
      transition: 'none',
      hover: { filter: ':not([data-active="true"])', declarations: 'opacity: 0.9;' },
      press: { declarations: 'background-color: var(--x-press-bg);' },
      outlineOffset: 2,
    });
    expect(sheet).toContain(`.x${NOT_DISABLED}:not([data-active="true"]):hover`);
    // …and NOT the active rule: a selected control must still answer a press.
    // This is `FrostedIconButton`'s exact shape — hover skips the active state
    // so a selected chip is not repainted as unselected, while press does not,
    // because a selected control that answers nothing reads as broken.
    expect(sheet).toContain(`.x${NOT_DISABLED}:active`);
    expect(sheet).not.toContain(`.x${NOT_DISABLED}:not([data-active="true"]):active`);
  });

  it('omits the :active rule entirely for a family that states no press', () => {
    // The `Chip`/`Checkbox` shape. Emitting an empty rule, or one reading an
    // undefined custom property, would be worse than omitting it: an
    // unresolvable `var()` makes `background-color` invalid at computed-value
    // time, which computes to the INITIAL value — a control that turns
    // transparent under the finger.
    const sheet = interactiveWebCss({
      selector: '.x',
      varPrefix: 'x',
      base: 'color: red;',
      transition: 'none',
      hover: { declarations: 'opacity: 0.9;' },
      outlineOffset: 2,
    });
    expect(sheet).not.toContain(':active');
    // Vacuity floor: the builder did run and did emit its other rules.
    expect(sheet).toContain(`.x${NOT_DISABLED}:hover`);
  });
});
