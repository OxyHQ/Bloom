import { StrictMode, useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { CharacterRuntimeContext } from '../context';
import { resolveAvatarCharacter } from '../character';
import { stillKey } from '../character-still';

const mockInject = jest.fn();
const mockMount = jest.fn();
const mockUnmount = jest.fn();
jest.mock('../character-webview', () => {
  const React = require('react');
  const View = require('react-native').View;
  const WebView = React.forwardRef((props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
    React.useEffect(() => {
      mockMount();
      return mockUnmount;
    }, []);
    return React.createElement(View, { ...(props as object), testID: 'still-webview' });
  });
  return { characterWebView: () => WebView };
});

const PNG = 'data:image/png;base64,QUJD';
const blue = resolveAvatarCharacter({ preset: 'blue_beret' });
const alfred = resolveAvatarCharacter({ preset: 'alfred' });
let stills: React.ContextType<typeof CharacterRuntimeContext>['stills'];
function Probe() {
  stills = useContext(CharacterRuntimeContext).stills;
  return null;
}
const webViews = (view: ReactTestRenderer) =>
  view.root.findAll(
    (node) => typeof node.type === 'string' && node.props.testID === 'still-webview',
  );
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
const message = (view: ReactTestRenderer, data: string) =>
  act(() => webViews(view)[0]!.props.onMessage({ nativeEvent: { data } }));

let view: ReactTestRenderer;
beforeEach(() => {
  mockInject.mockClear();
  mockMount.mockClear();
  mockUnmount.mockClear();
  act(() => {
    view = create(
      <AgentAvatarProvider runtimeUrl="https://example.test/runtime.mjs">
        <Probe />
      </AgentAvatarProvider>,
    );
  });
});
afterEach(() => act(() => view.unmount()));

it('mounts no WebView while idle, then exactly one for a whole queue, one render at a time', async () => {
  expect(webViews(view)).toHaveLength(0);
  const asks = [blue, alfred, blue, alfred].map((c) =>
    stills!.request(stillKey(c, 64, 1), c, 64, 1),
  );
  await flush();
  expect(webViews(view)).toHaveLength(1);
  const source = webViews(view)[0]!.props.source;

  message(view, 'loaded');
  expect(mockInject).toHaveBeenCalledWith(expect.stringContaining('renderStill'));
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  await flush();
  // The first is drawn; the second character takes the host next, never a second WebView.
  expect(webViews(view)).toHaveLength(1);
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(webViews(view)[0]!.props.source).toBe(source);
  expect(mockUnmount).not.toHaveBeenCalled();
  expect(mockInject).toHaveBeenCalledTimes(2);
  message(view, `snapshot:${JSON.stringify({ id: 2, uri: PNG })}`);
  expect(await Promise.all(asks.map((ask) => ask.promise))).toEqual([PNG, PNG, PNG, PNG]);
  await flush();
  expect(webViews(view)).toHaveLength(1);
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 1550)));
  expect(webViews(view)).toHaveLength(0);
  expect(mockUnmount).toHaveBeenCalledTimes(1);
});

it('resolves null when the page reports an error, or sends something that is not a PNG', async () => {
  const first = stills!.request(stillKey(blue, 64, 1), blue, 64, 1);
  await flush();
  message(view, 'error');
  expect(await first.promise).toBeNull();
  await flush();
  const second = stills!.request(stillKey(alfred, 64, 1), alfred, 64, 1);
  await flush();
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: 'https://evil.test/x' })}`);
  expect(await second.promise).toBeNull();
});

it('ignores a previous job snapshot after the next job starts', async () => {
  const first = stills!.request(stillKey(blue, 64, 1), blue, 64, 1);
  const second = stills!.request(stillKey(alfred, 64, 1), alfred, 64, 1);
  await flush();
  message(view, 'loaded');
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  expect(await first.promise).toBe(PNG);
  await flush();
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: 'data:image/png;base64,OLD' })}`);
  message(view, `snapshot:${JSON.stringify({ id: 2, uri: PNG })}`);
  expect(await second.promise).toBe(PNG);
  expect(mockMount).toHaveBeenCalledTimes(1);
});

it('settles queued work and releases its WebView when the provider unmounts', async () => {
  const first = stills!.request(stillKey(blue, 64, 1), blue, 64, 1);
  const second = stills!.request(stillKey(alfred, 64, 1), alfred, 64, 1);
  await flush();
  act(() => view.unmount());
  expect(await Promise.all([first.promise, second.promise])).toEqual([null, null]);
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(mockUnmount).toHaveBeenCalledTimes(1);
});

it('keeps the cache and current request alive across StrictMode effect replay', async () => {
  act(() => view.unmount());
  act(() => {
    view = create(
      <StrictMode>
        <AgentAvatarProvider runtimeUrl="https://example.test/runtime.mjs">
          <Probe />
        </AgentAvatarProvider>
      </StrictMode>,
    );
  });
  const request = stills!.request(stillKey(blue, 64, 1), blue, 64, 1);
  await flush();
  message(view, 'loaded');
  const script = mockInject.mock.calls[mockInject.mock.calls.length - 1]![0] as string;
  const id = JSON.parse(script.match(/window.renderStill\?\.\((.*)\); true;/)![1]!).id;
  message(view, `snapshot:${JSON.stringify({ id, uri: PNG })}`);
  expect(await request.promise).toBe(PNG);
});

it('replaces a failed module document before processing the next queued character', async () => {
  const first = stills!.request(stillKey(blue, 64, 1), blue, 64, 1);
  const second = stills!.request(stillKey(alfred, 64, 1), alfred, 64, 1);
  await flush();
  message(view, 'error');
  expect(await first.promise).toBeNull();
  await flush();
  expect(mockMount).toHaveBeenCalledTimes(2);
  message(view, 'loaded');
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  expect(await second.promise).toBe(PNG);
});
