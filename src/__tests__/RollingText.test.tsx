import type React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import { RollingText } from '../motion';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}));

const themed = (node: React.ReactElement) => <BloomThemeProvider>{node}</BloomThemeProvider>;

it('rolls a change: the outgoing text stays, hidden, until the roll lands', () => {
  jest.useFakeTimers();
  const onRollEnd = jest.fn();
  const { rerender } = render(themed(<RollingText value="12" onRollEnd={onRollEnd} />));
  rerender(themed(<RollingText value="13" onRollEnd={onRollEnd} />));
  expect(screen.getByText('13')).toBeTruthy();
  expect(screen.getByText('12', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByText('12')).toBeNull();
  act(() => jest.advanceTimersByTime(220));
  expect(onRollEnd).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('12', { includeHiddenElements: true })).toBeNull();
  jest.useRealTimers();
});
