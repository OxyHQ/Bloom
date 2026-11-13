import { loadVectorGeometry } from '../vector-compose';
import { resolveAvatarCharacter } from '../character';
import type { VectorAssetLoader, VectorData, VectorPart, VectorTrack } from '../vector-types';

/**
 * Each vector asset is its own chunk on the web, so the order a character asks for them in is the
 * number of round trips its first paint waits. Everything a character names is requested before
 * the shape arrives; only bot eyes wait for it, because the shape decides whether they are drawn.
 */
const track: VectorTrack = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
const part = (id: number, role: string, x: number, z = 0): VectorPart => ({
  id,
  label: role,
  role,
  color: '#777777',
  points: [
    [x - 0.1, 0, z],
    [x + 0.1, 0, z],
    [x, 0.2, z],
  ],
  faces: [[0, 1, 2]],
  edges: [],
});
const asset = (...roles: string[]): VectorData => ({
  parts: [
    {
      ...part(0, 'body', 0),
      points: [
        [-1, -1, 0],
        [1, -1, 0],
        [0, 1, 0],
      ],
    },
    part(1, 'eye', -0.3, 0.1),
    part(2, 'eye', 0.3, 0.1),
    ...roles.map((role, i) => part(3 + i, role, 0, 0.2)),
  ],
  clips: Object.fromEntries(
    ['idle', 'reaction', 'work'].map((action) => [
      action,
      { duration: 1, fps: 2, parts: Array(3 + roles.length).fill(track) },
    ]),
  ) as VectorData['clips'],
});

/** A loader whose shapes resolve only when released, recording every request in order. */
function gatedLoader() {
  const requests: string[] = [];
  let release!: () => void;
  const shapesReleased = new Promise<void>((resolve) => {
    release = resolve;
  });
  const loader: VectorAssetLoader = {
    template: async () => undefined,
    shape: async (id) => {
      requests.push(`shape:${id}`);
      await shapesReleased;
      return asset();
    },
    eyes: async (id) => {
      requests.push(`eyes:${id}`);
      return asset();
    },
    eyewear: async (id) => {
      requests.push(`eyewear:${id}`);
      return asset('eyewear');
    },
    accessory: async (id) => {
      requests.push(`accessory:${id}`);
      return asset('accessory');
    },
  };
  return { loader, requests, release };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

it('requests the eyes, eyewear, accessory and fitting circle before the shape arrives', async () => {
  const { loader, requests, release } = gatedLoader();
  const character = resolveAvatarCharacter({
    shape: 'heart',
    eyes: 'oval',
    eyewear: 'monocle',
    accessory: 'bow',
    color: 'blue',
  });
  const geometry = loadVectorGeometry(character, loader);
  await flush();
  expect(requests).toEqual([
    `shape:${character.shape}`,
    `eyes:${character.eyes}`,
    'shape:circle',
    `eyewear:${character.eyewear}`,
    `accessory:${character.accessory}`,
  ]);
  release();
  await expect(geometry).resolves.toBeDefined();
  // Nothing is asked for twice: the composition awaits the requests it already made.
  expect(requests).toHaveLength(5);
});

it('lets bot eyes wait for the shape, which decides whether they are drawn', async () => {
  const { loader, requests, release } = gatedLoader();
  const character = resolveAvatarCharacter({
    shape: 'heart',
    eyes: 'bot',
    eyewear: 'none',
    accessory: 'none',
    color: 'blue',
  });
  const geometry = loadVectorGeometry(character, loader);
  await flush();
  expect(requests).toEqual([`shape:${character.shape}`]);
  release();
  await geometry;
});
