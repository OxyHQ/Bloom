/**
 * `WindowDragRegion` takes a `className` on a native platform whether or not
 * the application polyfills React Native's `View` with NativeWind: on OxyOS
 * Bloom is the session's one copy, outside the application's polyfill, and a
 * toolbar laid out by its classes (a row of controls) fell apart into a column.
 */
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';

import { PlatformSurfaceProvider } from '../platform-surface/context';
import { WindowDragRegion } from '../window';
import { fakeWindow } from './support/fake-window';
import { resolvedStyle } from './support/rendered-style';

// The native CSS compiler and resolver, not the web `$$css` marker.
jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
);

beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(compile('.toolbar { flex-direction: row; height: 52px; }').stylesheet());
});

it.each([
  ['in a window', fakeWindow().adapter],
  ['without one', null],
])('lays out by its className %s', (_case, adapter) => {
  const api = render(
    <PlatformSurfaceProvider value={adapter}>
      <WindowDragRegion testID="toolbar" className="toolbar">
        <Text>Back</Text>
      </WindowDragRegion>
    </PlatformSurfaceProvider>,
  );
  expect(resolvedStyle(api.getByTestId('toolbar').props.style)).toMatchObject({
    flexDirection: 'row',
    height: 52,
  });
});
