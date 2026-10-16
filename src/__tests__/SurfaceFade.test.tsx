// `SurfaceFade` ends media in the colour of the surface it sits on — whatever
// panel or card published that fill — along one edge, as one linear gradient.
import React from 'react';
import { render } from '@testing-library/react-native';
import { SurfaceFade } from '../fill';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function fadeIn(ui: React.ReactElement, fill = '#123456') {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <SurfaceLevelProvider level={1} fill={fill}>
        {ui}
      </SurfaceLevelProvider>
    </BloomThemeProvider>,
  );
  return resolvedStyle(screen.getByTestId('fade', { includeHiddenElements: true }).props.style);
}

it('fades the bottom half into the surface it sits on by default', () => {
  const style = fadeIn(<SurfaceFade testID="fade" />);
  expect(style).toMatchObject({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  });
  expect(style.experimental_backgroundImage).toBe(
    'linear-gradient(180deg, rgba(18, 52, 86, 0) 0%, #123456 100%)',
  );
});

it('follows a different surface without being told', () => {
  const style = fadeIn(<SurfaceFade testID="fade" />, 'rgb(250, 250, 250)');
  expect(style.experimental_backgroundImage).toBe(
    'linear-gradient(180deg, rgba(250, 250, 250, 0) 0%, rgb(250, 250, 250) 100%)',
  );
});

it('takes an edge, a size in points or as a fraction, and a colour override', () => {
  const top = fadeIn(<SurfaceFade testID="fade" edge="top" size={120} color="#000000" />);
  expect(top).toMatchObject({ top: 0, height: 120 });
  expect(top.experimental_backgroundImage).toBe(
    'linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000000 100%)',
  );
  const end = fadeIn(<SurfaceFade testID="fade" edge="end" size={0.25} />);
  expect(end).toMatchObject({ top: 0, bottom: 0, right: 0, width: '25%' });
  expect(end.experimental_backgroundImage).toMatch(/^linear-gradient\(90deg/);
  const start = fadeIn(<SurfaceFade testID="fade" edge="start" />);
  expect(start).toMatchObject({ left: 0 });
  expect(start.experimental_backgroundImage).toMatch(/^linear-gradient\(270deg/);
});

it('falls back to a transparent start for a colour it cannot parse', () => {
  const style = fadeIn(<SurfaceFade testID="fade" color="var(--bloom-page)" />);
  expect(style.experimental_backgroundImage).toBe(
    'linear-gradient(180deg, transparent 0%, var(--bloom-page) 100%)',
  );
});

it('is decoration: out of the hit test and the accessibility tree', () => {
  const screen = render(
    <BloomThemeProvider fonts={false}>
      <SurfaceFade testID="fade" />
    </BloomThemeProvider>,
  );
  expect(screen.queryByTestId('fade')).toBeNull();
  const node = screen.getByTestId('fade', { includeHiddenElements: true });
  expect(node.props.pointerEvents).toBe('none');
  expect(node.props['aria-hidden']).toBe(true);
});
