/**
 * The mount harness the four commerce suites share.
 *
 * Every one of them asserts EMITTED DOM — an `aria-*` attribute, a computed
 * colour, whether a node exists at all — rather than the props it just passed,
 * so each renders through the real react-native-web. The mock has to be
 * installed by the SUITE (a `jest.mock` call is hoisted to the top of the file
 * it is written in and does not travel through an import), which is why this
 * module exports the harness and not the mock.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import type { Theme } from '../../theme/types';
import { useTheme } from '../../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let lastTheme: Theme | null = null;

function ThemeProbe() {
  lastTheme = useTheme();
  return null;
}

export function setupHarness(): void {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    lastTheme = null;
  });
}

export function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ThemeProbe />
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

export function theme(): Theme {
  if (!lastTheme) throw new Error('theme not captured');
  return lastTheme;
}

export function root$(): HTMLElement {
  return container;
}

export function byTestId(id: string): HTMLElement {
  const el = document.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

export function queryTestId(id: string): HTMLElement | null {
  return document.querySelector(`[data-testid="${id}"]`);
}

export function byLabel(label: string): HTMLElement {
  const el = document.querySelector(`[aria-label="${label}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element labelled "${label}"`);
  return el;
}

export function allByRole(role: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(`[role="${role}"]`)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
}

export function click(el: HTMLElement): void {
  act(() => {
    el.click();
  });
}

/** A colour as the DOM serialises it, for comparing against a computed style. */
export function css(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}
