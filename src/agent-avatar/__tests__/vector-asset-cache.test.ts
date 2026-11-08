import { vectorAssetLoader } from '../vector-assets';
import { vectorShapeImports } from '../vector-asset-imports';
import type { VectorData } from '../vector-types';

it('an evicted failed load cannot remove a newer in-flight request for the same importer', async () => {
  const ids = Object.keys(vectorShapeImports).slice(0, 13) as (keyof typeof vectorShapeImports)[];
  const original = ids.map((id) => vectorShapeImports[id]);
  const data = { parts: [], clips: {} } as unknown as VectorData;
  let rejectOld!: (reason: Error) => void, resolveNew!: (value: { default: VectorData }) => void;
  const old = new Promise<{ default: VectorData }>((_, reject) => {
    rejectOld = reject;
  });
  const fresh = new Promise<{ default: VectorData }>((resolve) => {
    resolveNew = resolve;
  });
  let calls = 0;
  try {
    ids.forEach((id) => {
      Object.defineProperty(vectorShapeImports, id, { value: async () => ({ default: data }) });
    });
    Object.defineProperty(vectorShapeImports, ids[0]!, {
      value: () => (++calls === 1 ? old : fresh),
    });
    const first = vectorAssetLoader.shape(ids[0]!);
    const handled = first.catch(() => undefined);
    for (const id of ids.slice(1)) await vectorAssetLoader.shape(id);
    const second = vectorAssetLoader.shape(ids[0]!);
    rejectOld(new Error('old request failed after eviction'));
    await handled;
    expect(vectorAssetLoader.shape(ids[0]!)).toBe(second);
    expect(calls).toBe(2);
    resolveNew({ default: data });
    expect(await second).toBe(data);
  } finally {
    resolveNew({ default: data });
    ids.forEach((id, index) => {
      Object.defineProperty(vectorShapeImports, id, { value: original[index]! });
    });
  }
});
