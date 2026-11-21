/**
 * @jest-environment jsdom
 */

/**
 * A theme switch plays no colour transition on the web: the provider applies
 * it while the document is marked, and the mark holds every host that
 * transitions its colours to its transform and opacity. The mark is up while
 * the new style is computed and down after.
 */
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import { applyThemeAtOnce, COLOR_TRANSITION_PROPS } from '../motion/theme-switch';

const marked = () => document.documentElement.hasAttribute('data-bloom-theme-switch');

afterEach(() => {
  document.body.innerHTML = '';
});

it('a host that transitions its colours carries the host attribute', () => {
  expect(COLOR_TRANSITION_PROPS).toEqual({ dataSet: { bloomColorTransition: '' } });
});

it('with a colour-transitioning host, the switch applies under the mark and unmarks after', () => {
  const host = document.createElement('div');
  host.setAttribute('data-bloom-color-transition', '');
  document.body.appendChild(host);
  const seen: boolean[] = [];
  applyThemeAtOnce(() => {
    seen.push(marked());
    document.documentElement.classList.add('dark');
  });
  expect(seen).toEqual([true]);
  expect(marked()).toBe(false);
  expect(document.documentElement.classList.contains('dark')).toBe(true);
  // The rule the mark switches on (jsdom takes adoptStyleSheet's <style> fallback):
  // such hosts keep only their transform and opacity transitions.
  const css = Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('');
  expect(css).toContain(
    'html[data-bloom-theme-switch] [data-bloom-color-transition]{transition-property:transform,opacity!important}',
  );
});

it('the mark comes down even when applying throws', () => {
  const host = document.createElement('div');
  host.setAttribute('data-bloom-color-transition', '');
  document.body.appendChild(host);
  expect(() =>
    applyThemeAtOnce(() => {
      throw new Error('apply');
    }),
  ).toThrow('apply');
  expect(marked()).toBe(false);
});

it('with no such host, it only applies', () => {
  const seen: boolean[] = [];
  applyThemeAtOnce(() => seen.push(marked()));
  expect(seen).toEqual([false]);
});
