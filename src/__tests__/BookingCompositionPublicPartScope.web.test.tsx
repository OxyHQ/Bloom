/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { BookingCard, TripCard } from '../booking';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  ['default', undefined, '36px'],
  ['xs', 'xs', '24px'],
  ['sm', 'sm', '32px'],
  ['md', 'md', '36px'],
  ['lg', 'lg', '44px'],
] as const;

function assertHeight(host: HTMLElement, id: string, expected: string) {
  const element = host.querySelector(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Missing booking action: ${id}`);
  expect(getComputedStyle(element).height).toBe(expected);
}

it.each(sizes)(
  'BookingCard footer controls inherit %s while Reserve remains large on web',
  (_name, size, height) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const card = (
      <BookingCard
        testID="booking"
        price="$120"
        footer={
          <Button testID="booking-footer-action">
            <Text>Details</Text>
          </Button>
        }
      />
    );
    try {
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            {size ? <BloomScope size={size}>{card}</BloomScope> : card}
          </BloomThemeProvider>,
        ),
      );
      assertHeight(host, 'booking-footer-action', height);
      assertHeight(host, 'booking-reserve', '44px');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('BookingCard footer controls inherit the nearest nested scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <BookingCard
                testID="booking"
                price="$120"
                footer={
                  <Button testID="booking-footer-action">
                    <Text>Details</Text>
                  </Button>
                }
              />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    assertHeight(host, 'booking-footer-action', '44px');
    assertHeight(host, 'booking-reserve', '44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('TripCard actions inherit %s scope on web', (_name, size, height) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const card = (
    <TripCard
      testID="trip"
      title="Stay"
      orientation="horizontal"
      actions={
        <Button testID="trip-action">
          <Text>Details</Text>
        </Button>
      }
    />
  );
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          {size ? <BloomScope size={size}>{card}</BloomScope> : card}
        </BloomThemeProvider>,
      ),
    );
    assertHeight(host, 'trip-action', height);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('TripCard actions inherit the nearest nested scope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <TripCard
                testID="trip"
                title="Stay"
                orientation="horizontal"
                actions={
                  <Button testID="trip-action">
                    <Text>Details</Text>
                  </Button>
                }
              />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    assertHeight(host, 'trip-action', '44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
