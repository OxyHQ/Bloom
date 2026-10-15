import { useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { CharacterRuntimeContext } from '../context';
import { resolveAvatarCharacter } from '../character';
import { stillKey } from '../character-still';

const mockInject = jest.fn();
jest.mock('../character-webview', () => {
  const React = require('react');
  const View = require('react-native').View;
  const WebView = React.forwardRef((props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
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
  expect(webViews(view)[0]!.props.source.html).toContain('"portrait":true');

  message(view, 'ready');
  expect(mockInject).toHaveBeenCalledWith(expect.stringContaining('captureAvatar'));
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  await flush();
  // The first is drawn; the second character takes the host next, never a second WebView.
  expect(webViews(view)).toHaveLength(1);
  message(view, 'ready');
  message(view, `snapshot:${JSON.stringify({ id: 1, uri: PNG })}`);
  expect(await Promise.all(asks.map((ask) => ask.promise))).toEqual([PNG, PNG, PNG, PNG]);
  await flush();
  expect(webViews(view)).toHaveLength(0);
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
