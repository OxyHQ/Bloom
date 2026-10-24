/**
 * An open, idle settings modal does no work.
 *
 * Measured on a Pixel 10 Pro and a Pixel 8a (Allo, Bloom 15.48.0): with the
 * modal open and untouched, `dumpsys gfxinfo` counted 601 frames in 5 s — every
 * vsync at 120 Hz — at ~146 % CPU, and uiautomator never reached idle. Closed:
 * 0 frames. The cause was the saved toast, which is mounted (at opacity 0) for
 * as long as the modal is: it centred itself with `marginLeft: -width / 2` from
 * its own `onLayout`. Yoga rounds a width as round(right) - round(left), so half
 * a width of movement flips the rounded width by a device pixel, which moves
 * the edge back — and Fabric reports every frame change. Jest has no layout
 * pass, so the suite never saw it.
 *
 * These cases supply the layout pass: Fabric's pixel grid, applied to the
 * toast, and a census that no host's own `onLayout` rewrites that host's own
 * position or size (the shape of the feedback, wherever it would come from).
 */
import React from 'react';
import * as ReactNative from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiSettings6Line } from '../icons/remix';
import { SettingsModal } from '../settings-modal';
import { OverlayInertBoundary, PortalOutlet, PortalProvider } from '../portal';
import { Dialog } from '../dialog/Dialog';
import { useDialogControl } from '../dialog/context';

jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: jest.requireActual('../portal').Portal,
}));

const GROUPS = [
  {
    label: 'Settings',
    items: [{ key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' }],
  },
];

const DENSITY = 2.625; // Pixel 8a
const SCREEN_PX = 1080;

/** Yoga's `roundValueToPixelGrid`, round half up. */
const roundPx = (value: number) => Math.floor(value + 0.5);

function renderOpenModal(initialView: 'navigation' | 'page') {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
    width: SCREEN_PX / DENSITY,
    height: 2400 / DENSITY,
    scale: DENSITY,
    fontScale: 1,
  });
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        <OverlayInertBoundary>
          <SettingsModal
            open
            testID="settings"
            onClose={() => {}}
            groups={GROUPS}
            pages={{ general: { title: 'General', content: <RNText>body</RNText> } }}
            initialView={initialView}
          />
        </OverlayInertBoundary>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  return screen;
}

const LAYOUT_KEYS = [
  'position',
  'left',
  'right',
  'top',
  'bottom',
  'start',
  'end',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'flexBasis',
] as const;

function layoutStyle(node: ReactTestInstance): string {
  const flat = (StyleSheet.flatten(node.props.style) ?? {}) as Record<string, unknown>;
  return JSON.stringify(LAYOUT_KEYS.map((key) => flat[key]));
}

function toast(screen: ReturnType<typeof render>): ReactTestInstance {
  return screen.UNSAFE_root.findAll(
    (node) => node.props.testID === 'settings-saved' && typeof node.props.onLayout === 'function',
  )[0] as ReactTestInstance;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('an idle open SettingsModal', () => {
  it('the saved toast settles on the pixel grid for every label width', () => {
    for (const textPx of [100, 101, 137, 200, 201]) {
      const screen = renderOpenModal('navigation');
      // Border 2 + padding 16 + icon 16 + gap 4 dp, plus the label in whole px.
      const widthPx = 38 * DENSITY + textPx;
      let events = 0;
      let last = '';
      for (; events < 20; events++) {
        const host = toast(screen);
        const flat = (StyleSheet.flatten(host.props.style) ?? {}) as Record<string, number>;
        // Whatever centring the style asks for, applied the way Yoga would: a
        // `left: 50%` + `marginLeft` pair, or a centred row (no offset at all).
        const leftPx =
          typeof flat.marginLeft === 'number'
            ? SCREEN_PX / 2 + flat.marginLeft * DENSITY
            : (SCREEN_PX - widthPx) / 2;
        const x = roundPx(leftPx) / DENSITY;
        const width = (roundPx(leftPx + widthPx) - roundPx(leftPx)) / DENSITY;
        const frame = `${x},${width}`;
        // Fabric dispatches `onLayout` only for a changed frame.
        if (frame === last) break;
        last = frame;
        act(() => {
          fireEvent(host, 'layout', { nativeEvent: { layout: { x, y: 800, width, height: 26 } } });
        });
      }
      // The label width rides along so a failure names the one that looped.
      expect([textPx, events <= 2]).toEqual([textPx, true]);
      screen.unmount();
    }
  });

  it.each(['navigation', 'page'] as const)(
    'no host’s own onLayout moves or resizes that host (%s view)',
    (view) => {
      const screen = renderOpenModal(view);
      const hosts = screen.UNSAFE_root.findAll(
        (node) => typeof node.type === 'string' && typeof node.props.onLayout === 'function',
      );
      expect(hosts.length).toBeGreaterThan(0);
      for (const host of hosts) {
        const before = layoutStyle(host);
        for (const width of [76.19, 76.57, 120.4]) {
          act(() => {
            host.props.onLayout({
              nativeEvent: { layout: { x: 3.1, y: 7.3, width, height: width / 3 } },
            });
          });
        }
        expect({ testID: host.props.testID, style: layoutStyle(host) }).toEqual({
          testID: host.props.testID,
          style: before,
        });
      }
    },
  );
});

describe('the same census over the other open surfaces', () => {
  function OpenDialog({ placement }: { placement: 'center' | 'bottom' | 'right' }) {
    const control = useDialogControl();
    React.useEffect(() => control.open(), [control]);
    return (
      <Dialog control={control} label="Dialog" placement={placement} header={{ title: 'Title' }}>
        <RNText>body</RNText>
      </Dialog>
    );
  }

  it.each(['center', 'bottom', 'right'] as const)('Dialog placement %s', (placement) => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PortalProvider>
          <OpenDialog placement={placement} />
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    const hosts = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && typeof node.props.onLayout === 'function',
    );
    for (const host of hosts) {
      const before = layoutStyle(host);
      for (const width of [76.19, 76.57, 120.4]) {
        act(() => {
          host.props.onLayout({
            nativeEvent: { layout: { x: 3.1, y: 7.3, width, height: width / 3 } },
          });
        });
      }
      expect({ testID: host.props.testID, style: layoutStyle(host) }).toEqual({
        testID: host.props.testID,
        style: before,
      });
    }
  });
});
