/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => require('../theme/build-theme').buildTheme('teal', 'light'),
}));
import { Card } from '../card/Card';

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

it.each([false, true])(
  'keeps class utilities separate from numeric card geometry (pressable=%s)',
  (pressable) => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      act(() =>
        root.render(
          <Card
            testID="card"
            className="gap-space-16 p-space-20"
            radius="radius-28"
            border="none"
            style={{ padding: 20, gap: 16 }}
            onPress={pressable ? () => {} : undefined}
          >
            <span>Content</span>
          </Card>,
        ),
      );
      const host = container.querySelector('[data-testid="card"]') as HTMLElement;
      expect(host.classList.contains('gap-space-16')).toBe(true);
      expect(host.classList.contains('p-space-20')).toBe(true);
      expect(getComputedStyle(host).borderTopLeftRadius).toBe('28px');
      expect(getComputedStyle(host).borderTopWidth).toBe('0px');
      expect(getComputedStyle(host).paddingTop).toBe('20px');
      expect(host.style.gap).toBe('16px');
      expect(host.querySelectorAll('.bloom-surface-paint')).toHaveLength(1);
      expect(
        errors.mock.calls.filter((args) => args.some((arg) => String(arg).includes('styleq'))),
      ).toEqual([]);
    } finally {
      errors.mockRestore();
    }
  },
);

