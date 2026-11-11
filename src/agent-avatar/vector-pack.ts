import type { VectorData } from './vector-types';

/** One lazily loaded vector asset: resolves to the full data of a shape, eyes, eyewear, accessory or template. */
export type VectorAssetImport = () => Promise<{ default: VectorData }>;
/** A JSON module as bundlers deliver it: the payload is a string, parsed only when used. */
type Encoded = { default: { data: string } };
type Payload = Record<string, unknown>;
type PackedAsset = {
  parts: ({ geo: string } & Record<string, unknown>)[];
  clips: Record<string, Record<string, unknown>>;
  tracks: string[];
} & Record<string, unknown>;

const decode = <T>(module: Encoded) => JSON.parse(module.default.data) as T;

/**
 * Rebuilds an asset from its packed form (see scripts/avatar-vector/pack-assets.mjs). Each
 * distinct geometry and track payload is a module of its own, shared by every asset that
 * uses it, so importing one asset links only the payloads that asset refers to.
 */
export function packedVectorAsset(
  asset: () => Promise<Encoded>,
  blobs: Record<string, () => Promise<Encoded>>,
): VectorAssetImport {
  return async () => {
    const packed = decode<PackedAsset>(await asset());
    const read = async (hash: string) => decode<Payload>(await blobs[hash]!());
    const [geometry, tracks] = await Promise.all([
      Promise.all(packed.parts.map((part) => read(part.geo))),
      Promise.all(packed.tracks.map(read)),
    ]);
    const { parts, clips, tracks: _tracks, ...top } = packed;
    return {
      default: {
        ...top,
        parts: parts.map(({ geo: _geo, ...part }, index) => ({ ...part, ...geometry[index] })),
        clips: Object.fromEntries(
          Object.entries(clips).map(([name, head]) => [
            name,
            { ...head, parts: tracks.map((set) => set[name] ?? null) },
          ]),
        ),
      } as unknown as VectorData,
    };
  };
}
