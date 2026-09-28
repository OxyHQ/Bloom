import React from 'react';
import { render } from '@testing-library/react-native';
import { Border, Fill, Image, resolve } from '../shapes';
import { assertImageSource } from '../shapes/validation';
import { svgColor } from '../shapes/svg-color';

// No theme/provider: this family must remain usable without loading color engines.
describe('Shared Shapes', () => {
  it('clips a doubled outline stroke by that outline, not by its rectangular viewport', () => {
    const shape = { d: 'M50 0L100 50L50 100L0 50Z', viewBox: 100 };
    const tree = render(
      <Border shape={shape} size={100} width={4} colors="#ff0000" />,
    );
    const paths = tree.UNSAFE_getAllByType('Path' as never);
    const border = paths.find((node) => node.props.stroke);
    expect(border?.props.strokeWidth).toBe(8);
    const clip = tree.UNSAFE_getByType('ClipPath' as never);
    expect(border?.props.clipPath).toBe(`url(#${clip.props.id})`);
    expect(clip.findByType('Path' as never).props.d).toBe(shape.d);
  });

  it('preserves alpha in gradient stops as stopOpacity', () => {
    const tree = render(
      <Border
        size={40}
        width={2}
        colors={['rgba(255, 0, 0, 0.5)', '#0000ff00']}
      />,
    );
    const stops = tree.UNSAFE_getAllByType('Stop' as never);
    expect(stops[0]?.props.stopColor).toBe('rgb(255, 0, 0)');
    expect(stops[0]?.props.stopOpacity).toBeCloseTo(0.5, 2);
    expect(stops[1]?.props.stopOpacity).toBe(0);
    expect(svgColor('#11223380')).toEqual({
      color: 'rgb(17, 34, 51)',
      opacity: 128 / 255,
    });
  });

  it('uses a shaped fallback fill independently of image rendering', () => {
    const shape = { d: 'M0 0H1V1H0Z' };
    const tree = render(<Fill size={24} shape={shape} color="#123456" />);
    expect(tree.UNSAFE_getByType('Path' as never).props).toMatchObject({
      d: shape.d,
      fill: '#123456',
    });
  });

  it('does not let an unknown prototype key resolve as a named outline', () => {
    expect(resolve('constructor' as 'circle')).toBeNull();
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid size %p', (size) => {
    expect(() => render(<Fill size={size} color="red" />)).toThrow(
      'positive finite',
    );
  });

  it.each([-1, NaN, Infinity])('rejects invalid border width %p', (width) => {
    expect(() =>
      render(<Border size={24} width={width} colors="red" />),
    ).toThrow('non-negative finite');
  });

  it('rejects malformed custom coordinate spaces', () => {
    expect(() => resolve({ d: 'M0 0Z', viewBox: 0 })).toThrow(
      'positive finite',
    );
    expect(() => resolve({ d: ' ' })).toThrow('non-empty');
  });

  it('keeps images source-compatible for local assets', () => {
    const tree = render(
      <Image size={40} shape="heart" source={23} alt="Portrait" />,
    );
    expect(tree.UNSAFE_getByType('SvgImage' as never).props.href).toBe(23);
    expect(tree.UNSAFE_getByType('Svg' as never).props['aria-label']).toBe(
      'Portrait',
    );
  });
});

describe('Portable image source contract', () => {
  it.each([
    [{ uri: 'https://example.com/a.png' }],
    { uri: 'https://example.com/a.png', headers: { Authorization: 'example' } },
    { uri: 'https://example.com/a.png', method: 'POST' },
    { uri: 'https://example.com/a.png', body: 'x' },
    { uri: 'https://example.com/a.png', cache: 'reload' },
    { uri: '' },
    { uri: 'data:image/png;base64,AA==', scale: NaN },
    0,
  ].map(source => [source]))('rejects unsupported image descriptor %p', (source) => {
    expect(() => assertImageSource(source)).toThrow(
      'Source arrays and request options',
    );
  });
  it('accepts URI descriptors and bundled asset IDs', () => {
    expect(() =>
      assertImageSource({
        uri: 'file:///photo.jpg',
        width: 80,
        height: 80,
        scale: 2,
      }),
    ).not.toThrow();
    expect(() => assertImageSource(23)).not.toThrow();
  });
});
