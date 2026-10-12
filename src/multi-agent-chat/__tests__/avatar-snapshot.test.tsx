import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../../agent-avatar/AgentAvatar';
import { AgentAvatarProvider } from '../../agent-avatar/AgentAvatarProvider';
import {
  AvatarSnapshotObserver,
  type CaptureAvatarSnapshot,
} from '../../agent-avatar/context';
import { FOLD_CONFIG } from '../../agent-avatar/model';
const mockInject = jest.fn();
jest.mock('../../agent-avatar/character-webview', () => {
  const React = require('react');
  const View = require('react-native').View;
  const WebView = React.forwardRef((props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
    return React.createElement(View, props);
  });
  return { characterWebView: () => WebView };
});

it('captures the displayed WebView frame on demand and clears pending requests on unmount', async () => {
  let capture: CaptureAvatarSnapshot | null = null;
  let view: ReactTestRenderer;
  const observe = jest.fn((next: CaptureAvatarSnapshot | null) => {
    capture = next;
  });
  act(() => {
    view = create(
      <AgentAvatarProvider runtimeUrl="https://example.test/runtime.mjs">
        <AvatarSnapshotObserver.Provider value={observe}>
          <AgentAvatar config={FOLD_CONFIG} size={80} paused />
        </AvatarSnapshotObserver.Provider>
      </AgentAvatarProvider>,
    );
  });
  expect(capture).not.toBeNull();
  expect(
    mockInject.mock.calls.filter(([code]) => code.includes('captureAvatar')),
  ).toHaveLength(0);
  let result!: ReturnType<CaptureAvatarSnapshot>;
  act(() => {
    result = capture!();
  });
  const code = mockInject.mock.calls.find(([code]) =>
    code.includes('captureAvatar'),
  )![0];
  const id = Number(code.match(/\((\d+)\)/)![1]);
  const host = view!.root.findAll((node) => !!node.props.onMessage)[0]!;
  act(() =>
    host.props.onMessage({
      nativeEvent: {
        data: `snapshot:${JSON.stringify({ id, uri: 'data:image/png;base64,captured' })}`,
      },
    }),
  );
  await expect(result).resolves.toEqual({
    uri: 'data:image/png;base64,captured',
  });
  let unfinished!: ReturnType<CaptureAvatarSnapshot>;
  act(() => {
    unfinished = capture!();
  });
  act(() => view!.unmount());
  await expect(unfinished).resolves.toBeNull();
  expect(observe).toHaveBeenLastCalledWith(null);
});
