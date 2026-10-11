// Exact prepared-scene reuse. These buffers are owned copies, not views into
// WASM memory or transferable worker replies. Keep the memory cost bounded.
export function preparationKey(request) {
  if (!request.points && !request.authoredParts) return null;
  return JSON.stringify([
    Array.from(request.appearance),
    request.quality,
    request.key,
    request.activities,
    request.points,
    request.authoredParts,
  ]);
}

export function createPreparationCache({
  maximumBytes = 8 * 1024 * 1024,
  maximumEntries = 16,
} = {}) {
  const entries = new Map();
  let bytes = 0,
    hits = 0,
    misses = 0;
  return {
    get(key) {
      if (key === null) return null;
      const entry = entries.get(key);
      if (!entry) {
        misses++;
        return null;
      }
      entries.delete(key);
      entries.set(key, entry);
      hits++;
      // The receiver may transfer or mutate this result independently.
      return entry.value.slice();
    },
    set(key, value) {
      if (key === null || !(value instanceof Uint8Array) || !value.length)
        return;
      const cost = value.byteLength + key.length * 2;
      if (cost > maximumBytes || maximumEntries < 1) return;
      const previous = entries.get(key);
      if (previous) {
        bytes -= previous.cost;
        entries.delete(key);
      }
      while (
        entries.size &&
        (entries.size >= maximumEntries || bytes + cost > maximumBytes)
      ) {
        const [oldKey, old] = entries.entries().next().value;
        entries.delete(oldKey);
        bytes -= old.cost;
      }
      entries.set(key, { value: value.slice(), cost });
      bytes += cost;
    },
    stats: () => ({ entries: entries.size, bytes, maximumBytes, hits, misses }),
  };
}
