/**
 * @jest-environment node
 *
 * The standard library's localization (`stdlib/Bloom/runtime.ts`): a count of 0 takes a
 * catalog's `zero` form in every language, as i18next's `_zero` does, and a view that read
 * the locale with `useLocalization()` re-draws when `Locale.prefer` changes it.
 */
import { act, createElement } from 'react';
import TestRenderer from 'react-test-renderer';

import {
  localize,
  registerCatalog,
  setPreferredLocale,
  useLocaleIdentifier,
} from '../stdlib/Bloom/runtime';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Label() {
  const locale = useLocaleIdentifier();
  return localize('loading', {}, undefined, locale);
}

registerCatalog('en', {
  loading: 'Loading',
  related: { zero: 'Related, not merged', one: '{count} more', other: '{count} more' },
});
registerCatalog('es', { loading: 'Cargando' });
registerCatalog('ar', { related: { zero: 'صفر', one: 'واحد', other: '{count}' } });

test('a count of 0 takes the zero form in every language, then CLDR', () => {
  setPreferredLocale('en');
  expect(localize('related', {}, 0)).toBe('Related, not merged');
  expect(localize('related', {}, 1)).toBe('1 more');
  expect(localize('related', {}, 2)).toBe('2 more');
  expect(localize('related', {}, 0, 'ar')).toBe('صفر');
});

test('a mounted label re-draws in the locale preferred after it', () => {
  setPreferredLocale('en');
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(Label));
  });
  expect(renderer.toJSON()).toBe('Loading');
  act(() => setPreferredLocale('es'));
  expect(renderer.toJSON()).toBe('Cargando');
  act(() => renderer.unmount());
  setPreferredLocale('en');
});
