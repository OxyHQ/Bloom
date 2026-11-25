/**
 * What a missing `BloomThemeProvider` actually costs the image gallery.
 *
 * `ZoomableMediaGallery` used to bind `useTheme()` and never read the result.
 * The waste was the smaller half: `useTheme` THROWS outside the provider, so an
 * unread binding is a hard requirement imposed for nothing.
 *
 * The binding is gone. This file records what that did and did NOT buy, because
 * the gallery's chrome — three Bloom icons — no longer requires one either: an
 * icon reads its default fill from the colour tokens (`useCommonSVGProps`),
 * which outside any provider answer Bloom's default palette instead of
 * throwing. What still requires the provider is the opt-in page appearance.
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

  it('a Bloom icon renders with no provider, on the default palette', () => {
    // `useCommonSVGProps` reads the colour tokens, which fall back to Bloom's
    // default palette outside a provider rather than throwing as `useTheme()` did.
    expect(() => render(<ShareIcon fill="#fff" size="md" />)).not.toThrow();
  });
});
