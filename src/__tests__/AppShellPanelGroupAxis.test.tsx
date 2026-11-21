// A group whose axis changes (Mention's main panel turns side by side on the
// reels) keeps its panels mounted. On native the group's viewport is a
// ScrollView, and React Native draws a horizontal and a vertical one with
// different native views: switching between them remounted every panel, the
// app's whole navigator with it (its pages, their scroll, the tab pager, whose
// highlight then never slid to the page tapped). Jest's ScrollView is one host
// whatever its direction, so the native view is asserted through the prop
// that picks it.
import { useEffect } from 'react';
import * as ReactNative from 'react-native';
import { render } from '@testing-library/react-native';

import { AppShell, type AppShellPanelDefinition } from '../app-shell';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

let mounts = 0;
function Navigator() {
  useEffect(() => {
    mounts += 1;
  }, []);
  return null;
}

function shell(axis: 'horizontal' | 'vertical') {
  const panels: AppShellPanelDefinition[] = [
    {
      id: 'main',
      role: 'main',
      group: {
        mode: 'split',
        axis,
        flow: 'bounded',
        appearance: 'separated',
        panels: [
          { id: 'main', role: 'main', keepMounted: true, content: <Navigator /> },
          { id: 'main:engagement', role: 'inspector', visible: false, content: null },
        ],
      },
    },
  ];
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        <AppShell testID="shell" layout="feed" header={null} panelLayout={{ panels }} />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

beforeEach(() => {
  mounts = 0;
  jest.replaceProperty(ReactNative.Platform, 'OS', 'android');
  mockWindowSize({ width: 412, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

it.each([
  ['vertical', 'horizontal'],
  ['horizontal', 'vertical'],
] as const)('a group turning from %s to %s keeps its panels mounted', (from, to) => {
  const view = render(shell(from));
  const direction = () => view.getByTestId('shell-panels-main-group-scroll').props.horizontal;
  const before = direction();
  view.rerender(shell(to));
  expect(direction()).toBe(before);
  expect(mounts).toBe(1);
});
