/** Lossless compaction: retained carrier geometry/TRS are required by composition. */
export function compactVectorAsset(data, kind) {
  if (['eyes', 'eyewear', 'accessory'].includes(kind)) {
    const retained = data.parts.flatMap((part, index) =>
      ['hand', 'panel', 'screen'].includes(part.role) ? [] : [index],
    );
    data.parts = retained.map((index) => data.parts[index]);
    for (const clip of Object.values(data.clips)) {
      clip.parts = retained.map((index) => clip.parts[index]);
    }
  }
  const widths = {
    matrix: 16,
    translation: 3,
    rotation: 4,
    scale: 3,
    camera: 4,
    coverage: 4,
    parameters: 4,
  };
  for (const clip of Object.values(data.clips)) {
    for (const track of clip.parts) {
      if (!track) continue;
      for (const [key, width] of Object.entries(widths)) {
        const samples = track[key]?.samples;
        if (samples?.length && samples.every((value, index) => value === samples[index % width])) {
          track[key] = { value: samples.slice(0, width) };
        }
      }
    }
  }
  return data;
}
