import type React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { StatusRing } from '../loading/StatusRing';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
let mockReduced = true;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);

it('keeps brand artwork static while announcing loading, and respects reduced motion', () => {
  const repeat = jest.spyOn(Reanimated, 'withRepeat');
  mockReduced = true;
  const view = render(
    <StatusRing state="loading" accessibilityLabel="Processing">
      <Text>Brand</Text>
    </StatusRing>,
    { wrapper },
  );
  expect(view.getByLabelText('Processing').props.accessibilityState).toEqual({ busy: true });
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-brand', { includeHiddenElements: true }).props.style,
    ).transform,
  ).toBeUndefined();
  expect(repeat).not.toHaveBeenCalled();
  mockReduced = false;
  view.rerender(
    <StatusRing state="loading" accessibilityLabel="Processing">
      <Text>Brand</Text>
    </StatusRing>,
  );
  expect(repeat).toHaveBeenCalled();
  repeat.mockRestore();
});
it('shows a controlled success tick then restores the same brand, without owning a close timer', () => {
  mockReduced = true;
  const draw = (state: 'idle' | 'success') => (
    <StatusRing state={state} accessibilityLabel={state}>
      <Text>Brand</Text>
    </StatusRing>
  );
  const view = render(draw('idle'), { wrapper });
  expect(resolvedStyle(view.getByLabelText('idle').props.style).backgroundColor).toBe(
    'transparent',
  );
  expect(view.queryByTestId('bloom-status-ring-track', { includeHiddenElements: true })).toBeNull();
  view.rerender(draw('success'));
  view.rerender(draw('success'));
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-tick', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(1);
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-brand', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(0);
  view.rerender(draw('idle'));
  view.rerender(draw('idle'));
  expect(view.getByText('Brand', { includeHiddenElements: true })).toBeTruthy();
  expect(resolvedStyle(view.getByLabelText('idle').props.style).backgroundColor).toBe(
    'transparent',
  );
  expect(view.queryByTestId('bloom-status-ring-track', { includeHiddenElements: true })).toBeNull();
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-brand', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(1);
});
