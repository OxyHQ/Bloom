import fs from 'node:fs';
import path from 'node:path';
import { decodeBlob, type VectorBlob } from '../vector-pack';

/**
 * Every payload Bloom ships (pack format 3, scripts/avatar-vector/pack-assets.mjs) decodes, through
 * the runtime decoder, to exactly the integers its bytes hold: each number is `(min + n) / 10 **
 * decimals`, read here a second way. `scripts/test-avatar-vector-pack.mjs` repacks the shipped data
 * byte for byte, and `vector-pack-frames.test.ts` compares it with the JSON pack it came from.
 */
const directory = path.join(__dirname, '../vector-assets');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')) as {
  blobs: Record<string, unknown>;
};
type Field = { rows?: number; samples?: number; decimals: number; columns: [number, number][] };

it('decodes every shipped payload to the integers its bytes hold', () => {
  let numbers = 0;
  for (const hash of Object.keys(manifest.blobs)) {
    const blob = JSON.parse(
      fs.readFileSync(path.join(directory, 'blobs', `${hash}.json`), 'utf8'),
    ) as VectorBlob;
    const bytes = Buffer.from(blob.data, 'base64');
    const payload = decodeBlob(blob);
    let at = 0;
    for (const [key, raw] of Object.entries(blob)) {
      const field = raw as Field;
      if (key === 'data' || (field.rows === undefined && field.samples === undefined)) {
        if (key !== 'data') expect(payload[key]).toEqual(raw);
        continue;
      }
      const decoded =
        field.rows === undefined
          ? (payload[key] as { samples: number[] }).samples
          : (payload[key] as number[][]).flat();
      expect(decoded).toHaveLength((field.rows ?? 0) * 3 + (field.samples ?? 0));
      const width = field.columns.length;
      field.columns.forEach(([min, size], c) => {
        for (let i = c; i < decoded.length; i += width, at += size) {
          const n = size ? bytes.readUIntLE(at, size) : 0;
          if (decoded[i] !== (min + n) / 10 ** field.decimals)
            throw new Error(
              `${hash}/${key}[${i}]: ${decoded[i]} is not (${min} + ${n}) / 1e${field.decimals}`,
            );
          numbers++;
        }
      });
    }
    expect(at).toBe(bytes.length);
  }
  expect(numbers).toBeGreaterThan(4_000_000);
});
