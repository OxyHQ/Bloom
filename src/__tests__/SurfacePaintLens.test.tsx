/**
 * A control's surface is painted with the engine's lens material where the platform has it:
 * a native view that draws a shared texture, in place of the `View` with tint and inset shadows.
 * The native view is a stub here; what is checked is when the surface takes that path and what
 * it hands the view.
 */
import type React from 'react';
import { Platform, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';
import type { LensSurfaceNativeProps } from '../floating/lens/native-lens';

let lastProps: LensSurfaceNativeProps | undefined;

function NativeSurfaceStub(props: LensSurfaceNativeProps) {
  lastProps = props;
  return <View testID="native-lens-surface" />;
}

jest.mock('../floating/lens/native-lens', () => ({
  ...jest.requireActual('../floating/lens/native-lens'),
  getNativeLensSurface: () => NativeSurfaceStub,
}));

function paint(props: React.ComponentProps<typeof SurfacePaint>) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="teal">
      <SurfacePaint testID="paint" {...props} />
    </BloomThemeProvider>,
  );
}

beforeEach(() => {
  lastProps = undefined;
  // The path is Android's.
  jest.replaceProperty(Platform, 'OS', 'android');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SurfacePaint with the lens material', () => {
  it('hands a control surface to the native view: opaque tint, radius, scheme', () => {
    const screen = paint({ lens: true, fill: '#336699', radius: 12 });
    expect(screen.getByTestId('native-lens-surface')).toBeTruthy();
    expect(lastProps).toMatchObject({ radius: 12, dark: true });
    expect(lastProps?.tint).toMatch(/^(#336699|rgb\(51[ ,]+102[ ,]+153\))$/i);
  });

  it('composites a translucent fill onto what the surface sits on', () => {
    paint({ lens: true, fill: 'rgba(255, 255, 255, 0.5)', backing: '#000000', radius: 8 });
    // Half white over black is mid grey, opaque: the texture cannot carry translucency.
    expect(lastProps?.tint).toMatch(/12[78]/);
    expect(lastProps?.page).toBe('#000000');
  });

  it('keeps the plain paint without `lens`, without a number radius, or with a hairline instead of the rim', () => {
    paint({ fill: '#336699', radius: 12 });
    expect(lastProps).toBeUndefined();
    paint({ lens: true, fill: '#336699' });
    expect(lastProps).toBeUndefined();
    paint({ lens: true, fill: '#336699', radius: 12, rim: false });
    expect(lastProps).toBeUndefined();
  });
});
