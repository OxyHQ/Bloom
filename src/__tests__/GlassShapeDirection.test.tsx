import React from 'react';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

describe('Glass surface logical corners', () => {
  it('mirrors the clipping pane and its rim together', () => {
    const tree = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <SurfacePaint
          fill="#336699"
          shape={{ radius: { topStart: 20, bottomEnd: 8 }, curve: 'smooth' }}
          direction="rtl"
          sheen={false}
          testID="glass"
        />
      </BloomThemeProvider>,
    );
    const pane = tree.getByTestId('glass');
    const expected = {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 0,
    };
    expect(flatten(pane.props.style)).toMatchObject(expected);
    const rim = pane.children[pane.children.length - 1];
    expect(typeof rim).not.toBe('string');
    if (typeof rim !== 'string') expect(flatten(rim?.props.style)).toMatchObject(expected);
  });
});
