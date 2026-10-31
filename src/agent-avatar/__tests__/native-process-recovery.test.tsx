import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { AvatarSnapshotObserver, type CaptureAvatarSnapshot } from '../context';
const mockInject = jest.fn(),
  mockMount = jest.fn();
jest.mock('../character-webview', () => {
  const React = require('react');
  const View = require('react-native').View;
  const WebView = React.forwardRef((props: object, ref: unknown) => {
    React.useEffect(() => {
      mockMount();
    }, []);
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
    return React.createElement(View, { ...props, testID: 'recovery-webview' });
  });
  return { characterWebView: () => WebView };
});
let view: ReactTestRenderer;
const hosts = () =>
  view.root.findAll(
    (node) => typeof node.type === 'string' && node.props.testID === 'recovery-webview',
  );
beforeEach(() => {
  mockMount.mockClear();
  mockInject.mockClear();
});
afterEach(() => act(() => view?.unmount()));

it.each(['onRenderProcessGone', 'onContentProcessDidTerminate'])(
  '%s restores once using latest props, settles captures, rejects stale events, and bounds repeated failures',
  async (event) => {
    let capture: CaptureAvatarSnapshot | null = null;
    const ready = jest.fn();
    const observe = (value: CaptureAvatarSnapshot | null) => {
      capture = value;
    };
    const render = (
      preset: 'blue_beret' | 'alfred',
      runtimeUrl = 'https://example.test/one.mjs',
    ) => (
      <AgentAvatarProvider runtimeUrl={runtimeUrl}>
        <AvatarSnapshotObserver.Provider value={observe}>
          <CharacterAvatar character={{ preset }} workingKey={2} onReady={ready} />
        </AvatarSnapshotObserver.Provider>
      </AgentAvatarProvider>
    );
    act(() => {
      view = create(render('blue_beret'));
    });
    act(() => view.update(render('alfred')));
    const pending = capture!();
    const old = hosts()[0]!.props;
    act(() => {
      old[event]();
      old[event]();
    });
    expect(await pending).toBeNull();
    expect(mockMount).toHaveBeenCalledTimes(2);
    expect(hosts()[0]!.props.source.html).toContain('"preset":"alfred"');
    expect(hosts()[0]!.props.source.html).toContain('"workingKey":2');
    act(() => old.onMessage({ nativeEvent: { data: 'ready' } }));
    expect(ready).not.toHaveBeenCalled();
    act(() => hosts()[0]!.props.onMessage({ nativeEvent: { data: 'ready' } }));
    expect(ready).toHaveBeenCalledTimes(1);
    act(() => hosts()[0]!.props[event]());
    expect(hosts()).toHaveLength(0);
    expect(JSON.stringify(view.toJSON())).toContain('unavailable');
    // A different configured runtime is a fresh renderer with its own bounded recovery.
    act(() => view.update(render('alfred', 'https://example.test/two.mjs')));
    expect(hosts()).toHaveLength(1);
    act(() => hosts()[0]!.props[event]());
    expect(hosts()).toHaveLength(1);
  },
);

it('propagates native page loading errors through the existing unavailable state', () => {
  act(() => {
    view = create(<CharacterAvatar character={{ preset: 'blue_beret' }} />);
  });
  act(() => hosts()[0]!.props.onError());
  expect(hosts()).toHaveLength(0);
  expect(JSON.stringify(view.toJSON())).toContain('unavailable');
});

it('allows a later independent OS reclamation after 30 seconds of stable readiness, while bounding consecutive losses', () => {
  jest.useFakeTimers();
  try {
    act(() => {
      view = create(<CharacterAvatar character={{ preset: 'blue_beret' }} />);
    });
    act(() => hosts()[0]!.props.onRenderProcessGone());
    act(() => hosts()[0]!.props.onMessage({ nativeEvent: { data: 'ready' } }));
    act(() => jest.advanceTimersByTime(30_000));
    act(() => hosts()[0]!.props.onRenderProcessGone());
    expect(hosts()).toHaveLength(1);
    expect(mockMount).toHaveBeenCalledTimes(3);
    // No ready/stability interval has occurred for the new document.
    act(() => hosts()[0]!.props.onRenderProcessGone());
    expect(hosts()).toHaveLength(0);
    expect(JSON.stringify(view.toJSON())).toContain('unavailable');
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});
