import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { vectorAssetLoader } from '../vector-assets';
import { ScreenContext, type ScreenContextValue } from '../../screen/context';

/**
 * A live avatar draws frames only while it can be seen. On a screen that is not in front (a
 * covered stack scene, a tab page the reader left) it holds its last frame and asks for none.
 * Before, only a backgrounded app stopped it, so a header avatar under a pushed post kept
 * recomputing its frame on the JS thread 30 times a second.
 */
describe('an avatar on a screen that is not in front', () => {
  let renderer: ReactTestRenderer | undefined;
  let requests = 0;
  const realRaf = globalThis.requestAnimationFrame;
  const realCancel = globalThis.cancelAnimationFrame;
  beforeEach(() => {
    requests = 0;
    // Counts frame requests and never runs them: what matters is whether any is asked for.
    globalThis.requestAnimationFrame = (() => ++requests) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
  });
  afterEach(() => {
    if (renderer) act(() => renderer!.unmount());
    renderer = undefined;
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancel;
  });
  const settle = async () => {
    for (let i = 0; i < 20; i++) await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  };
  const character = {
    shape: 'circle',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'none',
    color: 'blue',
  } as const;
  const onScreen = (active: boolean) => (
    <ScreenContext.Provider value={{ active } as ScreenContextValue}>
      <CharacterAvatar character={character} catalog={vectorAssetLoader} />
    </ScreenContext.Provider>
  );

  it('asks for no frames, and animates again once its screen is back in front', async () => {
    act(() => {
      renderer = create(onScreen(false));
    });
    await settle();
    expect(requests).toBe(0);

    act(() => {
      renderer!.update(onScreen(true));
    });
    await settle();
    expect(requests).toBeGreaterThan(0);
  });
});
