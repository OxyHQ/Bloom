import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { resolveAvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter, VECTOR_REST_CLIPS } from '../vector-compose';
import { renderVectorFrame } from '../vector-frame';
import { vectorLoop, vectorLoopIndex, vectorLoopTime } from '../vector-loop';
import { VectorLoopPlayer } from '../VectorLoopPlayer';
import { sampleVectorPose } from '../vector-pose';

/**
 * An avatar at rest repeats its idle clip, so after one time round every frame it draws is one it
 * has drawn before. On native it then hands the loop to the UI thread and the JS thread stops:
 * before, Alia on Mention's Home header kept the JS thread at about 90 % recomputing each frame.
 */
describe('an avatar at rest', () => {
  const alia = { preset: 'blue_beret', accessory: 'none', color: 'orchid' } as const;
  let renderer: ReactTestRenderer | undefined;
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  const realRaf = globalThis.requestAnimationFrame;
  const realCancel = globalThis.cancelAnimationFrame;
  beforeEach(() => {
    callbacks.clear();
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callbacks.set(++next, callback);
      return next;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      callbacks.delete(id);
    }) as typeof cancelAnimationFrame;
  });
  afterEach(() => {
    if (renderer) act(() => renderer!.unmount());
    renderer = undefined;
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancel;
  });
  const settle = async () => {
    for (let i = 0; i < 30; i++) await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  };
  let clock = 0;
  const frame = () =>
    act(() => {
      clock += 1000 / 60;
      for (const [id, callback] of [...callbacks]) {
        callbacks.delete(id);
        callback(clock);
      }
    });
  const avatar = (reactionKey = 0) => (
    <CharacterAvatar character={alia} catalog={vectorAssetLoader} reactionKey={reactionKey} />
  );
  const drawnPaths = () =>
    renderer!.root
      .findAll((node) => node.props.fillRule === 'nonzero' && node.props.fill !== undefined)
      .filter((node) => typeof node.type === 'string')
      .map((node) => node.props.d as string);

  it('draws its idle clip once, then plays the same frames on the UI thread', async () => {
    act(() => {
      renderer = create(avatar());
    });
    await settle();
    let frames = 0;
    while (!renderer!.root.findAllByType(VectorLoopPlayer).length && frames < 60 * 12) {
      frame();
      frames++;
    }
    const [player] = renderer!.root.findAllByType(VectorLoopPlayer);
    expect(player).toBeDefined();
    // One time round the 5.95 s clip, at 60 frames a second.
    expect(frames).toBeLessThan(60 * 6.5);
    // The JS thread asks for no more frames.
    expect(callbacks.size).toBe(0);

    // The UI thread draws exactly what the JS thread would.
    const resolved = resolveAvatarCharacter(alia);
    const asset = await composeVectorCharacter(resolved, vectorAssetLoader, VECTOR_REST_CLIPS);
    const loop = vectorLoop(JSON.stringify([0]), asset.clips.idle.duration);
    const time = vectorLoopTime(loop, player!.props.start);
    const expected = renderVectorFrame(asset, {
      action: 'idle',
      time,
      pose: sampleVectorPose(asset, 'idle', time),
    });
    expect(drawnPaths()).toEqual(expected.paths.map((path) => path.d));

    // A gesture takes the drawing back, from where the UI thread got to.
    act(() => {
      player!.props.elapsed.value = 2000;
    });
    act(() => renderer!.update(avatar(1)));
    expect(renderer!.root.findAllByType(VectorLoopPlayer)).toHaveLength(0);
    expect(callbacks.size).toBeGreaterThan(0);
    const resumed = vectorLoopTime(loop, vectorLoopIndex(loop, time + 2));
    expect(drawnPaths()).toEqual(
      renderVectorFrame(asset, {
        action: 'idle',
        time: resumed,
        pose: sampleVectorPose(asset, 'idle', resumed),
      }).paths.map((path) => path.d),
    );
  });
});
