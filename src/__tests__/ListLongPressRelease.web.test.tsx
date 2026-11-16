/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Pressable, type PressableProps } from 'react-native';
import { ListItem } from '../list/index.web';
import type { ListItemProps } from '../list/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../styles/pointer', () => ({
  ...jest.requireActual('../styles/pointer'),
  useTouchInput: () => true,
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let handlers: PressableProps;
const select = jest.fn();
const hold = jest.fn();
const open = jest.fn();
const event = () => ({ preventDefault: jest.fn() });
function renderRow(props: ListItemProps = {}) {
  act(() =>
    root.render(
      <BloomThemeProvider>
        <ListItem
          title="Launch"
          onPress={open}
          {...props}
          trigger={(next) => {
            handlers = next;
            return <Pressable {...next} />;
          }}
        />
      </BloomThemeProvider>,
    ),
  );
}
function send(name: 'onTouchStart' | 'onTouchEnd' | 'onTouchCancel' | 'onLongPress' | 'onPress') {
  const e = event();
  act(() => handlers[name]?.(e as never));
  return e;
}
beforeEach(() => {
  jest.clearAllMocks();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it.each(['selection', 'already selecting', 'callback'] as const)(
  'cancels the release of %s before the browser can retarget its click',
  (kind) => {
    const props =
      kind === 'callback'
        ? { onLongPress: hold }
        : { onCheckedChange: select, selecting: kind === 'already selecting' };
    renderRow(props);
    send('onTouchStart');
    send('onLongPress');
    // A selection/header render must retain the consumed gesture until release.
    renderRow({ ...props, supporting: 'Updated while held' });
    expect(send('onTouchEnd').preventDefault).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(kind === 'selection' ? 1 : 0);
    expect(hold).toHaveBeenCalledTimes(kind === 'callback' ? 1 : 0);
    expect(open).not.toHaveBeenCalled();
    send('onTouchStart');
    expect(send('onTouchEnd').preventDefault).not.toHaveBeenCalled();
  },
);

it.each(['onTouchCancel', 'onTouchStart'] as const)(
  '%s clears a consumed gesture without poisoning the next tap',
  (reset) => {
    renderRow({ onLongPress: hold });
    send('onTouchStart');
    send('onLongPress');
    send(reset);
    expect(send('onTouchEnd').preventDefault).not.toHaveBeenCalled();
    send('onPress');
    expect(open).toHaveBeenCalledTimes(1);
  },
);

it.each([{}, { disabled: true, onCheckedChange: select }, { disabled: true, onLongPress: hold }])(
  'does not consume an inactive long press: %j',
  (props) => {
    renderRow(props);
    send('onTouchStart');
    send('onLongPress');
    expect(send('onTouchEnd').preventDefault).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(hold).not.toHaveBeenCalled();
  },
);

it('leaves an ordinary tap unconsumed and keeps selection precedence over a long-press callback', () => {
  renderRow({ onCheckedChange: select, onLongPress: hold });
  send('onTouchStart');
  expect(send('onTouchEnd').preventDefault).not.toHaveBeenCalled();
  send('onPress');
  expect(open).toHaveBeenCalledTimes(1);
  send('onTouchStart');
  send('onLongPress');
  expect(send('onTouchEnd').preventDefault).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledWith(true);
  expect(hold).not.toHaveBeenCalled();
});
