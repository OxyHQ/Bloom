/**
 * Every word the page frame speaks can be replaced.
 *
 * `AppShell` and `Sidebar` name their own controls — the collapse toggle, the
 * drawer's close targets, the landmark, the search field. An app that ships
 * Arabic could not translate them: they were literals, so a screen reader read
 * English inside an otherwise translated UI. Each is now a prop defaulting to
 * the English it replaced, and this pins BOTH halves: the default is unchanged
 * for every existing consumer, and the override reaches the node.
 */

import React from 'react';
import * as ReactNative from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { AppShell } from '../app-shell';
import { RiHomeLine } from '../icons/remix';
import { PortalOutlet, PortalProvider } from '../portal';
import { Sidebar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
}

function setWidth(width: number) {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

afterEach(() => jest.restoreAllMocks());

describe('Sidebar labels', () => {
  it('defaults to the English it always spoke', () => {
    const screen = renderIn(<Sidebar testID="sb" items={NAV} />);
    expect(screen.getByTestId('sb').props.accessibilityLabel).toBe('Sidebar');
    expect(screen.getByTestId('sidebar-collapse').props.accessibilityLabel).toBe('Collapse sidebar');
    fireEvent.press(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar-collapse').props.accessibilityLabel).toBe('Expand sidebar');
  });

  it('names the landmark and both states of the collapse control from props', () => {
    const screen = renderIn(
      <Sidebar testID="sb" items={NAV} accessibilityLabel="الشريط الجانبي" collapseLabel="طي الشريط" expandLabel="توسيع الشريط" />,
    );
    expect(screen.getByTestId('sb').props.accessibilityLabel).toBe('الشريط الجانبي');
    expect(screen.getByTestId('sidebar-collapse').props.accessibilityLabel).toBe('طي الشريط');
    fireEvent.press(screen.getByTestId('sidebar-collapse'));
    expect(screen.getByTestId('sidebar-collapse').props.accessibilityLabel).toBe('توسيع الشريط');
  });

  it('names the rail landmark from the same prop', () => {
    const rail = renderIn(<Sidebar testID="rail" variant="rail" items={NAV} accessibilityLabel="التنقل" />);
    expect(rail.getByTestId('rail').props.accessibilityLabel).toBe('التنقل');
    rail.unmount();
    expect(renderIn(<Sidebar testID="rail" variant="rail" items={NAV} />).getByTestId('rail').props.accessibilityLabel).toBe('Sidebar');
  });

  it('names the mobile close button', () => {
    expect(renderIn(<Sidebar items={NAV} mobile onClose={() => {}} />).getByTestId('sidebar-close').props.accessibilityLabel).toBe('Close sidebar');
    expect(renderIn(<Sidebar items={NAV} mobile onClose={() => {}} closeLabel="إغلاق" />).getByTestId('sidebar-close').props.accessibilityLabel).toBe('إغلاق');
  });

  it('names the search button, field and clear control', () => {
    const screen = renderIn(
      <Sidebar items={NAV} searchLabel="بحث سريع" filterLabel="تصفية التنقل" clearSearchLabel="مسح البحث" />,
    );
    fireEvent.press(screen.getByLabelText('بحث سريع'));
    expect(screen.getByTestId('sidebar-search-input').props.accessibilityLabel).toBe('تصفية التنقل');
    expect(screen.getByLabelText('مسح البحث')).toBeTruthy();
  });

  it('keeps the search field defaults', () => {
    const screen = renderIn(<Sidebar items={NAV} />);
    fireEvent.press(screen.getByLabelText('Quick Search'));
    expect(screen.getByTestId('sidebar-search-input').props.accessibilityLabel).toBe('Filter navigation');
    expect(screen.getByLabelText('Clear navigation search')).toBeTruthy();
  });

  it('names the flat mobile header search button', () => {
    const plain = (label?: string) => renderIn(<Sidebar items={NAV} mobile surface="plain" onClose={() => {}} searchButtonLabel={label} />);
    expect(plain().getByLabelText('Search')).toBeTruthy();
    expect(plain('ابحث').getByLabelText('ابحث')).toBeTruthy();
  });
});

describe('AppShell drawer labels', () => {
  it('defaults: "Open navigation" on the hamburger, "Close navigation" on the backdrop', () => {
    setWidth(700);
    const screen = renderIn(<AppShell testID="shell" title="Home" sidebar={{ items: NAV }} />);
    expect(screen.getByTestId('shell-header-menu').props.accessibilityLabel).toBe('Open navigation');
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(screen.getAllByLabelText('Close navigation').length).toBeGreaterThan(0);
  });

  it('overlay drawer: both labels come from props, and the sidebar\'s close button from sidebar.closeLabel', () => {
    setWidth(700);
    const screen = renderIn(
      <AppShell testID="shell" title="Home" drawerOpenLabel="فتح التنقل" drawerCloseLabel="إغلاق التنقل"
        sidebar={{ items: NAV, closeLabel: 'إغلاق الشريط' }} />,
    );
    expect(screen.getByTestId('shell-header-menu').props.accessibilityLabel).toBe('فتح التنقل');
    fireEvent.press(screen.getByTestId('shell-header-menu'));
    expect(screen.getAllByLabelText('إغلاق التنقل').length).toBeGreaterThan(0);
    expect(screen.queryAllByLabelText('Close navigation')).toHaveLength(0);
    expect(screen.getByTestId('sidebar-close').props.accessibilityLabel).toBe('إغلاق الشريط');
  });

  it.each(['dashboard', 'feed'] as const)('%s reveal: the page veil is named from drawerCloseLabel', variant => {
    setWidth(390);
    const screen = renderIn(
      <AppShell testID="shell" variant={variant} drawer="reveal" drawerOpen drawerCloseLabel="إغلاق التنقل" sidebar={{ items: NAV }} />,
    );
    expect(screen.getByTestId('shell-veil').props.accessibilityLabel).toBe('إغلاق التنقل');
  });
});
