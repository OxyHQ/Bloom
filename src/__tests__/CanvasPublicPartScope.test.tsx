import type React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Canvas } from '../canvas/Canvas';
import { CanvasBackground } from '../canvas/CanvasBackground';
import { CanvasPanel } from '../canvas/CanvasPanel';
import { ScreenHostContext, ScreenNavigationContext } from '../screen/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useSharedValue } from 'react-native-reanimated';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { resolvedStyle } from './support/rendered-style';

function Host({ children }: React.PropsWithChildren) {
  const collapseProgress = useSharedValue(0),
    collapseTarget = useSharedValue(0),
    activeScrollerId = useSharedValue<string | null>(null);
  return (
    <BloomThemeProvider>
      <PortalProvider>
        <ScreenHostContext.Provider value={{ active: true, kind: 'element', sizing: 'fill' }}>
          <ScreenNavigationContext.Provider
            value={{ collapseProgress, collapseTarget, activeScrollerId }}
          >
            {children}
          </ScreenNavigationContext.Provider>
        </ScreenHostContext.Provider>
      </PortalProvider>
    </BloomThemeProvider>
  );
}

function Subject({ scope }: { scope?: 'sm' | 'md' | 'lg' }) {
  const content = (
    <>
      <Canvas>
        <Button testID="canvas" accessibilityLabel="Canvas content" />
        <CanvasBackground testID="background">
          <View>
            <Button testID="background-child" accessibilityLabel="Background child" />
          </View>
        </CanvasBackground>
        <CanvasPanel snap="half" onSnapChange={() => {}} accessibilityLabel="Places">
          <View>
            <Button testID="panel-child" accessibilityLabel="Panel child" />
          </View>
          <BloomScope size="lg">
            <Button testID="nested-panel-child" accessibilityLabel="Nested panel child" />
          </BloomScope>
        </CanvasPanel>
        <Portal>
          <Button testID="portalled-inherited" accessibilityLabel="Portalled inherited" />
          <Button testID="portalled" accessibilityLabel="Portalled explicit" size="md" />
        </Portal>
      </Canvas>
    </>
  );
  return (
    <Host>
      {scope ? <BloomScope size={scope}>{content}</BloomScope> : content}
      <PortalOutlet />
    </Host>
  );
}

it('passes default, inherited and explicit button geometry through each canvas composition part', () => {
  const screen = render(<Subject />);
  const assertHeights = (inherited: number) => {
    for (const testID of ['canvas', 'background-child', 'panel-child', 'portalled-inherited'])
      expect(resolvedStyle(screen.getByTestId(testID).props.style).height).toBe(inherited);
    expect(resolvedStyle(screen.getByTestId('nested-panel-child').props.style).height).toBe(44);
    expect(resolvedStyle(screen.getByTestId('portalled').props.style).height).toBe(36);
  };

  assertHeights(36);
  screen.rerender(<Subject scope="sm" />);
  assertHeights(32);
  expect(screen.getByTestId('background').props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ position: 'absolute' })]),
  );
});
