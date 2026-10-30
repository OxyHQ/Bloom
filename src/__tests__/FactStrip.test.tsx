/**
 * @jest-environment jsdom
 *
 * `FactStrip` through the REAL react-native-web: a list of facts, each one
 * item named by its contents, separators between them only, and a pressable
 * fact as a button.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { FactStrip } from '../fact-strip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

describe('FactStrip', () => {
  it('is a list of facts, each one item, with a separator between neighbours', () => {
    const onPress = jest.fn();
    act(() => {
      root.render(
        <BloomThemeProvider mode="light">
          <FactStrip
            testID="f"
            accessibilityLabel="About this app"
            items={[
              { key: 'ratings', label: '128 reviews', value: '4.6', onPress },
              { key: 'category', label: 'Category', value: 'Productivity', caption: 'Work' },
              {
                key: 'released',
                label: 'Released',
                value: '2026',
                accessibilityLabel: 'Released in 2026',
              },
            ]}
          />
        </BloomThemeProvider>,
      );
    });
    expect(container.querySelector('[role="list"]')?.getAttribute('aria-label')).toBe(
      'About this app',
    );
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(2);
    expect(byTestId('f-category').textContent).toBe('CategoryProductivityWork');
    expect(byTestId('f-released').getAttribute('aria-label')).toBe('Released in 2026');
    const ratings = byTestId('f-ratings');
    expect(ratings.getAttribute('role')).toBe('button');
    act(() => ratings.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
