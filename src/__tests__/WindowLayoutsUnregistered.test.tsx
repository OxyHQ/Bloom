/**
 * `window-layout` reported but `@oxy.so/bloom/window/layouts` never imported: the zoom control
 * only zooms, and development says why, once. (`WindowControls` never imports the menu itself.)
 */
import { View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomProvider } from '../provider';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { WindowControls } from '../window';
import { fakeWindow } from './support/fake-window';

it('only zooms, and warns once, without the layouts registered', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { window } = fakeWindow();
  const adapter: PlatformSurfaceAdapter = {
    platform: 'test',
    capabilities: new Set(['window', 'window-layout', 'popup-surface']),
    window: { ...window, layOut: jest.fn() },
    PopupSurface: (props) => <View testID="popup">{props.children}</View>,
  };
  const draw = () =>
    render(
      <BloomProvider mode="light" platform={adapter}>
        <WindowControls testID="controls" />
      </BloomProvider>,
    );
  const screen = draw();
  act(() => {
    fireEvent(screen.getByTestId('controls-zoom'), 'longPress');
  });
  expect(screen.queryByText('Fill')).toBeNull();
  fireEvent.press(screen.getByTestId('controls-zoom'));
  expect(window.zoom).toHaveBeenCalledTimes(1);
  screen.unmount();
  draw().unmount();
  const said = warn.mock.calls.filter(([text]) =>
    String(text).includes('@oxy.so/bloom/window/layouts'),
  );
  expect(said).toHaveLength(1);
});
