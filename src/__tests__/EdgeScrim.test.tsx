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

describe('EdgeScrim on Android', () => {
  // react-native-svg laid the ramp out ~1.55x taller than its box there, so the
  // box cut it off half-opaque: a hard line across the content at the header's
  // foot (Commons, Allo; Pixel 8a). Android draws it as the view's own gradient.
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

  it('runs from the solid colour to nothing, through the same stops, both ways', () => {
    const top = edgeScrimGradient('#1d3b53', 'top');
    expect(top.startsWith('linear-gradient(to bottom, rgba(29, 59, 83, 1) 0%')).toBe(true);
    expect(top.endsWith('rgba(29, 59, 83, 0) 100%)')).toBe(true);
    expect(top.match(/rgba\(/g)).toHaveLength(SCRIM_STOPS.length);
    expect(edgeScrimGradient('#1d3b53', 'bottom').startsWith('linear-gradient(to top,')).toBe(true);
  });
});
