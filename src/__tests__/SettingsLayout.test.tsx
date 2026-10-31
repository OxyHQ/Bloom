import { Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { AppShell } from '../app-shell';
import { RiSchoolLine, RiSettings6Line } from '../icons/remix';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import {
  SettingsLayout,
  settingsLayoutFor,
  useSettingsSavedToast,
  type SettingsLayoutProps,
  type SettingsNavGroup,
} from '../settings-modal';
import { useSettingsLayout } from '../settings-modal/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

const GROUPS: SettingsNavGroup[] = [
  {
    label: 'Settings',
    items: [
      { key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' },
      { key: 'profile', label: 'Profile', icon: RiSchoolLine, page: 'profile' },
    ],
  },
];

let shownLayout: string | null = null;
function LayoutProbe() {
  shownLayout = useSettingsLayout();
  const showSaved = useSettingsSavedToast();
  return (
    <RNText testID="save" onPress={showSaved}>
      general body
    </RNText>
  );
}

const PAGES = {
  general: { title: 'General', content: <LayoutProbe /> },
  profile: { title: 'Profile', content: <RNText>profile body</RNText> },
};

function setWindow(width: number) {
  mockWindowSize({ width, height: 800, scale: 1, fontScale: 1 });
}

afterEach(() => {
  jest.restoreAllMocks();
  shownLayout = null;
});

function layout(
  props: Partial<SettingsLayoutProps> = {},
  adapter: PlatformSurfaceAdapter | null = null,
) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PlatformSurfaceProvider value={adapter}>
        <SettingsLayout groups={GROUPS} pages={PAGES} testID="settings" {...props} />
      </PlatformSurfaceProvider>
    </BloomThemeProvider>,
  );
}

/** The host views above a node, nearest first. */
function hostAncestors(node: ReactTestInstance): ReactTestInstance[] {
  const out: ReactTestInstance[] = [];
  for (let parent = node.parent; parent; parent = parent.parent)
    if (typeof parent.type === 'string') out.push(parent);
  return out;
}

/** The layout pass the host gives the layout's own box. */
function layOut(screen: ReturnType<typeof render>, width: number) {
  act(() => {
    fireEvent(screen.getByTestId('settings'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height: 600 } },
    });
  });
}

