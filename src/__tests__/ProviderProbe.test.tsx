/**
 * What a missing `BloomThemeProvider` actually costs the image gallery.
 *
 * `ZoomableMediaGallery` used to bind `useTheme()` and never read the result.
 * The waste was the smaller half: `useTheme` THROWS outside the provider, so an
 * unread binding is a hard requirement imposed for nothing.
 *
 * The binding is gone. This file records what that did and did NOT buy, because
 * the obvious conclusion — "the gallery no longer needs a provider" — is wrong:
 * once the open settles, the gallery renders its chrome — three Bloom icons —
 * and every Bloom icon calls `useTheme()` unconditionally through
 * `useCommonSVGProps`. So the requirement survives; it just moved to something
 * that genuinely uses the hook.
 *
 * The open is held in flight here (`holdAnimations`), which is the state this
 * file can speak for: the pager and its media are mounted, the chrome is not.
 * Rather than assert something past that, the last test measures the icons
 * DIRECTLY.
 */
import type React from 'react';
import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

import { PortalProvider, PortalOutlet } from '../portal';
import { useTheme } from '../theme/use-theme';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';
import { RiUpload2Line as ShareIcon } from '../icons';
import { hostNodes } from './support/rendered-style';
import { holdAnimations } from './support/held-animations';

const IMAGES = [{ uri: 'https://cloud.oxy.so/a.jpg', alt: 'First' }];

function renderGallery() {
  const ref = createRef<ZoomableMediaGalleryHandle>();
  const utils = render(
    <PortalProvider>
      <ZoomableMediaGallery ref={ref} />
      <PortalOutlet />
    </PortalProvider>,
  );
  return { ...utils, ref };
}

/** Silence React's error logging for a render that is expected to throw. */
function expectThrows(ui: React.ReactElement, pattern: RegExp) {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(ui)).toThrow(pattern);
  spy.mockRestore();
}

describe('what a missing BloomThemeProvider costs', () => {
  it('POSITIVE CONTROL: useTheme does throw outside the provider here', () => {
    // Without this, every "did not throw" below is equally consistent with
    // `useTheme` being harmless in this environment — i.e. with the whole file
    // measuring nothing.
    function Probe() {
      useTheme();
      return null;
    }
    expectThrows(<Probe />, /BloomThemeProvider/);
  });

  it('the opt-in page appearance explicitly requires a theme provider', () => {
    expectThrows(
      <PortalProvider>
        <ZoomableMediaGallery appearance="page" />
        <PortalOutlet />
      </PortalProvider>,
      /BloomThemeProvider/,
    );
  });

  it('the gallery mounts closed with no provider', () => {
    expect(() => renderGallery()).not.toThrow();
  });

  it('the gallery opens with no provider, as far as the pager', () => {
    const flights = holdAnimations();
    const { ref, toJSON } = renderGallery();
    try {
      expect(() => {
        act(() => {
          ref.current?.open(IMAGES, 0);
        });
      }).not.toThrow();
      expect(flights.held()).toBeGreaterThan(0);
    } finally {
      flights.restore();
    }

    // It really opened, rather than opening to nothing — otherwise "did not
    // throw" would be true of a gallery that rendered no subtree at all.
    const nodes = hostNodes(toJSON());
    expect(nodes.filter((node) => node.type === 'ExpoImage').length).toBeGreaterThan(0);

    // And this is the limit of the claim: no icon has mounted yet, so nothing
    // above says the gallery is provider-free once the pager appears.
    expect(nodes.filter((node) => node.type === 'Svg')).toHaveLength(0);
  });

  it('but a Bloom ICON still requires the provider, which the pager renders three of', () => {
    // Measured directly, since the gallery's own icon path is unreachable here.
    // `useCommonSVGProps` calls `useTheme()` unconditionally — an explicit
    // `fill` only decides the colour, it does not skip the hook.
    expectThrows(<ShareIcon fill="#fff" size="md" />, /BloomThemeProvider/);
  });
});
