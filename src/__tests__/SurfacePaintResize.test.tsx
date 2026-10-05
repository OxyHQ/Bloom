import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';
import { SurfacePaint } from '../surface/SurfacePaint';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

// Native SVG primitives are mocked; this asserts the resize boundary, not pixels.
// Android renders percentage Rect paths using cached canvas dimensions, so the
// rectangle geometry must change when its native View grows after first paint.
describe('native surface paint resize', () => {
  it('updates fill and sheen geometry on height and width changes', () => {
    const view = render(<BloomThemeProvider mode="light">
      <SurfacePaint testID="paint" fill="#ffffff" radius={24} />
    </BloomThemeProvider>);
    for (const [width, height] of [[320, 240], [320, 790], [411, 790], [320, 180]]) {
      act(() => fireEvent(view.getByTestId('paint'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      }));
      const rectangles = view.UNSAFE_getAllByType(Rect);
      expect(rectangles).toHaveLength(2);
      for (const rectangle of rectangles) {
        expect(rectangle.props.width).toBe(width);
        expect(rectangle.props.height).toBe(height);
      }
    }
    expect(view.getByTestId('paint').props.pointerEvents).toBe('none');
  });

  it('keeps explicit alpha and optional sheen independent of geometry', () => {
    const view = render(<BloomThemeProvider mode="light">
      <SurfacePaint testID="paint" fill="rgba(10, 20, 30, 0.4)" sheen={false} />
    </BloomThemeProvider>);
    act(() => fireEvent(view.getByTestId('paint'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 600 } },
    }));
    const rectangles = view.UNSAFE_getAllByType(Rect);
    expect(rectangles).toHaveLength(1);
    expect(rectangles[0]!.props.height).toBe(600);
    expect(rectangles[0]!.props.fillOpacity).toBe(0.4);
  });
});
