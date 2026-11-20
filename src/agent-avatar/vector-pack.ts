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
/** An asset's JSON module as bundlers deliver it: its small metadata as one string. */
type Encoded = { default: { data: string } };
/**
 * A payload's JSON module (pack format 3): bundlers turn it into an object literal, so its header
 * fields arrive as values and its numbers as integers in the base64 `data` string, which
 * `decodeBlob` reads. Nothing in it is parsed as JSON at runtime.
 */
export type VectorBlob = { data: string } & Record<string, unknown>;
type BlobModule = { default: VectorBlob };
type Payload = Record<string, unknown>;
type PackedAsset = {
  format?: number;
  parts: ({ geo: string; workOnly?: boolean } & Record<string, unknown>)[];
  clips: Record<string, Record<string, unknown>>;
  /** Format 2 and 3: each part's track hash per clip (`null`: no track in that clip). */
  tracks: Record<string, string | null>[];
} & Record<string, unknown>;
/**
 * A numeric array's header: `rows` of three numbers, or a channel's count of `samples`. Each
 * column (x, y, z of a point; each element of a sample) is `[min, bytes]`: its numbers are
 * `(min + n) / 10 ** decimals`, `n` held in that many little-endian bytes (0 when all are `min`).
 */
type Field = { rows?: number; samples?: number; decimals: number; columns: [number, number][] };

const ROW = 3;

/**
 * The payload a blob holds, exactly as the extractor wrote it: `number[][]` rows for points, faces
 * and deltas, `number[]` for a channel's samples (see scripts/avatar-vector/pack-assets.mjs, which
 * this mirrors). An integer divided by a power of ten is the double JSON.parse gives its decimal.
 *
 * Decoding is one pass over `atob`'s string (native on Hermes and in browsers; each character is a
 * byte), column by column into the list it ends in. On a Pixel 8a that is what loading costs: the
 * per-number work, not the format.
 */
export function decodeBlob({ data, ...fields }: VectorBlob): Payload {
  const bytes = atob(data);
  let at = 0;
  /** `count` numbers, column after column, from byte `at`: `(min + n) / 10 ** decimals`. */
  const decode = (count: number, { decimals, columns }: Field) => {
    const scale = 10 ** decimals;
    const values: number[] = new Array(count);
    for (let c = 0; c < columns.length; c++) {
      const [min, size] = columns[c]!;
      for (let i = c; i < count; i += columns.length) {
        let n = 0;
        if (size === 1) n = bytes.charCodeAt(at);
        else if (size === 2) n = bytes.charCodeAt(at) | (bytes.charCodeAt(at + 1) << 8);
        else if (size === 3)
          n =
            bytes.charCodeAt(at) |
            (bytes.charCodeAt(at + 1) << 8) |
            (bytes.charCodeAt(at + 2) << 16);
        else if (size === 4)
          n =
            bytes.charCodeAt(at) +
            bytes.charCodeAt(at + 1) * 256 +
            bytes.charCodeAt(at + 2) * 65536 +
            bytes.charCodeAt(at + 3) * 16777216;
        values[i] = (min + n) / scale;
        at += size;
      }
    }
    return values;
  };
  const payload: Payload = {};
  for (const [key, raw] of Object.entries(fields)) {
    const field = raw as Field | null;
    if (typeof field?.rows === 'number') {
      const values = decode(field.rows * ROW, field);
      const rows: number[][] = new Array(field.rows);
      for (let r = 0, i = 0; r < field.rows; r++, i += ROW)
        rows[r] = [values[i]!, values[i + 1]!, values[i + 2]!];
      payload[key] = rows;
    } else if (typeof field?.samples === 'number')
      payload[key] = { samples: decode(field.samples, field) };
    else payload[key] = raw;
  }
  if (at !== bytes.length) throw new Error('Vector payload: bytes left over');
  return payload;
}

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
  blobs: Record<string, () => Promise<BlobModule>>,
): VectorAssetImport {
  return async (clips = VECTOR_ACTIONS) => {
    const wanted = new Set(clips);
    const packed = JSON.parse((await asset()).default.data) as PackedAsset;
    const read = async (hash: string) => decodeBlob((await blobs[hash]!()).default);
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
