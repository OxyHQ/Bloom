/**
 * @jest-environment jsdom
 */
// On web `Card` is `styled(…, { className: 'style' })`, so a caller's className
// reaches it inside `style` as a compiled-CSS entry (`{ $$css: true, … }`).
// Flattening that into the inline style made react-native-web's styleq log
// `maxWidth typeof 372 is not "string"` on every render and drop the inline
// values. Runs against the REAL react-native-web: the repo-wide mock never
// compiles a class, so it could not see either half.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Card } from '../card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { ViewStyle } from 'react-native';
import { splitCompiledStyle } from '../styles/compiled-style';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('keeps both the class and the inline style, without a styleq error', () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const warnings = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <Card
          testID="card"
          className="p-6"
          style={{ maxWidth: 372, gap: 20 }}
          radius="radius-16"
          appearance="outline"
        />
      </BloomThemeProvider>,
    ),
  );
  const logged = [...errors.mock.calls, ...warnings.mock.calls].flat().map(String);
  errors.mockRestore();
  warnings.mockRestore();
  expect(logged.filter((line) => line.includes('styleq'))).toEqual([]);
  const card = container.querySelector('[data-testid="card"]') as HTMLElement;
  expect(card.classList.contains('p-6')).toBe(true);
  expect(card.style.maxWidth).toBe('372px');
  expect(card.style.gap).toBe('20px');
  expect(card.style.borderTopLeftRadius || card.style.borderRadius).toBe('16px');
  expect(card.style.borderTopWidth || card.style.borderWidth).toBe('1px');
});

it('splits compiled entries from the inline values a component may read', () => {
  const compiled = { $$css: true, className: 'p-6' } as unknown as ViewStyle;
  const { classes, inline } = splitCompiledStyle<ViewStyle>([
    { maxWidth: 372 },
    [false, { gap: 20 }, compiled],
    null,
  ]);
  expect(classes).toEqual([compiled]);
  expect(inline).toEqual({ maxWidth: 372, gap: 20 });
  expect(splitCompiledStyle(undefined)).toEqual({ classes: [], inline: undefined });
});
