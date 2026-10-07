import { Profiler, useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import { CharacterAvatar } from '../CharacterAvatar';
import {
  CharacterCapabilitiesContext,
  CharacterRuntimeContext,
} from '../context';
import * as recipes from '../legacy-recipe';
import { createConfigForShape } from '../character-shapes';
import { FOLD_CONFIG } from '../model';

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
    const geometry = jest.spyOn(recipes, 'legacyRecipe');
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
              <AgentAvatar
                key={i}
                config={FOLD_CONFIG}
                paused
                label={`Agent ${i}`}
              />
            ))}
          </Profiler>
        </AgentAvatarProvider>,
      );
    });
    expect(geometry).toHaveBeenCalledTimes(8);
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
    expect(geometry).toHaveBeenCalledTimes(8);
  });

  it('reuses the contour across work, reaction and pause changes, but recalculates for a new recipe', () => {
    const geometry = jest.spyOn(recipes, 'legacyRecipe');
    const config = { ...FOLD_CONFIG, foldShape: 'cloud' as const };
    const view = (
      workingKey: number,
      reactionKey: number,
      paused = false,
      avatar = config,
    ) => (
      <AgentAvatarProvider runtimeUrl="/runtime.mjs">
        <CharacterAvatar
          config={avatar}
          workingKey={workingKey}
          reactionKey={reactionKey}
          paused={paused}
        />
      </AgentAvatarProvider>
    );
    act(() => {
      renderer = create(view(0, 0));
    });
    expect(geometry).toHaveBeenCalledTimes(1);
    act(() => renderer.update(view(1, 0)));
    act(() => renderer.update(view(1, 1)));
    act(() => renderer.update(view(1, 1, true)));
    expect(geometry).toHaveBeenCalledTimes(1);
    act(() => renderer.update(view(1, 1, true, { ...config, foldDepth: 60 })));
    expect(geometry).toHaveBeenCalledTimes(2);
  });
  it('keeps the same mounted renderer when crossing authored and migrated bodies', () => {
    const original = {
      ...FOLD_CONFIG,
      character: {
        preset: 'blue_beret',
        selections: { color: 'blue', eyes: 'todd' },
      },
    };
    const view = (shape: string) => (
      <AgentAvatarProvider runtimeUrl="/runtime.mjs">
        <AgentAvatar config={createConfigForShape(original, shape)} />
      </AgentAvatarProvider>
    );
    act(() => {
      renderer = create(view('todd'));
    });
    const instance = renderer.root.findByType(CharacterAvatar);
    act(() => renderer.update(view('cloud')));
    expect(renderer.root.findByType(CharacterAvatar)).toBe(instance);
    act(() => renderer.update(view('circle')));
    expect(renderer.root.findByType(CharacterAvatar)).toBe(instance);
  });
});
