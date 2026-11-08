import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { VectorStaticPortrait } from '../VectorStaticPortrait';
import { AvatarSnapshotObserver, type CaptureAvatarSnapshot } from '../context';
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: unknown, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        toDataURL: (done: (value: string) => void) => done('svg-pixels'),
      }));
      return React.createElement(require('react-native').View, props);
    }),
    ClipPath: 'ClipPath',
    Defs: 'Defs',
    Path: 'Path',
  };
});
it('captures native SVG on demand and unregisters on unmount without a WebView', async () => {
  let capture: CaptureAvatarSnapshot | null = null;
  const observe = jest.fn((next: CaptureAvatarSnapshot | null) => {
    capture = next;
  });
  let view!: ReactTestRenderer;
  act(() => {
    view = create(
      <AvatarSnapshotObserver.Provider value={observe}>
        <VectorStaticPortrait frame={{ viewBox: '0 0 320 320', paths: [] }} />
      </AvatarSnapshotObserver.Provider>,
    );
  });
  expect(capture).not.toBeNull();
  await expect(capture!()).resolves.toEqual({ uri: 'data:image/png;base64,svg-pixels' });
  act(() => view.unmount());
  expect(observe).toHaveBeenLastCalledWith(null);
});
