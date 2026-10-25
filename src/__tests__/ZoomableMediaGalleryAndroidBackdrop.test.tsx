/**
 * The overlay gallery dims to nearly opaque on Android, where it cannot blur.
 *
 * It renders through the portal in the app's own window; on Android a blur
 * there is not drawn (and a blur target there crashes), so the backdrop was
 * expo-blur's fallback tint plus the 0.28 dim and the conversation stayed
 * readable behind the photo (Allo, Pixel 8a).
 */
import type React from 'react';
import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { Backdrop } from '../overlay';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ZoomableMediaGallery, type ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';

const BackdropComponent = (Backdrop as unknown as { type: React.ComponentType }).type;

function backdropOn(os: 'ios' | 'android') {
  const previous = Platform.OS;
  (Platform as { OS: string }).OS = os;
  try {
    const ref = createRef<ZoomableMediaGalleryHandle>();
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <PortalProvider>
          <ZoomableMediaGallery ref={ref} />
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    act(() => ref.current?.open([{ uri: 'https://cloud.oxy.so/a.jpg' }], 0));
    const props = screen.UNSAFE_getByType(BackdropComponent).props as Record<string, unknown>;
    screen.unmount();
    return props;
  } finally {
    (Platform as { OS: string }).OS = previous;
  }
}

describe('overlay gallery backdrop', () => {
  it('drops the blur and dims to nearly opaque on Android', () => {
    const props = backdropOn('android');
    expect(props.blurIntensity).toBe(0);
    expect(props.dimOpacity).toBe(0.92);
  });

  it('keeps the shared blur and dim where the platform can blur', () => {
    const props = backdropOn('ios');
    expect(props.blurIntensity).toBeUndefined();
    expect(props.dimOpacity).toBeUndefined();
  });
});
