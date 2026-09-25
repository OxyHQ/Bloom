/**
 * Screen-reader confinement for modal overlays on NATIVE (OxyHQ/Mention#1126).
 *
 * Android: with the settings modal open, TalkBack still walked into the Home
 * feed behind it. A portaled surface renders at the outlet, the app content's
 * SIBLING, and the only switch TalkBack honours
 * (`importantForAccessibility="no-hide-descendants"`) has to sit on the app's
 * own view. So modal `OverlayRoot`s register in `overlay/modal-registry.ts`,
 * and the app's `OverlayInertBoundary` hides its content while any is open.
 *
 * These pin the registry's counting, the boundary's props on both native
 * platforms, that a NON-modal overlay leaves the content reachable, and which
 * Bloom surfaces declare themselves modal.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { Platform, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { OverlayInertBoundary, OverlayRoot, useModalOverlayActive } from '../overlay';
import {
  activeModalOverlayCount,
  hasActiveModalOverlays,
  registerModalOverlay,
  resetModalOverlays,
  subscribeModalOverlays,
} from '../overlay/modal-registry';
import { resetOverlayStack } from '../overlay/stack';
import * as portalBarrel from '../portal';
import { PortalOutlet, PortalProvider, Portal } from '../portal';
import { findHost } from './support/rendered-style';

afterEach(() => {
  Platform.OS = 'ios';
  resetModalOverlays();
  resetOverlayStack();
});

describe('modal overlay registry', () => {
  it('counts modal mounts and unmounts, and notifies only when the answer flips', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeModalOverlays(listener);

    const releaseA = registerModalOverlay({});
    expect(hasActiveModalOverlays()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    const releaseB = registerModalOverlay({});
    expect(activeModalOverlayCount()).toBe(2);
    // A second modal over the first changes nothing for the content below.
    expect(listener).toHaveBeenCalledTimes(1);

    releaseA();
    expect(hasActiveModalOverlays()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    releaseB();
    expect(hasActiveModalOverlays()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    // A release is idempotent: a second call cannot drive the count below the
    // surfaces still open.
    const releaseC = registerModalOverlay({});
    releaseB();
    expect(activeModalOverlayCount()).toBe(1);
    releaseC();

    unsubscribe();
    registerModalOverlay({});
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('a modal OverlayRoot registers while mounted; a plain one never does', () => {
    const plain = render(<OverlayRoot testID="plain" />);
    expect(activeModalOverlayCount()).toBe(0);

    const modal = render(<OverlayRoot modal testID="modal" />);
    expect(activeModalOverlayCount()).toBe(1);

    const pinned = render(<OverlayRoot modal zIndex={9} testID="pinned" />);
    expect(activeModalOverlayCount()).toBe(2);

    modal.unmount();
    pinned.unmount();
    expect(activeModalOverlayCount()).toBe(0);
    plain.unmount();
  });

  it('useModalOverlayActive follows the registry', () => {
    const seen: boolean[] = [];
    function Probe() {
      seen.push(useModalOverlayActive());
      return null;
    }
    render(<Probe />);
    expect(seen[seen.length - 1]).toBe(false);

    let release = () => {};
    act(() => {
      release = registerModalOverlay({});
    });
    expect(seen[seen.length - 1]).toBe(true);

    act(() => release());
    expect(seen[seen.length - 1]).toBe(false);
  });
});

/** The app root, shaped the way an app mounts it: content, then the outlet. */
function App({ modal, open }: { modal: boolean; open: boolean }) {
  return (
    <PortalProvider>
      <OverlayInertBoundary testID="content">
        <Text>Home feed</Text>
        {open ? (
          <Portal>
            <OverlayRoot modal={modal} testID="surface">
              <Text>Settings</Text>
            </OverlayRoot>
          </Portal>
        ) : null}
      </OverlayInertBoundary>
      <PortalOutlet />
    </PortalProvider>
  );
}

