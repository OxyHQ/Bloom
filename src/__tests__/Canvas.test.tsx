import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Canvas } from '../canvas/Canvas';
import { useCanvasRegion } from '../canvas/context';
import { useScreen, ScreenHostContext, ScreenNavigationContext } from '../screen/context';
import { useSharedValue } from 'react-native-reanimated';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

it('keeps host activity and navigation instead of creating a redundant screen scope', () => {
  function Reader() {
    const screen = useScreen();
    const region = useCanvasRegion();
    return (
      <Text testID="state">{`${screen.active}/${region.active}/${screen.collapseProgress.value}`}</Text>
    );
  }
  function Subject({ active }: { active: boolean }) {
    const collapseProgress = useSharedValue(0.75),
      collapseTarget = useSharedValue(1),
      activeScrollerId = useSharedValue<string | null>(null);
    return (
      <BloomThemeProvider>
        <ScreenHostContext.Provider value={{ active, kind: 'element', sizing: 'fill' }}>
          <ScreenNavigationContext.Provider
            value={{ collapseProgress, collapseTarget, activeScrollerId }}
          >
            <Canvas testID="canvas">
              <Reader />
            </Canvas>
          </ScreenNavigationContext.Provider>
        </ScreenHostContext.Provider>
      </BloomThemeProvider>
    );
  }
  const view = render(<Subject active={false} />);
  expect(
    view.getByTestId('canvas-viewport', { includeHiddenElements: true }).props.collapsable,
  ).toBe(false);
  expect(view.getByTestId('state', { includeHiddenElements: true }).props.children).toBe(
    'false/false/0.75',
  );
  view.rerender(<Subject active />);
  expect(view.getByTestId('state').props.children).toBe('true/true/0.75');
});
