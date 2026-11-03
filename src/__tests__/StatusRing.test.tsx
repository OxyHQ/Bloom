import type React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { StatusRing } from '../loading/StatusRing';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Surface } from '../surface';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { cardFill } from './support/card-surface';
import { resolvedStyle } from './support/rendered-style';
let mockReduced = true;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);

it('crossfades brand artwork into loading and respects reduced motion', () => {
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
  ).toEqual([{ scale: 0.75 }]);
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
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-background', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(0);
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
      view.getByTestId('bloom-status-ring-background', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(0);
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-brand', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(1);
});

it('keeps transition layers mounted and animates matching success and error glyphs', () => {
  mockReduced = false;
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const draw = (state: 'idle' | 'loading' | 'success' | 'error') => (
    <StatusRing state={state} accessibilityLabel={state}>
      <Text>Brand</Text>
    </StatusRing>
  );
  const view = render(draw('idle'), { wrapper });
  const spinner = view.getByTestId('bloom-status-ring-spinner', { includeHiddenElements: true });
  expect(resolvedStyle(spinner.props.style).opacity).toBe(0);
  view.rerender(draw('loading'));
  view.rerender(draw('loading'));
  expect(view.getByTestId('bloom-status-ring-spinner', { includeHiddenElements: true })).toBe(
    spinner,
  );
  expect(resolvedStyle(spinner.props.style).opacity).toBe(1);
  expect(timing).toHaveBeenCalledWith(1, { duration: 220 });
  view.rerender(draw('error'));
  view.rerender(draw('error'));
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-error', { includeHiddenElements: true }).props.style,
    ),
  ).toMatchObject({ opacity: 1, transform: [{ scale: 1 }] });
  expect(
    resolvedStyle(
      view.getByTestId('bloom-status-ring-brand', { includeHiddenElements: true }).props.style,
    ).opacity,
  ).toBe(0);
  expect(resolvedStyle(spinner.props.style).opacity).toBe(0);
  timing.mockRestore();
});

it.each(['light', 'dark'] as const)(
  'uses the canonical nested Surface material in %s without painting idle',
  (mode) => {
    const wrap = ({ children }: React.PropsWithChildren) => (
      <BloomThemeProvider mode={mode} fonts={false}>
        <SurfaceLevelProvider level={3} fill={mode === 'dark' ? '#333333' : '#dddddd'}>
          {children}
        </SurfaceLevelProvider>
      </BloomThemeProvider>
    );
    const reference = render(<Surface radius={24} cornerCurve="round" />, { wrapper: wrap });
    const view = render(
      <StatusRing state="success" accessibilityLabel="Complete">
        <Text>Brand</Text>
      </StatusRing>,
      { wrapper: wrap },
    );
    expect(cardFill(view.UNSAFE_root)).toBe(cardFill(reference.UNSAFE_root));
    view.rerender(
      <StatusRing state="idle" accessibilityLabel="Idle">
        <Text>Brand</Text>
      </StatusRing>,
    );
    view.rerender(
      <StatusRing state="idle" accessibilityLabel="Idle">
        <Text>Brand</Text>
      </StatusRing>,
    );
    expect(
      resolvedStyle(
        view.getByTestId('bloom-status-ring-background', { includeHiddenElements: true }).props
          .style,
      ).opacity,
    ).toBe(0);
  },
);
