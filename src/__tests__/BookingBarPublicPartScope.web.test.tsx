/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { BookingBar } from '../booking';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each([undefined, 'xs', 'sm', 'md', 'lg'] as const)(
  'keeps BookingBar reserve geometry fixed under %s scope on web',
  (size) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            {size ? (
              <BloomScope size={size}>
                <BookingBar testID="booking" price="$120" dates="Aug 1–5" />
              </BloomScope>
            ) : (
              <BookingBar testID="booking" price="$120" dates="Aug 1–5" />
            )}
          </BloomThemeProvider>,
        ),
      );
      const button = host.querySelector('[data-testid="booking-reserve"]');
      if (!button) throw new Error('Missing BookingBar reserve button');
      expect(getComputedStyle(button).height).toBe('44px');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('keeps BookingBar reserve geometry fixed under nested lg-over-xs on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <BookingBar testID="booking" price="$120" dates="Aug 1–5" />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const button = host.querySelector('[data-testid="booking-reserve"]');
    if (!button) throw new Error('Missing BookingBar reserve button');
    expect(getComputedStyle(button).height).toBe('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
