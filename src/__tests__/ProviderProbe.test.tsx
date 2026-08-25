/**
 * What a missing `BloomThemeProvider` actually costs the image gallery.
 *
 * `ZoomableMediaGallery` used to bind `useTheme()` and never read the result.
 * The waste was the smaller half: `useTheme` THROWS outside the provider, so an
 * unread binding is a hard requirement imposed for nothing.
 *
 * The binding is gone. This file records what that did and did NOT buy, because
 * the obvious conclusion — "the gallery no longer needs a provider" — is wrong:
 * once the pager mounts, the gallery renders three Bloom icons, and every Bloom
 * icon calls `useTheme()` unconditionally through `useCommonSVGProps`. So the
 * requirement survives; it just moved to something that genuinely uses the hook.
 *
 * The icon path is NOT reachable from here — all three icons sit behind
 * `pagerReady`, which is set when the open animation settles, and that animation
 * does not run in this environment. Rather than assert something this
 * environment cannot see, the last test measures the icons DIRECTLY.
 */
import React, { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

import { PortalProvider, PortalOutlet } from '../portal';
import { useTheme } from '../theme/use-theme';
import { ZoomableMediaGallery } from '../zoomable-media-gallery';
import type { ZoomableMediaGalleryHandle } from '../zoomable-media-gallery';
import { ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon } from '../icons';
import { hostNodes } from './support/rendered-style';

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

  it('the gallery mounts closed with no provider', () => {
    expect(() => renderGallery()).not.toThrow();
  });

  it('the gallery opens with no provider, as far as the pager', () => {
    const { ref, toJSON } = renderGallery();
    expect(() => {
      act(() => {
        ref.current?.open(IMAGES, 0);
      });
    }).not.toThrow();

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
