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
 * Every family built from the shared recipe, with the style id each adopts and
 * the CSS selector its rules hang off.
 *
 * Three render a raw DOM `<button>` and hang off a class; `Chip` is a
 * react-native-web control, whose `className` is consumed by react-native-css
 * before any DOM class exists, so it hangs off a `data-*` attribute instead. The
 * assertions below are selector-agnostic on purpose — that difference is the
 * only one, and it must not become a second recipe.
 */
const FAMILIES = [
  {
    name: 'Button',
    styleId: 'bloom-button-web-css',
    selector: '.bloom-btn',
    varPrefix: 'bloom-btn',
    element: <Button>Go</Button>,
  },
  {
    name: 'Fab',
    styleId: 'bloom-fab-web-css',
    selector: '.bloom-fab',
    varPrefix: 'bloom-fab',
    element: <Fab accessibilityLabel="Compose" icon={<span />} />,
  },
  {
    name: 'FrostedIconButton',
    styleId: 'bloom-frosted-icon-button-web-css',
    selector: '.bloom-frosted-icon-btn',
    varPrefix: 'bloom-frosted',
    element: <FrostedIconButton accessibilityLabel="Back" icon={<span />} />,
  },
  {
    name: 'Chip',
    styleId: 'bloom-chip-web-css',
    selector: '[data-bloom-chip]',
    varPrefix: 'bloom-chip',
    element: <Chip onPress={() => {}}>Filter</Chip>,
  },
  {
    name: 'Checkbox',
    styleId: 'bloom-checkbox-web-css',
    selector: '[data-bloom-checkbox]',
    varPrefix: 'bloom-checkbox',
    element: <Checkbox checked={false} onCheckedChange={() => {}} label="Remember me" />,
  },
] as const;

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

    it('reads the press scale from the per-instance custom property', () => {
      expect(css()).toContain(`var(--${family.varPrefix}-press-scale`);
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
      expect(interactiveRules.length).toBeGreaterThanOrEqual(2);
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
      outlineOffset: 2,
    });
    expect(sheet).toContain(`.x${NOT_DISABLED}:not([data-active="true"]):hover`);
    // …and NOT the active rule: a selected control must still answer a press.
    expect(sheet).toContain(`.x${NOT_DISABLED}:active`);
    expect(sheet).not.toContain(`.x${NOT_DISABLED}:not([data-active="true"]):active`);
  });
});