describe('OverlayInertBoundary (native)', () => {
  it('Android: hides the content from TalkBack while a modal is open, and restores it', () => {
    Platform.OS = 'android';
    const screen = render(<App modal open={false} />);
    const content = () => findHost(screen.toJSON(), 'content');

    expect(content()?.props.importantForAccessibility).toBe('auto');
    // Never flattened away: the prop has to exist on a real view the moment
    // it is needed.
    expect(content()?.props.collapsable).toBe(false);

    screen.rerender(<App modal open />);
    expect(content()?.props.importantForAccessibility).toBe('no-hide-descendants');
    // The surface itself is at the outlet, outside the boundary, untouched.
    expect(findHost(screen.toJSON(), 'surface')?.props.importantForAccessibility).toBeUndefined();

    screen.rerender(<App modal open={false} />);
    expect(content()?.props.importantForAccessibility).toBe('auto');
  });

  it('iOS: hides the content alongside accessibilityViewIsModal', () => {
    const screen = render(<App modal open />);
    const content = findHost(screen.toJSON(), 'content');
    expect(content?.props.accessibilityElementsHidden).toBe(true);
    expect(findHost(screen.toJSON(), 'surface')?.props.accessibilityViewIsModal).toBe(true);
  });

  it('a NON-modal overlay (a menu, a popover) leaves the content reachable', () => {
    Platform.OS = 'android';
    const screen = render(<App modal={false} open />);
    const content = findHost(screen.toJSON(), 'content');
    expect(content?.props.importantForAccessibility).toBe('auto');
    expect(content?.props.accessibilityElementsHidden).toBe(false);
  });

  it('fills its parent by default and takes a style override', () => {
    const screen = render(<OverlayInertBoundary testID="b" style={{ flexDirection: 'row' }} />);
    const style = [findHost(screen.toJSON(), 'b')?.props.style].flat(Infinity);
    expect(style).toEqual(expect.arrayContaining([expect.objectContaining({ flex: 1 })]));
    expect(style).toEqual(
      expect.arrayContaining([expect.objectContaining({ flexDirection: 'row' })]),
    );
  });

  it('is offered from the portal subpath the app root already imports', () => {
    expect(portalBarrel.OverlayInertBoundary).toBe(OverlayInertBoundary);
  });
});

describe('which surfaces are modal', () => {
  const code = (rel: string) => readFileSync(join(__dirname, '..', rel), 'utf8');
  const roots = (rel: string) => code(rel).match(/<OverlayRoot\b[^>]*>/g) ?? [];

  // A modal surface dims and blocks the page: a screen reader must not reach
  // what is behind it. Native `BottomSheet` is absent on purpose — its shell is
  // an RN `Modal`, its own window, which already confines the screen reader.
  it.each([
    'dialog/Dialog.tsx',
    'dialog/Dialog.web.tsx',
    'bottom-sheet/BottomSheet.web.tsx',
    'settings-modal/SettingsModal.tsx',
    'zoomable-media-gallery/ZoomableMediaGallery.tsx',
  ])('%s marks every OverlayRoot modal', (rel) => {
    const found = roots(rel);
    expect(found.length).toBeGreaterThan(0);
    for (const tag of found) expect(tag).toMatch(/\bmodal\b/);
  });

  // Anchored and ambient surfaces leave the content under them reachable.
  it.each([
    'floating/FloatingPanel.tsx',
    'tooltip/Tooltip.tsx',
    'tooltip/Tooltip.web.tsx',
    'toast/ToastHost.tsx',
    'media-flight/MediaFlightLayer.tsx',
    'media-flight/MediaFlightLayer.web.tsx',
    'app-shell/AppShellEngine.tsx',
  ])('%s never marks an OverlayRoot modal', (rel) => {
    const found = roots(rel);
    expect(found.length).toBeGreaterThan(0);
    for (const tag of found) expect(tag).not.toMatch(/\bmodal\b/);
  });
});
