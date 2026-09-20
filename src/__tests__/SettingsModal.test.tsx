import React, { useState } from 'react';
import * as ReactNative from 'react-native';
import { Text as RNText } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { RiSchoolLine, RiSettings6Line, RiToolsFill } from '../icons/remix';
import {
  SettingsCard,
  SettingsModal,
  SettingsRow,
  SettingsServerList,
  SettingsTextField,
  SettingsValueField,
  useSettingsSavedToast,
} from '../settings-modal';
import type { SettingsNavGroup } from '../settings-modal';
import { resolveSettingsPalette } from '../settings-modal/palette';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

// The web portal is a react-dom portal (no DOM here); render in place.
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));

const GROUPS: SettingsNavGroup[] = [
  {
    label: 'Settings',
    items: [
      { key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' },
      { key: 'profile', label: 'Profile', icon: RiSchoolLine, page: 'profile' },
      { key: 'billing', label: 'Billing', icon: RiToolsFill },
    ],
  },
];

function SaveButton() {
  const showSaved = useSettingsSavedToast();
  return (
    <RNText testID="save" onPress={showSaved}>
      save
    </RNText>
  );
}

const PAGES = {
  general: { title: 'General', content: <RNText>general body</RNText> },
  profile: { title: 'Profile', content: <SaveButton /> },
};

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Controlled({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <SettingsModal
      open={open}
      onClose={() => {
        onClose?.();
        setOpen(false);
      }}
      groups={GROUPS}
      pages={PAGES}
      testID="settings"
    />
  );
}

/** The modal's layout comes from the window width; jest's mock window is a 375px phone. */
function setWindow(width: number, height: number) {
  jest
    .spyOn(ReactNative, 'useWindowDimensions')
    .mockReturnValue({ width, height, scale: 1, fontScale: 1 });
}

beforeEach(() => {
  jest.useFakeTimers();
  // Desktop by default — the shell tests pin the regular geometry.
  setWindow(1280, 800);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function flush() {
  act(() => {
    jest.advanceTimersByTime(400);
  });
}

describe('SettingsModal shell', () => {
  it("keeps the regular geometry: 871×614 panel, radius 24, 274 rail with p 10 and a right hairline", () => {
    const { getByTestId } = renderWithTheme(<Controlled />);
    flush();
    const panel = resolvedStyle(getByTestId('settings').props.style);
    expect(panel).toMatchObject({ borderRadius: 24, overflow: 'hidden', flexDirection: 'row' });
    expect(panel.width).toBeLessThanOrEqual(871);
    expect(panel.height).toBeLessThanOrEqual(614);
    const rail = resolvedStyle(getByTestId('settings-rail').props.style);
    expect(rail).toMatchObject({ width: 274, borderRightWidth: 1 });
    const railContent = resolvedStyle(getByTestId('settings-rail').props.contentContainerStyle);
    expect(railContent).toMatchObject({ padding: 10, gap: 20 });
    const titleRow = resolvedStyle(getByTestId('settings-title-row').props.style);
    expect(titleRow).toMatchObject({ paddingLeft: 32, paddingRight: 32, paddingTop: 32, paddingBottom: 12 });
    expect(titleRow.paddingHorizontal).toBeUndefined();
  });

  it('names the dialog and its controls, and marks the selected rail row', () => {
    const { getByTestId, getByRole } = renderWithTheme(<Controlled />);
    flush();
    expect(getByTestId('settings').props['aria-label']).toBe('Settings');
    expect(getByTestId('settings').props.role).toBe('dialog');
    const general = getByTestId('settings-nav-general');
    expect(general.props.accessibilityLabel).toBe('General');
    expect(general.props.accessibilityState).toMatchObject({ selected: true });
    expect(getByTestId('settings-nav-profile').props.accessibilityState).toMatchObject({ selected: false });
    expect(getByTestId('settings-close').props.accessibilityLabel).toBe('Close settings');
    expect(getByRole('heading').props.children).toBe('General');
  });

  it('switches pages from the rail; rows without a page do not navigate', () => {
    const { getByTestId, getByText, queryByText } = renderWithTheme(<Controlled />);
    flush();
    expect(getByText('general body')).toBeTruthy();
    pressHost(getByTestId('settings-nav-profile'));
    expect(queryByText('general body')).toBeNull();
    expect(getByTestId('settings-nav-profile').props.accessibilityState).toMatchObject({ selected: true });
    // Billing has no page: pressing it leaves Profile selected.
    fireEvent.press(getByTestId('settings-nav-billing'));
    expect(getByTestId('settings-nav-profile').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('paints the selected row background/secondary/hover (neutral-200 light)', () => {
    const { getByTestId } = renderWithTheme(<Controlled />);
    flush();
    const theme = buildTheme('teal', 'light');
    const { colors } = theme;
    const row = resolvedStyle(getByTestId('settings-nav-general').props.style);
    expect(row).toMatchObject({ padding: 8, borderRadius: 10, gap: 8, backgroundColor: colors.backgroundTertiary });
    expect(resolvedStyle(getByTestId('settings-nav-profile').props.style).backgroundColor).toBe('transparent');
  });

  it('requests close from the close button and unmounts once closed', () => {
    const onClose = jest.fn();
    const { getByTestId, queryByTestId } = renderWithTheme(<Controlled onClose={onClose} />);
    flush();
    pressHost(getByTestId('settings-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    flush();
    expect(queryByTestId('settings')).toBeNull();
  });

  it('shows the saved toast when a page reports a save, then hides it', () => {
    const { getByTestId } = renderWithTheme(<Controlled />);
    flush();
    pressHost(getByTestId('settings-nav-profile'));
    const toast = () => resolvedStyle(getByTestId('settings-saved', { includeHiddenElements: true }).props.style);
    expect(toast().opacity).toBe(0);
    act(() => {
      getByTestId('save').props.onPress();
    });
    expect(toast().opacity).toBe(1);
    expect(toast()).toMatchObject({ borderWidth: 1, paddingLeft: 6, paddingRight: 10, paddingTop: 4, gap: 4 });
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(toast().opacity).toBe(0);
  });
});

describe('SettingsModal responsive layout', () => {
  it('narrows the rail and the insets on a medium window', () => {
    setWindow(768, 900);
    const { getByTestId } = renderWithTheme(<Controlled />);
    flush();
    expect(resolvedStyle(getByTestId('settings-rail').props.style)).toMatchObject({ width: 220 });
    expect(resolvedStyle(getByTestId('settings-title-row').props.style)).toMatchObject({
      paddingLeft: 24,
      paddingTop: 24,
    });
    // Still a floating panel with the viewport gutter.
    expect(resolvedStyle(getByTestId('settings').props.style)).toMatchObject({ width: 736, borderRadius: 24 });
  });

  it('goes full screen on a phone: section list first, then a page with a back button', () => {
    setWindow(375, 812);
    const { getByTestId, getByText, queryByText, queryByTestId } = renderWithTheme(<Controlled />);
    flush();
    const panel = resolvedStyle(getByTestId('settings').props.style);
    expect(panel).toMatchObject({ width: 375, height: 812, borderRadius: 0 });
    // The list: every section, nothing selected, no page body yet, no back button.
    expect(getByTestId('settings-nav-general').props.accessibilityState).toMatchObject({ selected: false });
    expect(queryByText('general body')).toBeNull();
    expect(queryByTestId('settings-back')).toBeNull();

    pressHost(getByTestId('settings-nav-general'));
    expect(getByText('general body')).toBeTruthy();
    expect(queryByTestId('settings-rail')).toBeNull();

    pressHost(getByTestId('settings-back'));
    expect(queryByText('general body')).toBeNull();
    expect(getByTestId('settings-rail')).toBeTruthy();
  });

  it('stacks a row control under its label when it cannot fit beside it (compact)', () => {
    setWindow(375, 812);
    const pages = {
      general: {
        title: 'General',
        content: (
          <SettingsCard>
            <SettingsRow label="Device ID" testID="row">
              <SettingsValueField>593e2611</SettingsValueField>
            </SettingsRow>
          </SettingsCard>
        ),
      },
    };
    const { getByTestId } = renderWithTheme(
      <SettingsModal open onClose={() => {}} groups={GROUPS} pages={pages} testID="settings" />,
    );
    flush();
    pressHost(getByTestId('settings-nav-general'));
    expect(resolvedStyle(getByTestId('row').props.style)).toMatchObject({ flexWrap: 'wrap' });
  });
});

describe('SettingsCard rows', () => {
  it('draws a hairline under every row except the last, with the 12px card inset', () => {
    const { getByTestId } = renderWithTheme(
      <SettingsCard testID="card">
        <SettingsRow testID="a" label="A" />
        <>
          <SettingsRow testID="b" label="B" description="desc" />
        </>
        <SettingsRow testID="c" label="C">
          <SettingsValueField testID="value">x</SettingsValueField>
        </SettingsRow>
      </SettingsCard>,
    );
    expect(resolvedStyle(getByTestId('card').props.style)).toMatchObject({ borderRadius: 16, paddingLeft: 12 });
    const a = resolvedStyle(getByTestId('a').props.style);
    expect(a).toMatchObject({ borderBottomWidth: 1, minHeight: 52, paddingTop: 10, paddingBottom: 10, paddingRight: 10, gap: 16 });
    expect(resolvedStyle(getByTestId('b').props.style).borderBottomWidth).toBe(1);
    expect(resolvedStyle(getByTestId('c').props.style).borderBottomWidth).toBe(0);
    expect(resolvedStyle(getByTestId('value').props.style)).toMatchObject({ height: 32, width: 202, borderRadius: 10 });
  });

  it('commits a text field only when the value changed', () => {
    const onCommit = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <SettingsTextField label="First name" value="Maya" onCommit={onCommit} />,
    );
    const input = getByLabelText('First name');
    fireEvent(input, 'blur');
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.changeText(input, 'Nate');
    fireEvent(input, 'submitEditing');
    expect(onCommit).toHaveBeenCalledWith('Nate');
  });
});

describe('SettingsServerList', () => {
  it('names the expander and reports its expanded state on both platforms', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <SettingsServerList
        testID="list"
        servers={[
          { id: 'figma', name: 'Figma', status: 'connected', summary: '26 tools', tools: ['get_metadata'] },
          { id: 'astro', name: 'astro', status: 'error' },
        ]}
      />,
    );
    const expand = getByTestId('list-figma-expand');
    expect(expand.props.accessibilityLabel).toBe('Show Figma tools');
    expect(expand.props['aria-expanded']).toBe(false);
    pressHost(expand);
    expect(getByTestId('list-figma-expand').props['aria-expanded']).toBe(true);
    expect(getByTestId('list-figma-expand').props.accessibilityState).toMatchObject({ expanded: true });
    expect(getByLabelText('Show astro output')).toBeTruthy();
    // The error row is last: no hairline.
    expect(resolvedStyle(getByTestId('list-astro').props.style).borderBottomWidth).toBe(0);
    expect(resolvedStyle(getByTestId('list-figma').props.style).borderBottomWidth).toBe(1);
  });
});

describe('palette and helpers', () => {
  it('resolves the surfaces from the canonical roles, light and dark', () => {
    const light = buildTheme('teal', 'light');
    const dark = buildTheme('teal', 'dark');
    const nl = light.colors;
    const nd = dark.colors;
    expect(resolveSettingsPalette(light)).toMatchObject({
      full: light.colors.background,
      secondary: nl.backgroundSecondary,
      secondaryHover: nl.backgroundTertiary,
      tertiary: nl.backgroundTertiary,
      separator: nl.borderLight,
    });
    expect(resolveSettingsPalette(dark)).toMatchObject({
      primary: nd.card,
      secondary: nd.backgroundSecondary,
      secondaryHover: nd.backgroundTertiary,
      separator: nd.borderLight,
      borderButton: nd.border,
    });
  });
});