describe('SettingsLayout', () => {
  it('lays out from its own width: compact in a box narrower than 640, in a wide window', () => {
    setWindow(1280);
    const screen = layout();
    // Before its first layout it takes the window's: side by side.
    expect(shownLayout).toBe('regular');
    expect(screen.getByText('general body')).toBeTruthy();
    layOut(screen, 500);
    // The section list, its rows leading to pages.
    expect(screen.queryByText('general body')).toBeNull();
    expect(screen.getByTestId('settings-nav-general')).toBeTruthy();
    fireEvent.press(screen.getByTestId('settings-nav-general'));
    expect(shownLayout).toBe('compact');
    expect(screen.getByText('general body')).toBeTruthy();
  });

  it('goes side by side in a wide box inside a narrow window', () => {
    setWindow(390);
    const screen = layout();
    layOut(screen, 1000);
    expect(shownLayout).toBe('regular');
    expect(screen.getByTestId('settings-rail')).toBeTruthy();
    layOut(screen, 700);
    expect(shownLayout).toBe('medium');
    expect(resolvedStyle(screen.getByTestId('settings-rail').props.style).width).toBe(220);
  });

  it('follows the layout its host decides', () => {
    setWindow(1280);
    const screen = layout({ layout: 'compact' });
    layOut(screen, 1000);
    expect(screen.queryByText('general body')).toBeNull();
    expect(settingsLayoutFor(1000)).toBe('regular');
  });

  it('has no close button without onClose, and one that asks first with it', () => {
    setWindow(1280);
    const without = layout();
    expect(without.queryByTestId('settings-close')).toBeNull();
    without.unmount();

    const close = jest.fn();
    const leave = jest.fn(() => false);
    const screen = layout({ onClose: close, onBeforeLeave: leave });
    fireEvent.press(screen.getByTestId('settings-close'));
    expect(leave).toHaveBeenCalledWith('close');
    expect(close).not.toHaveBeenCalled();
    leave.mockReturnValue(true);
    fireEvent.press(screen.getByTestId('settings-close'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('hands a page that draws its own header no close request without onClose', () => {
    setWindow(1280);
    const seen = jest.fn();
    layout({
      pages: {
        general: {
          title: 'General',
          fullBleed: true,
          content: (navigation) => {
            seen(navigation);
            return <RNText>catalog</RNText>;
          },
        },
      },
    });
    expect(seen).toHaveBeenLastCalledWith(
      expect.objectContaining({ onClose: undefined, closeLabel: 'Close settings' }),
    );
  });

  it('selects pages and shows the saved toast inside its box', () => {
    jest.useFakeTimers();
    try {
      setWindow(1280);
      const pageChange = jest.fn();
      const screen = layout({ onPageChange: pageChange });
      fireEvent.press(screen.getByTestId('save'));
      expect(resolvedStyle(screen.getByTestId('settings-saved').props.style).opacity).toBe(1);
      // Its row sits inside the box, not straddling its edge as the modal's does.
      const [row] = hostAncestors(screen.getByTestId('settings-saved'));
      expect(resolvedStyle(row?.props.style).bottom).toBeGreaterThan(0);
      fireEvent.press(screen.getByTestId('settings-nav-profile'));
      expect(pageChange).toHaveBeenCalledWith('profile');
      expect(screen.getByText('profile body')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  describe('as a window', () => {
    it('without the capability, draws no controls and keeps no room', () => {
      setWindow(1280);
      const screen = layout({}, null);
      expect(screen.queryByTestId('settings-window-controls')).toBeNull();
      expect(screen.queryByTestId('settings-rail-window-band')).toBeNull();
    });

    it('puts the controls at the rail top, which keeps their room and moves the window', () => {
      setWindow(1280);
      const { window, adapter } = fakeWindow();
      const screen = layout({}, adapter);
      expect(screen.getByTestId('settings-window-controls')).toBeTruthy();
      const band = screen.getByTestId('settings-rail-window-band');
      expect(resolvedStyle(band.props.style).height).toBe(52);
      fireEvent(band, 'responderGrant');
      expect(window.startMove).toHaveBeenCalledTimes(1);
      // The rows scroll below the band, inside the rail.
      expect(
        screen.getByTestId('settings-rail').findByProps({ testID: 'settings-nav-general' }),
      ).toBeTruthy();
    });

    it('narrow, the header keeps the room at its leading edge', () => {
      setWindow(1280);
      const screen = layout({}, fakeWindow().adapter);
      layOut(screen, 500);
      expect(screen.queryByTestId('settings-rail-window-band')).toBeNull();
      // The header's own box is inside the toolbar that keeps the room.
      const toolbar = hostAncestors(screen.getByTestId('settings-header')).find(
        (node) => node.props.onStartShouldSetResponder !== undefined,
      );
      expect(resolvedStyle(toolbar?.props.style).paddingInlineStart).toBe(88);
    });

    it('`windowControls="none"`: a panel away from the window corner', () => {
      setWindow(1280);
      const screen = layout({ windowControls: 'none' }, fakeWindow().adapter);
      expect(screen.queryByTestId('settings-window-controls')).toBeNull();
      expect(screen.queryByTestId('settings-rail-window-band')).toBeNull();
    });

    it('inside a shell that holds the window corner, is a panel', () => {
      setWindow(1280);
      const screen = render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <PlatformSurfaceProvider value={fakeWindow().adapter}>
            <AppShell testID="shell" title="Mail">
              <SettingsLayout groups={GROUPS} pages={PAGES} testID="settings" />
            </AppShell>
          </PlatformSurfaceProvider>
        </BloomThemeProvider>,
      );
      expect(screen.getAllByLabelText('Close')).toHaveLength(1);
      expect(screen.queryByTestId('settings-window-controls')).toBeNull();
      expect(screen.queryByTestId('settings-rail-window-band')).toBeNull();
    });

    it('full screen: neither controls nor room', () => {
      setWindow(1280);
      const screen = layout({}, fakeWindow({ state: { fullscreen: true } }).adapter);
      expect(screen.queryByTestId('settings-window-controls')).toBeNull();
      expect(screen.queryByTestId('settings-rail-window-band')).toBeNull();
    });
  });
});
