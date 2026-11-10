import React, { createRef } from 'react';
import * as RN from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiSettings6Line } from '../icons/remix';
import { SettingsModal } from '../settings-modal';
import { SettingsPageActions } from '../settings-modal';
import type { SettingsModalProps } from '../settings-modal';
import type { DialogControlProps, DialogControlRefProps } from '../dialog/types';
import { pressHost } from './support/press-host';

let mockWeb = false;
let mockAndroidBack: (() => boolean) | undefined;
jest.mock('react-native', () => ({
  __esModule: true,
  ...jest.requireActual('../../__mocks__/react-native'),
  useWindowDimensions: jest.fn(),
  BackHandler: {
    addEventListener: jest.fn((_name, callback) => {
      mockAndroidBack = callback;
      return { remove: jest.fn() };
    }),
  },
}));
jest.mock('../settings-modal/web-css', () => ({
  get IS_WEB() {
    return mockWeb;
  },
  useSettingsWebCss: () => {},
}));
jest.mock('../settings-modal/modal-portal', () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) => children,
}));
const groups = [
  {
    label: 'Settings',
    items: [
      { key: 'a', label: 'A', page: 'a', icon: RiSettings6Line },
      { key: 'b', label: 'B', page: 'b', icon: RiSettings6Line },
    ],
  },
];

function Editable({ onSave }: { onSave: () => void }) {
  const [dirty, setDirty] = React.useState(false);
  const actions = React.useMemo(
    () => [
      { key: 'cancel', label: 'Cancel', onPress: () => setDirty(false), disabled: !dirty },
      { key: 'save', label: 'Save', onPress: onSave, disabled: !dirty },
    ],
    [dirty, onSave],
  );
  return (
    <>
      <SettingsPageActions label="Page actions" actions={actions} />
      <RN.Pressable testID="edit" onPress={() => setDirty(true)}>
        <RN.Text>edit</RN.Text>
      </RN.Pressable>
    </>
  );
}
const pages = {
  a: { title: 'A', content: <Editable onSave={() => {}} /> },
  b: { title: 'B', content: <RN.Text>other content</RN.Text> },
};
const render_ = (props: Partial<SettingsModalProps> = {}) =>
  render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <SettingsModal open groups={groups} pages={pages} testID="settings" {...props} />
    </BloomThemeProvider>,
  );
beforeEach(() => {
  jest.useFakeTimers();
  jest
    .mocked(RN.useWindowDimensions)
    .mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });
});
afterEach(() => jest.useRealTimers());

it("shows a page's actions in the page header, and takes them away with the page", () => {
  const view = render_();
  act(() => {
    jest.advanceTimersByTime(400);
  });
  expect(view.getByTestId('settings-action-save')).toBeTruthy();
  expect(
    view.getByTestId('settings-action-save').props['aria-disabled'] ??
      view.getByTestId('settings-action-save').props.accessibilityState?.disabled,
  ).toBeTruthy();
  pressHost(view.getByTestId('edit'));
  expect(
    view.getByTestId('settings-action-save').props.accessibilityState?.disabled ??
      view.getByTestId('settings-action-save').props['aria-disabled'],
  ).toBeFalsy();
});
