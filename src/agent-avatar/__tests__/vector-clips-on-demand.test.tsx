import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { packedVectorAsset } from '../vector-pack';
import { vectorShapeImports } from '../vector-asset-imports';
import { vectorAssetLoader } from '../vector-assets';
import type { VectorAction, VectorAssetLoader } from '../vector-types';

/**
 * An avatar at rest loads what it draws at rest: its idle tracks and the geometry they show. Its
 * gestures (`reaction`, and `work` with the computer and hands only it draws) are fetched the
 * first time one plays. A mood is drawn on the idle clip, so an empty state's gemie shaking its
 * head "no" needs nothing more. Before, every avatar fetched every clip and the work-only parts:
 * for the empty state's character, ~280 KB brotli it never drew.
 */
const encoded = (value: unknown) => async () => ({ default: { data: JSON.stringify(value) } });
const track = (n: number) => ({ translation: { value: [n, 0, 0] } });

describe('a packed asset', () => {
  const asset = {
    format: 2,
    identity: { id: 'x' },
    parts: [
      { id: 0, label: 'body', role: 'body', geo: 'g-body' },
      { id: 1, label: 'hand', role: 'hand', workOnly: true, geo: 'g-hand' },
    ],
    clips: {
      idle: { duration: 1, fps: 24 },
      reaction: { duration: 1, fps: 24 },
      work: { duration: 2, fps: 24 },
    },
    tracks: [
      { idle: 't-body-idle', reaction: 't-body-reaction', work: 't-body-work' },
      { idle: null, reaction: null, work: 't-hand-work' },
    ],
  };
  const payloads: Record<string, unknown> = {
    'g-body': { points: [[0, 0, 0]], faces: [[0, 0, 0]] },
    'g-hand': { points: [[1, 1, 1]], faces: [[0, 0, 0]] },
    't-body-idle': track(1),
    't-body-reaction': track(2),
    't-body-work': track(3),
    't-hand-work': track(4),
  };
  function importer() {
    const read: string[] = [];
    const blobs = Object.fromEntries(
      Object.entries(payloads).map(([hash, value]) => [
        hash,
        async () => {
          read.push(hash);
          return encoded(value)();
        },
      ]),
    );
    return { load: packedVectorAsset(encoded(asset), blobs), read };
  }

  it('at rest, reads the idle tracks and the geometry they draw, and nothing else', async () => {
    const { load, read } = importer();
    const { default: data } = await load(['idle']);
    expect(read.sort()).toEqual(['g-body', 't-body-idle']);
    expect(data.clips.idle.parts).toEqual([track(1), null]);
    // The other clips keep their length and draw nothing until they are loaded.
    expect(data.clips.reaction).toMatchObject({ duration: 1, parts: [null, null] });
    expect(data.parts[1]).toMatchObject({ role: 'hand', points: [], faces: [] });
  });

  it('whole, as before, when no clips are named', async () => {
    const { load, read } = importer();
    const { default: data } = await load();
    expect(read.sort()).toEqual(Object.keys(payloads).sort());
    expect(data.clips.work.parts).toEqual([track(3), track(4)]);
    expect(data.parts[1]).toMatchObject({ points: [[1, 1, 1]] });
  });
});

describe("Bloom's catalogue", () => {
  // Through the generated import map, as an app loads it: the clips asked for reach the asset.
  it('reads a shape at rest without its gestures or work parts', async () => {
    const atRest = await vectorShapeImports.circle(['idle']);
    const whole = await vectorShapeImports.circle();
    const { work: restWork, idle: restIdle } = atRest.default.clips;
    expect(restWork.parts.every((part) => part === null)).toBe(true);
    expect(restIdle.parts.some((part) => part !== null)).toBe(true);
    // The asset keeps the packer's `workOnly` flag on the part (the computer, hands and screens).
    const workOnly = atRest.default.parts.filter(
      (part) => (part as { workOnly?: boolean }).workOnly,
    );
    expect(workOnly.length).toBeGreaterThan(0);
    expect(workOnly.every((part) => part.points.length === 0)).toBe(true);
    expect(whole.default.clips.work.parts.some((part) => part !== null)).toBe(true);
  });
});

describe('an avatar', () => {
  let renderer: ReactTestRenderer | undefined;
  afterEach(() => {
    if (renderer) act(() => renderer!.unmount());
    renderer = undefined;
  });

  function recording() {
    const calls: Array<readonly VectorAction[] | undefined> = [];
    const wrap =
      <K extends keyof VectorAssetLoader>(key: K) =>
      (...args: Parameters<VectorAssetLoader[K]>) => {
        calls.push(args[1] as readonly VectorAction[] | undefined);
        return (vectorAssetLoader[key] as (...a: unknown[]) => unknown)(...args);
      };
    const loader = {
      shape: wrap('shape'),
      eyes: wrap('eyes'),
      eyewear: wrap('eyewear'),
      accessory: wrap('accessory'),
      template: wrap('template'),
    } as VectorAssetLoader;
    return { loader, calls };
  }
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

  it('loads at rest, and the rest of the character when a gesture first plays', async () => {
    const { loader, calls } = recording();
    act(() => {
      renderer = create(
        <CharacterAvatar character={character} catalog={loader} reactionKey={0} mood="sad" />,
      );
    });
    await settle();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every((clips) => JSON.stringify(clips) === '["idle"]')).toBe(true);

    const atRest = calls.length;
    act(() => {
      renderer!.update(
        <CharacterAvatar character={character} catalog={loader} reactionKey={1} mood="sad" />,
      );
    });
    await settle();
    const later = calls.slice(atRest);
    expect(later.length).toBeGreaterThan(0);
    // Every clip, whole, for the gesture.
    expect(later.every((clips) => clips === undefined || clips.length === 3)).toBe(true);
  });

  it('as a portrait, loads only what its still frame draws', async () => {
    const { loader, calls } = recording();
    act(() => {
      renderer = create(<CharacterAvatar character={character} catalog={loader} portrait />);
    });
    await settle();
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every((clips) => JSON.stringify(clips) === '["idle"]')).toBe(true);
  });
});
