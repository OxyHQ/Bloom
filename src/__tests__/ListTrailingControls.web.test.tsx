/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../button/index.web';
import { RiInformationLine } from '../icons/remix/RiInformationLine';
import { ListItem } from '../list/index.web';
import type { ListItemProps } from '../list/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const rn = jest.requireActual('react-native-web');
  return {
    __esModule: true,
    ...base,
    default: { ...base.default, View: rn.View, Text: rn.Text, ScrollView: rn.ScrollView },
    ScrollView: rn.ScrollView,
  };
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const noop = () => {};
const cases: Array<[string, ListItemProps]> = [
  ['person action', { person: { name: 'Ana', onAction: noop } }],
  [
    'call action',
    { call: { name: 'Ana', direction: 'incoming', meta: 'Today', onCallBack: noop } },
  ],
  ['mail star', { mail: { sender: { name: 'Ana' }, subject: 'Hello', onStarredChange: noop } }],
];
function renderRow(props: ListItemProps) {
  act(() =>
    root.render(
      <BloomThemeProvider>
        <ListItem
          {...props}
          onPress={noop}
          actions={[{ key: 'more', label: 'Details', icon: RiInformationLine }]}
          testID="row"
        />
      </BloomThemeProvider>,
    ),
  );
}

it.each(cases)('%s is persistent content and reserves its menu space', (_label, props) => {
  renderRow(props);
  expect(host.querySelector('[data-bloom-list-meta]')).toBeNull();
  expect(host.querySelector('[data-bloom-list-actions="persistent"]')).not.toBeNull();
});

it.each([
  ['generic', {}],
  ['conversation', { conversation: { name: 'Ana', time: '09:41' } }],
  ['mail', { mail: { sender: { name: 'Ana' }, subject: 'Hello', time: '09:41' } }],
  ...cases,
] as Array<[string, ListItemProps]>)(
  '%s caller trailing overrides are never passive metadata',
  (_label, props) => {
    renderRow({
      ...props,
      trailing: (
        <Button onPress={noop} testID="custom">
          Follow
        </Button>
      ),
    });
    expect(host.querySelector('[data-testid="custom"]')).not.toBeNull();
    expect(host.querySelector('[data-bloom-list-meta]')).toBeNull();
    expect(host.querySelector('[data-bloom-list-actions="persistent"]')).not.toBeNull();
  },
);

it.each([
  { conversation: { name: 'Ana', time: '09:41', unreadCount: 2 } },
  { mail: { sender: { name: 'Ana' }, subject: 'Hello', time: '09:41' } },
] satisfies ListItemProps[])(
  'renderer-owned passive metadata still yields to commands: %j',
  (props) => {
    renderRow(props);
    expect(host.querySelector('[data-bloom-list-meta]')?.textContent).toContain('09:41');
    expect(host.querySelector('[data-bloom-list-actions="persistent"]')).toBeNull();
  },
);
