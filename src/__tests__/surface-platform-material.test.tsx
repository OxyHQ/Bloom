/**
 * A platform that blurs behind a view of its own (`material`: OxyOS's
 * behind-window blur) draws it under a floating surface's tint, as iOS draws
 * its system material; reduced transparency, in-flow surfaces and composite
 * fills keep the one opaque view. Without the capability nothing changes.
 */
import React from 'react';
import { Platform, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformMaterialProps, PlatformSurfaceAdapter } from '../platform-surface/types';
import { SurfacePaint } from '../surface/SurfacePaint';
import { SURFACE_TINT_OPACITY } from '../surface/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { parseRgba } from '../theme/color-utils';
import { resolvedStyle } from './support/rendered-style';

const originalOS = Platform.OS;
beforeEach(() => {
  Platform.OS = 'android';
});
afterEach(() => {
  Platform.OS = originalOS;
});

function Material({ appearance, style, testID }: PlatformMaterialProps) {
  return <View testID={testID} style={style} accessibilityHint={appearance} />;
}

const WITH_MATERIAL: PlatformSurfaceAdapter = {
  platform: 'desktop',
  capabilities: new Set(['window', 'material']),
  Material,
};

function paint(
  adapter: PlatformSurfaceAdapter | null,
  { floating = true, reduce = false, mode = 'light' as 'light' | 'dark', composite = false } = {},
) {
  return render(
    <PlatformSurfaceProvider value={adapter}>
      <BloomThemeProvider fonts={false} mode={mode} reduceTransparency={reduce}>
        <SurfacePaint
          testID="paint"
          fill="#f4f4f6"
          radius={10}
          floating={floating}
          composite={composite}
        />
      </BloomThemeProvider>
    </PlatformSurfaceProvider>,
  );
}

describe('a platform with its own material', () => {
  it('draws it under a translucent tint for a floating surface, in the theme mode', () => {
    const tree = paint(WITH_MATERIAL);
    const material = tree.getByTestId('paint-material');
    expect(material.props.accessibilityHint).toBe('light');
    const tint = resolvedStyle(tree.getByTestId('paint-tint').props.style);
    expect(parseRgba(String(tint.backgroundColor))?.a).toBeCloseTo(SURFACE_TINT_OPACITY, 2);
    expect(tree.UNSAFE_queryAllByType('BlurView' as never)).toHaveLength(0);
    expect(
      paint(WITH_MATERIAL, { mode: 'dark' }).getByTestId('paint-material').props.accessibilityHint,
    ).toBe('dark');
  });

  it('is not mounted with transparency reduced, in flow, or under a composite fill', () => {
    for (const options of [{ reduce: true }, { floating: false }, { composite: true }]) {
      const tree = paint(WITH_MATERIAL, options);
      expect(tree.queryByTestId('paint-material')).toBeNull();
      expect(resolvedStyle(tree.getByTestId('paint').props.style).backgroundColor).toBe('#f4f4f6');
    }
  });

  it('changes nothing without the capability', () => {
    const tree = paint({ platform: 'desktop', capabilities: new Set(['window']) });
    expect(tree.queryByTestId('paint-material')).toBeNull();
    expect(resolvedStyle(tree.getByTestId('paint').props.style).backgroundColor).toBe('#f4f4f6');
  });

  it('throws for a capability reported without its component', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => paint({ platform: 'broken', capabilities: new Set(['material']) })).toThrow(
      /reports 'material' without a Material component/,
    );
  });
});
