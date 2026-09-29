import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import {
  hairlineOn,
  resolveSurfaceLevel,
  SURFACE_VAR,
  SurfaceLevelProvider,
} from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

/**
 * `SurfaceLevelProvider` publishes `surfaceVars` (whose values
 * `surface-vars.test.ts` pins) to its subtree through react-native-css's
 * `VariableContextProvider`, so a descendant's `bg-ambient` class reads it.
 */
/** The `style` of the nearest element ABOVE `node` that carries `--bloom-surface`. */
function publishedAbove(node: ReactTestInstance): Record<string, unknown> | undefined {
  for (let at: ReactTestInstance | null = node.parent; at; at = at.parent) {
    const style = at.props.style as Record<string, unknown> | undefined;
    if (style && typeof style === 'object' && SURFACE_VAR.fill in style) return style;
  }
  return undefined;
}

describe('SurfaceLevelProvider publishes the bundle', () => {
  it('publishes the container’s fill for its subtree, and the nearest one wins', () => {
    const theme = buildTheme('blue', 'dark');
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(
        <BloomThemeProvider colorPreset="blue" mode="dark">
          <SurfaceLevelProvider level={1} fill="rgb(10 20 30)">
            <Text testID="outer">outer</Text>
            <SurfaceLevelProvider level={2}>
              <Text testID="inner">inner</Text>
            </SurfaceLevelProvider>
          </SurfaceLevelProvider>
        </BloomThemeProvider>,
      );
    });

    const outer = publishedAbove(tree.root.findByProps({ testID: 'outer' }));
    const inner = publishedAbove(tree.root.findByProps({ testID: 'inner' }));

    // The exact fill a container names is published verbatim…
    expect(outer?.[SURFACE_VAR.fill]).toBe('rgb(10 20 30)');
    expect(outer?.[SURFACE_VAR.hairline]).toBe(hairlineOn(theme, 'rgb(10 20 30)'));
    // …and a rung-only provider publishes the rung's own fill, not its parent's.
    expect(inner?.[SURFACE_VAR.fill]).toBe(resolveSurfaceLevel(theme, 2).background);
  });

  it('publishes nothing outside a theme, rather than a guessed palette', () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(
        <SurfaceLevelProvider level={1}>
          <Text testID="bare">bare</Text>
        </SurfaceLevelProvider>,
      );
    });
    expect(publishedAbove(tree.root.findByProps({ testID: 'bare' }))).toBeUndefined();
  });
});
