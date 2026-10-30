/** @jest-environment jsdom */
/**
 * Increased contrast on the web: the provider's prop and the browser's
 * `prefers-contrast` / `forced-colors` / `prefers-reduced-transparency` reach
 * the document attributes and the hooks; the material CSS turns the edge light
 * into each host's own hairline; every host sets that hairline on itself.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Platform } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useReducedTransparency } from '../theme/reduced-transparency';
import { useIncreasedContrast } from '../theme/increased-contrast';
import { Surface } from '../surface/Surface.web';
import { SurfacePaint } from '../surface/SurfacePaint';
import { Button } from '../button/Button.web';
import {
  INCREASED_CONTRAST_ATTRIBUTE,
  REDUCED_TRANSPARENCY_ATTRIBUTE,
  SURFACE_HAIRLINE_VAR,
  surfaceMaterialCss,
} from '../surface/web-material';
import { SURFACE_CONTRAST_EDGE_RATIO } from '../surface/shared';
import { contrastRatio } from '../styles/color-contrast';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalOS = Platform.OS;
const originalMatchMedia = window.matchMedia;
let matching = new Set<string>();
const changeListeners = new Set<() => void>();
let root: Root;
let container: HTMLElement;

function media(next: string[]) {
  matching = new Set(next);
  for (const listener of changeListeners) listener();
}

beforeEach(() => {
  Platform.OS = 'web';
  matching = new Set();
  changeListeners.clear();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matching.has(query);
    },
    media: query,
    addEventListener: (_: string, listener: () => void) => changeListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => changeListeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.removeAttribute(REDUCED_TRANSPARENCY_ATTRIBUTE);
  document.documentElement.removeAttribute(INCREASED_CONTRAST_ATTRIBUTE);
  window.matchMedia = originalMatchMedia;
  Platform.OS = originalOS;
});

let seen = '';
function Probe() {
  seen = `${useReducedTransparency()}/${useIncreasedContrast()}`;
  return null;
}

const attributes = () => [
  document.documentElement.getAttribute(REDUCED_TRANSPARENCY_ATTRIBUTE),
  document.documentElement.getAttribute(INCREASED_CONTRAST_ATTRIBUTE),
];

it('marks the document for increased contrast, and reduces transparency with it', () => {
  act(() =>
    root.render(
      <BloomThemeProvider increaseContrast fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    ),
  );
  expect(attributes()).toEqual(['reduced', 'more']);
  expect(seen).toBe('true/true');
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    ),
  );
  expect(attributes()).toEqual([null, null]);
  expect(seen).toBe('false/false');
});

it("follows the browser's media queries from the first render and as they change", () => {
  media(['(prefers-reduced-transparency: reduce)']);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    ),
  );
  expect(seen).toBe('true/false');
  expect(attributes()).toEqual(['reduced', null]);
  act(() => media(['(forced-colors: active)']));
  expect(seen).toBe('true/true');
  act(() => media(['(prefers-contrast: more)']));
  expect(seen).toBe('true/true');
  act(() => media([]));
  expect(seen).toBe('false/false');
  expect(attributes()).toEqual([null, null]);
});

describe('the material CSS', () => {
  const css = surfaceMaterialCss('.host', 'var(--fill)');

  it('turns the edge light into the host hairline under the attribute and both media queries', () => {
    for (const scope of [
      `:root[${INCREASED_CONTRAST_ATTRIBUTE}="more"] .host::after`,
      '@media (prefers-contrast: more)',
      '@media (forced-colors: active)',
    ])
      expect(css).toContain(scope);
    const rule = css.slice(
      css.indexOf(`:root[${INCREASED_CONTRAST_ATTRIBUTE}="more"] .host::after {\n  mask-image`),
    );
    expect(rule).toMatch(/mask-image: none;/);
    expect(rule).toContain(`border: 1px solid var(${SURFACE_HAIRLINE_VAR}, transparent)`);
  });

  it('paints the body opaque under increased contrast, as reduced transparency does', () => {
    expect(css).toContain(
      `:root[${INCREASED_CONTRAST_ATTRIBUTE}="more"] .host::before {\n  backdrop-filter: none;`,
    );
  });
});

describe('every host sets its own hairline', () => {
  const hairlineOf = (selector: string) =>
    (container.querySelector(selector) as HTMLElement | null)?.style.getPropertyValue(
      SURFACE_HAIRLINE_VAR,
    );

  it('Surface: 3:1 against the solid body it publishes', () => {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false} mode="light">
          <Surface testID="surface" fill="#f4f4f6" />
        </BloomThemeProvider>,
      ),
    );
    const host = container.querySelector('[data-testid="surface"]') as HTMLElement;
    const edge = host.style.getPropertyValue(SURFACE_HAIRLINE_VAR);
    const solid = host.style.getPropertyValue('--bloom-surface-solid');
    expect(edge).not.toBe('');
    expect(contrastRatio(edge, solid)).toBeGreaterThanOrEqual(SURFACE_CONTRAST_EDGE_RATIO);
  });

  it('SurfacePaint: the same, and none when the host draws its own border', () => {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false} mode="dark">
          <SurfacePaint testID="with-edge" fill="#202024" />
          <SurfacePaint testID="own-border" fill="#202024" rim={false} />
        </BloomThemeProvider>,
      ),
    );
    const host = container.querySelector('[data-testid="with-edge"]') as HTMLElement;
    const edge = host.style.getPropertyValue(SURFACE_HAIRLINE_VAR);
    expect(
      contrastRatio(edge, host.style.getPropertyValue('--bloom-surface-solid')),
    ).toBeGreaterThanOrEqual(SURFACE_CONTRAST_EDGE_RATIO);
    expect(hairlineOf('[data-testid="own-border"]')).toBe('transparent');
  });

  it('Button: a hairline on a filled button, none on an outlined one', () => {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false} mode="light">
          <Button testID="solid">Save</Button>
          <Button testID="outline" appearance="outline">
            Cancel
          </Button>
        </BloomThemeProvider>,
      ),
    );
    const solid = container.querySelector('[data-testid="solid"]') as HTMLElement;
    expect(solid.style.getPropertyValue(SURFACE_HAIRLINE_VAR)).toMatch(/^(rgb|#)/);
    expect(hairlineOf('[data-testid="outline"]')).toBe('transparent');
  });
});
