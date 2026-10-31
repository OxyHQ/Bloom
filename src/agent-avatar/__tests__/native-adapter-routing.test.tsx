import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
const mockCompatibility = jest.fn<Promise<boolean>, [string]>();
let mockAvailable = true;
jest.mock('../native-avatar-adapter', () => {
  const adapter = {
    isRuntimeCompatible: (url: string) => mockCompatibility(url),
    NativeAvatar: (props: object) =>
      require('react').createElement(require('react-native').View, {
        ...props,
        testID: 'shared-native-avatar',
      }),
  };
  return { nativeAvatarAdapter: () => (mockAvailable ? adapter : null) };
});
jest.mock('../character-webview', () => ({
  characterWebView: () => (props: object) =>
    require('react').createElement(require('react-native').View, {
      ...props,
      testID: 'fallback-webview',
    }),
}));
let tree: ReactTestRenderer;
const render = (url: string) => (
  <AgentAvatarProvider runtimeUrl={url}>
    <CharacterAvatar character={{ preset: 'blue_beret' }} label="Companion" testID="avatar" />
  </AgentAvatarProvider>
);
const nodes = (id: string) =>
  tree.root.findAll((node) => typeof node.type === 'string' && node.props.testID === id);
afterEach(() => act(() => tree?.unmount()));
beforeEach(() => {
  mockAvailable = true;
  mockCompatibility.mockReset();
});
it('routes compatible live avatars to shared native surfaces and preserves resolved character and labels', async () => {
  mockCompatibility.mockResolvedValue(true);
  await act(async () => {
    tree = create(render('https://example.test/runtime.mjs'));
  });
  expect(nodes('shared-native-avatar')).toHaveLength(1);
  expect(nodes('fallback-webview')).toHaveLength(0);
  expect(nodes('shared-native-avatar')[0]!.props.value.character.preset).toBe('blue_beret');
  expect(nodes('avatar')[0]!.props.accessibilityLabel).toBe('Companion');
});
it('uses the existing WebView when the module is absent or hosting is incompatible', async () => {
  mockAvailable = false;
  await act(async () => {
    tree = create(render('https://example.test/runtime.mjs'));
  });
  expect(nodes('fallback-webview')).toHaveLength(1);
  mockAvailable = true;
  mockCompatibility.mockResolvedValue(false);
  await act(async () => tree.update(render('https://other.test/runtime.mjs')));
  expect(nodes('fallback-webview')).toHaveLength(1);
  expect(nodes('shared-native-avatar')).toHaveLength(0);
});
it('ignores stale compatibility results when the configured runtime changes', async () => {
  const pending: ((value: boolean) => void)[] = [];
  mockCompatibility.mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
  await act(async () => {
    tree = create(render('https://one.test/runtime.mjs'));
  });
  await act(async () => tree.update(render('https://two.test/runtime.mjs')));
  await act(async () => pending[0]!(true));
  expect(nodes('shared-native-avatar')).toHaveLength(0);
  await act(async () => pending[1]!(false));
  expect(nodes('fallback-webview')).toHaveLength(1);
});
