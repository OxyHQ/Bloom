import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { resolveAvatarCharacter, type AvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter, VECTOR_REST_CLIPS } from '../vector-compose';
import * as frames from '../vector-frame';
import { vectorLoop, vectorLoopIndex, vectorLoopTime } from '../vector-loop';
import { sampleVectorPose } from '../vector-pose';

// An Android binary with Bloom's native avatar surface.
jest.mock('react-native', () => ({
  ...jest.requireActual('../../../__mocks__/react-native'),
  Platform: {
    OS: 'android',
    Version: 36,
    select: (options: { android?: unknown }) => options.android,
  },
  UIManager: { getViewManagerConfig: () => ({}) },
  requireNativeComponent: () => 'BloomAvatarSurfaceV1',
}));

/**
 * An avatar at rest repeats its idle clip, so after one time round every frame it draws is one it
 * has drawn before. On Android the native surface plays that loop by itself and keeps it across
 * starts, and the JS thread stops: before, Alia on Mention's Home header kept the JS thread at about
 * 90 % recomputing each frame.
 */
describe('an avatar at rest', () => {
  const alia: AvatarCharacter = { preset: 'blue_beret', accessory: 'none', color: 'orchid' };
  let renderer: ReactTestRenderer | undefined;
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  let clock = 0;
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
    // One clock for the frames and for `performance.now()`, as on a device.
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
  });
  afterEach(() => {
    if (renderer) act(() => renderer!.unmount());
    renderer = undefined;
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancel;
    jest.restoreAllMocks();
  });
  const settle = async () => {
    for (let i = 0; i < 30; i++) await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  };
  const frame = () =>
    act(() => {
      clock += 1000 / 60;
      for (const [id, callback] of [...callbacks]) {
        callbacks.delete(id);
        callback(clock);
      }
    });
  const avatar = (character: AvatarCharacter, paused = false) => (
    <CharacterAvatar character={character} catalog={vectorAssetLoader} paused={paused} />
  );
  const surface = (): ReactTestInstance =>
    renderer!.root.find((node) => node.type === ('BloomAvatarSurfaceV1' as never));
  const answer = (ready: boolean) =>
    act(() => surface().props.onLoop({ nativeEvent: { key: surface().props.loopKey, ready } }));
  const restFrame = async (character: AvatarCharacter, time: number) => {
    const resolved = resolveAvatarCharacter(character);
    const asset = await composeVectorCharacter(resolved, vectorAssetLoader, VECTOR_REST_CLIPS);
    return frames.renderVectorFrame(asset, {
      action: 'idle',
      time,
      pose: sampleVectorPose(asset, 'idle', time),
    });
  };

  it('draws its idle clip once, hands it to the native surface and asks for no more frames', async () => {
    act(() => {
      renderer = create(avatar(alia));
    });
    await settle();
    frame();
    // The surface is asked whether it has this loop, and has not.
    expect(surface().props.loopKey).toMatch(/^[0-9a-f]{16}$/);
    answer(false);
    let ticks = 0;
    while (!surface().props.loopTracks && ticks < 60 * 12) {
      frame();
      ticks++;
    }
    const tracks = surface().props.loopTracks;
    expect(tracks).toBeDefined();
    // One time round the 5.95 s clip, at 60 frames a second.
    expect(ticks).toBeLessThan(60 * 6.5);

    // It is handed exactly the frames the JS thread draws.
    const loop = vectorLoop(JSON.stringify([0]), tracks.duration);
    expect(tracks.length).toBe(loop.frames.length);
    for (const index of [0, 41, tracks.length - 1]) {
      const expected = await restFrame(alia, vectorLoopTime(loop, index));
      expect(tracks.paths.map((path: { d: string[] }) => path.d[index])).toEqual(
        expected.paths.map((path) => path.d),
      );
    }

    // Once the surface has it, it plays it on its own clock and the JS thread stops.
    answer(true);
    frame();
    expect(surface().props.loopTracks).toBeUndefined();
    expect(surface().props.loopClock).toEqual({ epoch: clock, time: expect.any(Number) });
    expect(callbacks.size).toBe(0);
  });

  it('takes the drawing back from where the surface got to', async () => {
    act(() => {
      renderer = create(avatar(alia));
    });
    await settle();
    frame();
    // The surface already has Alia's loop (the test above handed it over).
    frame();
    const started = surface().props.loopClock;
    expect(started).toBeDefined();
    clock += 2000;
    act(() => renderer!.update(avatar(alia, true)));
    expect(surface().props.loopClock).toBeUndefined();
    // Paused, the JS thread draws the frame the clock got to: two seconds on.
    const time = started.time + 2;
    const expected = await restFrame(alia, time);
    expect(surface().props.frame.paths.map((path: { d: string }) => path.d)).toEqual(
      expected.paths.map((path) => path.d),
    );
    act(() => renderer!.update(avatar(alia)));
    frame();
    expect(surface().props.loopClock.time).toBeCloseTo(time, 9);
  });

  it('plays a loop the surface kept from an earlier start without drawing it again', async () => {
    const lime: AvatarCharacter = { ...alia, color: 'lime' };
    const draw = jest.spyOn(frames, 'renderVectorFrame');
    act(() => {
      renderer = create(avatar(lime));
    });
    await settle();
    frame();
    answer(true);
    frame();
    expect(surface().props.loopClock).toBeDefined();
    expect(callbacks.size).toBe(0);
    // The frame on screen and the first frame, which names the loop: the same one here.
    expect(draw).toHaveBeenCalledTimes(1);
    const loop = vectorLoop(JSON.stringify([1]), 5.95);
    expect(vectorLoopIndex(loop, surface().props.loopClock.time)).toBe(0);
  });
});
