import type { VectorAction, VectorData } from './vector-types';

/** Every clip an asset carries; what an asset import loads when it is not told otherwise. */
export const VECTOR_ACTIONS: readonly VectorAction[] = ['idle', 'reaction', 'work'];

/**
 * One lazily loaded vector asset: resolves to the data of a shape, eyes, eyewear, accessory or
 * template. Given `clips`, it loads only those clips' tracks, and the geometry of a `workOnly`
 * part only when `work` is among them; every other clip keeps its duration and draws nothing
 * (`null` tracks). Without `clips` it loads them all, as before.
 */
export type VectorAssetImport = (
  clips?: readonly VectorAction[],
) => Promise<{ default: VectorData }>;
/** A JSON module as bundlers deliver it: the payload is a string, parsed only when used. */
type Encoded = { default: { data: string } };
type Payload = Record<string, unknown>;
type PackedAsset = {
  format?: number;
  parts: ({ geo: string; workOnly?: boolean } & Record<string, unknown>)[];
  clips: Record<string, Record<string, unknown>>;
  /** Format 2: each part's track hash per clip (`null`: no track in that clip). */
  tracks: Record<string, string | null>[];
} & Record<string, unknown>;

const decode = <T>(module: Encoded) => JSON.parse(module.default.data) as T;
/** A `workOnly` part's geometry when `work` is not loaded: it is drawn in no other clip. */
const NO_GEOMETRY = { points: [], faces: [] };

/**
 * Rebuilds an asset from its packed form (see scripts/avatar-vector/pack-assets.mjs). Each
 * distinct geometry and per-clip track payload is a module of its own, shared by every asset that
 * uses it, so importing one asset links only the payloads that asset refers to, and loading it at
 * rest fetches only its `idle` tracks and the geometry those draw.
 */
export function packedVectorAsset(
  asset: () => Promise<Encoded>,
  blobs: Record<string, () => Promise<Encoded>>,
): VectorAssetImport {
  return async (clips = VECTOR_ACTIONS) => {
    const wanted = new Set(clips);
    const packed = decode<PackedAsset>(await asset());
    const read = async (hash: string) => decode<Payload>(await blobs[hash]!());
    const [geometry, tracks] = await Promise.all([
      Promise.all(
        packed.parts.map((part) =>
          part.workOnly && !wanted.has('work') ? NO_GEOMETRY : read(part.geo),
        ),
      ),
      Promise.all(
        packed.tracks.map(async (entry) =>
          Object.fromEntries(
            await Promise.all(
              Object.entries(entry).map(async ([name, hash]) => [
                name,
                hash !== null && wanted.has(name as VectorAction) ? await read(hash) : null,
              ]),
            ),
          ),
        ),
      ),
    ]);
    const { parts, clips: heads, tracks: _tracks, format: _format, ...top } = packed;
    return {
      default: {
        ...top,
        parts: parts.map(({ geo: _geo, ...part }, index) => ({ ...part, ...geometry[index] })),
        clips: Object.fromEntries(
          Object.entries(heads).map(([name, head]) => [
            name,
            { ...head, parts: tracks.map((set) => set[name] ?? null) },
          ]),
        ),
      } as unknown as VectorData,
    };
  };
}
