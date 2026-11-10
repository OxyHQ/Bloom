/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Canvas } from '../canvas/Canvas.web';
import { CanvasBackground } from '../canvas/CanvasBackground';
import { CanvasPanel } from '../canvas/CanvasPanel.web';
import { Portal } from '../portal/Portal.web';
import { ScreenHostContext, ScreenNavigationContext } from '../screen/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function hostNode(testID: string): Element {
  const node = document.body.querySelector(`[data-testid="${testID}"]`);
  if (!node) throw new Error(`Missing test host ${testID}`);
  return node;
}

function ScreenHost({ children }: React.PropsWithChildren) {
  const collapseProgress = useSharedValue(0),
    collapseTarget = useSharedValue(0),
    activeScrollerId = useSharedValue<string | null>(null);
  return (
    <ScreenHostContext.Provider value={{ active: true, kind: 'element', sizing: 'fill' }}>
      <ScreenNavigationContext.Provider
        value={{ collapseProgress, collapseTarget, activeScrollerId }}
      >
        {children}
      </ScreenNavigationContext.Provider>
    </ScreenHostContext.Provider>
  );
}

function Subject({ scope }: { scope?: 'sm' | 'md' | 'lg' }) {
  const content = (
    <Canvas testID="canvas-root">
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
  );
  return scope ? <BloomScope size={scope}>{content}</BloomScope> : content;
}

it('passes default, inherited and explicit button geometry through each web canvas part', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const tree = (scope?: 'sm' | 'md' | 'lg') => (
      <BloomThemeProvider fonts={false}>
        <ScreenHost>
          <Subject scope={scope} />
        </ScreenHost>
      </BloomThemeProvider>
    );
    act(() => root.render(tree()));
    const assertHeights = (inherited: string) => {
      for (const testID of ['canvas', 'background-child', 'panel-child', 'portalled-inherited'])
        expect(getComputedStyle(hostNode(testID)).height).toBe(inherited);
      expect(getComputedStyle(hostNode('nested-panel-child')).height).toBe('44px');
      expect(getComputedStyle(hostNode('portalled')).height).toBe('36px');
    };
    assertHeights('36px');
    act(() => root.render(tree('sm')));
    assertHeights('32px');
  } finally {
    act(() => root.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
