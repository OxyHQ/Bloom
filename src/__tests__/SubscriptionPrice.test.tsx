import React from 'react';
import { render } from '@testing-library/react-native';
import { withTiming } from 'react-native-reanimated';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SubscriptionPrice } from '../subscription-plans';

let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return { ...base, __esModule: true, withTiming: jest.fn((value) => value) };
});

beforeEach(() => {
  mockReduced = false;
  jest.clearAllMocks();
});

it('rolls changed digits and fades changed supporting copy', () => {
  const screen = render(
    <BloomThemeProvider>
      <SubscriptionPrice amount={9.99} currency="USD" locale="en-US" suffix="monthly" />
    </BloomThemeProvider>,
  );
  jest.clearAllMocks();
  screen.rerender(
    <BloomThemeProvider>
      <SubscriptionPrice amount={29.99} currency="USD" locale="en-US" suffix="yearly" />
    </BloomThemeProvider>,
  );
  expect(screen.getByLabelText('$29.99 yearly')).toBeTruthy();
  expect(withTiming).toHaveBeenCalledWith(
    expect.any(Number),
    expect.objectContaining({ duration: 350 }),
  );
  expect(withTiming).toHaveBeenCalledWith(1, { duration: 300 });
  expect(screen.queryByText('0')).toBeNull();
});

it('settles immediately when reduced motion is enabled, including changes while mounted', () => {
  const screen = render(
    <BloomThemeProvider>
      <SubscriptionPrice amount={9.99} currency="USD" locale="en-US" />
    </BloomThemeProvider>,
  );
  mockReduced = true;
  jest.clearAllMocks();
  screen.rerender(
    <BloomThemeProvider>
      <SubscriptionPrice amount={29.99} currency="USD" locale="en-US" suffix="yearly" />
    </BloomThemeProvider>,
  );
  expect(screen.getByLabelText('$29.99 yearly')).toBeTruthy();
  expect(withTiming).not.toHaveBeenCalled();
});
