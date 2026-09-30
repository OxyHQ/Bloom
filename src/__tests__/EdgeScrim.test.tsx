/**
 * `EdgeScrim` is public so chrome floating at EITHER edge of a scroller fades
 * into it the way the floating header does. The bottom edge is the same ramp
 * mirrored in the gradient's own axis — not a `rotate` transform on the host,
 * which is what `SidebarScrollArea` used to do and which a caller would have to
 * rediscover.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { EdgeScrim } from '../page-header';
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
    const topStops = hostNodes(top.toJSON()).filter((n) => n.type === 'Stop').map((n) => n.props);
    top.unmount();

    const { toJSON } = render(<EdgeScrim color="#1d3b53" edge="bottom" />);
    const gradient = gradientOf(toJSON());
    expect(gradient.props.y1).toBe('1');
    expect(gradient.props.y2).toBe('0');
    const stops = hostNodes(toJSON()).filter((n) => n.type === 'Stop').map((n) => n.props);
    expect(stops).toEqual(topStops);
    expect(stops.every((s) => s.stopColor === '#1d3b53')).toBe(true);
  });

  it('never rotates its host to mirror', () => {
    const { toJSON } = render(<EdgeScrim color="#1d3b53" edge="bottom" />);
    expect(JSON.stringify(toJSON())).not.toContain('rotate');
  });
});
