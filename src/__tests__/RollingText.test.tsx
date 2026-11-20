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
  // The roll lands when the incoming text's keyframes end on the CSS engine.
  let incoming = screen.getByText('13').parent;
  while (incoming && typeof incoming.props.onCSSAnimationEnd !== 'function')
    incoming = incoming.parent;
  act(() => incoming?.props.onCSSAnimationEnd());
  expect(onRollEnd).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('12', { includeHiddenElements: true })).toBeNull();
  jest.useRealTimers();
});
