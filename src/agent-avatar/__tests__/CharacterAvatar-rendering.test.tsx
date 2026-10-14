import { Profiler, useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { CharacterAvatar } from '../CharacterAvatar';
import { CharacterCapabilitiesContext, CharacterRuntimeContext } from '../context';
import * as characters from '../character';

const BERET: characters.AvatarCharacter = { preset: 'blue_beret' };

// These tests measure React commits and geometry generation, not native engine performance.
jest.mock('../character-webview', () => ({
  characterWebView: () => require('react-native').View,
}));

describe('avatar React rendering isolation', () => {
  let renderer: ReactTestRenderer;
  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
    jest.restoreAllMocks();
  });

  it('updates the editor catalog without committing the unchanged avatar gallery', () => {
    const resolved = jest.spyOn(characters, 'resolveAvatarCharacter');
    const avatarCommits = jest.fn();
    const catalogRenders = jest.fn();
    let report: NonNullable<
      React.ContextType<typeof CharacterRuntimeContext>['reportCapabilities']
    >;
    let runtime: React.ContextType<typeof CharacterRuntimeContext>;
    function Reporter() {
      runtime = useContext(CharacterRuntimeContext);
      report = runtime.reportCapabilities!;
      return null;
    }
    function EditorCatalog() {
      const { capabilitiesByKey } = useContext(CharacterCapabilitiesContext);
      catalogRenders(capabilitiesByKey?.size);
      return null;
    }
    act(() => {
      renderer = create(
        <AgentAvatarProvider runtimeUrl="/runtime.mjs">
          <Reporter />
          <EditorCatalog />
          <Profiler id="gallery" onRender={avatarCommits}>
            {Array.from({ length: 8 }, (_, i) => (
              <AgentAvatar key={i} character={BERET} paused label={`Agent ${i}`} />
            ))}
          </Profiler>
        </AgentAvatarProvider>,
      );
    });
    expect(resolved).toHaveBeenCalledTimes(8);
    const stableRuntime = runtime!;
    const initialCommits = avatarCommits.mock.calls.length;
    for (let i = 0; i < 10; i++) {
      act(() =>
        report({
          key: `recipe-${i}`,
          available: { 'eyes:dots': true },
          selected: { eyes: 'dots' },
        }),
      );
    }
    expect(catalogRenders).toHaveBeenLastCalledWith(10);
    expect(runtime!).toBe(stableRuntime);
    expect(avatarCommits).toHaveBeenCalledTimes(initialCommits);
    expect(resolved).toHaveBeenCalledTimes(8);
  });

  it('resolves the character once across work, reaction and pause changes, again for a new one', () => {
    const resolved = jest.spyOn(characters, 'resolveAvatarCharacter');
    const view = (workingKey: number, reactionKey: number, paused = false, avatar = BERET) => (
      <AgentAvatarProvider runtimeUrl="/runtime.mjs">
        <CharacterAvatar
          character={avatar}
          workingKey={workingKey}
          reactionKey={reactionKey}
          paused={paused}
        />
      </AgentAvatarProvider>
    );
    act(() => {
      renderer = create(view(0, 0));
    });
    expect(resolved).toHaveBeenCalledTimes(1);
    act(() => renderer.update(view(1, 0)));
    act(() => renderer.update(view(1, 1)));
    act(() => renderer.update(view(1, 1, true)));
    expect(resolved).toHaveBeenCalledTimes(1);
    act(() => renderer.update(view(1, 1, true, { ...BERET, color: 'coral' })));
    expect(resolved).toHaveBeenCalledTimes(2);
  });
  it('keeps the same mounted renderer when crossing the authored preset and edited bodies', () => {
    const view = (character: characters.AvatarCharacter) => (
      <AgentAvatarProvider runtimeUrl="/runtime.mjs">
        <AgentAvatar character={character} />
      </AgentAvatarProvider>
    );
    act(() => {
      renderer = create(view(BERET));
    });
    const instance = renderer.root.findByType(CharacterAvatar);
    act(() => renderer.update(view({ ...BERET, shape: 'cloud' })));
    expect(renderer.root.findByType(CharacterAvatar)).toBe(instance);
    act(() => renderer.update(view({ ...BERET, shape: 'circle', accessory: 'none' })));
    expect(renderer.root.findByType(CharacterAvatar)).toBe(instance);
  });
});
