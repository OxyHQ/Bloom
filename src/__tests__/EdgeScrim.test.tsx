/**
 * `EdgeScrim` is public so chrome floating at EITHER edge of a scroller fades
 * into it the way the floating header does. The bottom edge is the same ramp
 * mirrored in the gradient's own axis — not a `rotate` transform on the host,
 * which is what `SidebarScrollArea` used to do and which a caller would have to
 * rediscover.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { EdgeScrim } from '../page-header';
import { edgeScrimGradient, SCRIM_STOPS } from '../page-header/EdgeScrim';
import { hostNodes } from './support/rendered-style';

const gradientOf = (tree: unknown) => hostNodes(tree).find((n) => n.type === 'LinearGradient')!;

describe('EdgeScrim', () => {
  it('linear falloff uses exactly the opaque and transparent endpoints', () => {
    const { toJSON } = render(<EdgeScrim color="#000000" falloff="linear" />);
    const stops = hostNodes(toJSON())
      .filter((node) => String(node.type) === 'Stop')
      .map((node) => ({ offset: node.props.offset, opacity: node.props.stopOpacity }));
    expect(stops).toEqual([
      { offset: '0', opacity: 1 },
      { offset: '1', opacity: 0 },
    ]);
    expect(edgeScrimGradient('#000000', 'top', 'linear')).toBe(
      'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
    );
  });
  it('is solid at the top and fades downward by default', () => {
    const { toJSON } = render(<EdgeScrim color="#1d3b53" />);
    const gradient = gradientOf(toJSON());
    expect(gradient.props.y1).toBe('0');
    expect(gradient.props.y2).toBe('1');
  });

  it('edge="bottom" is solid at the bottom and fades upward, with the same stops', () => {
    const top = render(<EdgeScrim color="#1d3b53" />);
    const topStops = hostNodes(top.toJSON())
      .filter((n) => n.type === 'Stop')
      .map((n) => n.props);
    top.unmount();

    const { toJSON } = render(<EdgeScrim color="#1d3b53" edge="bottom" />);
    const gradient = gradientOf(toJSON());
    expect(gradient.props.y1).toBe('1');
    expect(gradient.props.y2).toBe('0');
    const stops = hostNodes(toJSON())
      .filter((n) => n.type === 'Stop')
      .map((n) => n.props);
    expect(stops).toEqual(topStops);
    expect(stops.every((s) => s.stopColor === '#1d3b53')).toBe(true);
  });

  it('never rotates its host to mirror', () => {
    const { toJSON } = render(<EdgeScrim color="#1d3b53" edge="bottom" />);
    expect(JSON.stringify(toJSON())).not.toContain('rotate');
  });
});

describe('the smooth ramp runs the full range, leaving and arriving gently', () => {
  it('is opaque at its start, nothing at its end, and falls the whole way between', () => {
    expect(SCRIM_STOPS[0]).toEqual({ offset: 0, opacity: 1 });
    expect(SCRIM_STOPS[SCRIM_STOPS.length - 1]).toEqual({ offset: 1, opacity: 0 });
    const slopes = SCRIM_STOPS.slice(1).map(
      (stop, i) =>
        (SCRIM_STOPS[i]!.opacity - stop.opacity) / (stop.offset - SCRIM_STOPS[i]!.offset),
    );
    // Monotonic with no plateau: an ease-out that held 86% through the first 42% of the fade read
    // as a band stopping at 90%, then a step to opaque at the chrome's edge.
    for (const slope of slopes) expect(slope).toBeGreaterThan(0);
    // Eased at both ends (it leaves the solid colour and arrives at nothing flat, so the hold
    // before it and the page after it meet it without a corner), steepest in the middle.
    expect(slopes[0]!).toBeLessThan(0.2);
    expect(slopes[slopes.length - 1]!).toBeLessThan(0.2);
    const middle = slopes.length / 2;
    expect(Math.max(...slopes)).toBeCloseTo(slopes[middle]!, 2);
    // Smooth, not four segments whose corners showed as faint bands: no two neighbouring
    // segments differ in slope by more than a quarter of the steepest.
    for (let i = 1; i < slopes.length; i++)
      expect(Math.abs(slopes[i]! - slopes[i - 1]!)).toBeLessThan(Math.max(...slopes) / 4);
  });
});

describe('protected chrome and external fade', () => {
  const fraction = 1 / 1.55;
  it.each(['top', 'bottom'] as const)(
    '%s keeps every chrome pixel opaque and ends with a transparent tail',
    (edge) => {
      const screen = render(<EdgeScrim color="#123456" edge={edge} opaqueFraction={fraction} />);
      const stops = hostNodes(screen.toJSON())
        .filter((node) => String(node.type) === 'Stop')
        .map((node) => ({
          offset: Number(node.props.offset),
          opacity: Number(node.props.stopOpacity),
        }));
      expect(stops[0]).toEqual({ offset: 0, opacity: 1 });
      expect(stops[1]).toEqual({ offset: fraction, opacity: 1 });
      expect(stops.filter((stop) => stop.opacity < 1).every((stop) => stop.offset > fraction)).toBe(
        true,
      );
      expect(stops.slice(-1)[0]).toEqual({ offset: 1, opacity: 0 });
      // Native percentages retain the fractional boundary; rounding to 65/64%
      // would move the fade away from its measured chrome edge.
      const native = edgeScrimGradient('#123456', edge, 'smooth', fraction);
      expect(native).toContain(`rgba(18, 52, 86, 1) ${fraction * 100}%`);
      for (const stop of stops) expect(native).toContain(`${stop.opacity}) ${stop.offset * 100}%`);
    },
  );

  it.each([Number.NaN, Infinity, -1])(
    'invalid opaque fraction %s preserves the default ramp',
    (fraction) => {
      expect(edgeScrimGradient('#123456', 'top', 'smooth', fraction)).toBe(
        edgeScrimGradient('#123456', 'top'),
      );
    },
  );
  it('clamps a full opaque box without duplicate offsets or inverted stops', () => {
    expect(edgeScrimGradient('#123456', 'bottom', 'smooth', 2)).toBe(
      'linear-gradient(to top, rgba(18, 52, 86, 1) 0%, rgba(18, 52, 86, 1) 100%)',
    );
  });
});

describe('the far edge is exactly transparent', () => {
  // The fade must end at alpha 0 on its far edge, or that edge reads as a line
  // across the content. Every falloff, with and without protected chrome, on
  // the SVG renderer (iOS, web) and the native gradient (Android).
  const cases = (['smooth', 'linear'] as const).flatMap((falloff) =>
    [0, 1 / 1.55].flatMap((opaqueFraction) =>
      (['top', 'bottom'] as const).map((edge) => ({ falloff, opaqueFraction, edge })),
    ),
  );
  it.each(cases)('$falloff, opaqueFraction $opaqueFraction, $edge', (scrim) => {
    const { toJSON } = render(<EdgeScrim color="#000000" {...scrim} />);
    const last = hostNodes(toJSON())
      .filter((node) => String(node.type) === 'Stop')
      .map((node) => ({ offset: Number(node.props.offset), opacity: node.props.stopOpacity }))
      .slice(-1);
    expect(last).toEqual([{ offset: 1, opacity: 0 }]);
    expect(edgeScrimGradient('#000000', scrim.edge, scrim.falloff, scrim.opaqueFraction)).toMatch(
      /, rgba\(0, 0, 0, 0\) 100%\)$/,
    );
  });
});

describe('EdgeScrim on Android', () => {
  // Android draws the ramp as the view's own background gradient.
  const previous = Platform.OS;
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
  });
  afterEach(() => {
    (Platform as { OS: string }).OS = previous;
  });

  it('is a view gradient that spans its own box, with no SVG', () => {
    const { toJSON } = render(<EdgeScrim color="#1d3b53" testID="scrim" />);
    const nodes = hostNodes(toJSON());
    expect(nodes.some((n) => n.type === 'LinearGradient' || n.type === 'Stop')).toBe(false);
    const view = nodes.find((n) => n.props.testID === 'scrim');
    const style = StyleSheet.flatten(view?.props.style as ViewStyle) ?? {};
    expect(style).toMatchObject({ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 });
    expect(style.experimental_backgroundImage).toBe(edgeScrimGradient('#1d3b53', 'top'));
  });

  it('passes the protected chrome region to the Android View background', () => {
    const fraction = 1 / 1.55;
    const { toJSON } = render(
      <EdgeScrim color="#123456" edge="bottom" opaqueFraction={fraction} testID="protected" />,
    );
    const view = hostNodes(toJSON()).find((node) => node.props.testID === 'protected')!;
    expect(
      (StyleSheet.flatten(view.props.style as ViewStyle) ?? {}).experimental_backgroundImage,
    ).toBe(edgeScrimGradient('#123456', 'bottom', 'smooth', fraction));
  });

  it('renders the same linear falloff in the native background gradient', () => {
    const { toJSON } = render(<EdgeScrim color="#000000" falloff="linear" testID="linear" />);
    const view = hostNodes(toJSON()).find((node) => node.props.testID === 'linear')!;
    expect(
      (StyleSheet.flatten(view.props.style as ViewStyle) ?? {}).experimental_backgroundImage,
    ).toBe('linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)');
  });

  it('runs from the solid colour to nothing, through the same stops, both ways', () => {
    const top = edgeScrimGradient('#1d3b53', 'top');
    expect(top.startsWith('linear-gradient(to bottom, rgba(29, 59, 83, 1) 0%')).toBe(true);
    expect(top.endsWith('rgba(29, 59, 83, 0) 100%)')).toBe(true);
    expect(top.match(/rgba\(/g)).toHaveLength(SCRIM_STOPS.length);
    expect(edgeScrimGradient('#1d3b53', 'bottom').startsWith('linear-gradient(to top,')).toBe(true);
  });
});
