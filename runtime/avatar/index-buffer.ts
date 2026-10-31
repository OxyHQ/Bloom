type IndexRange = { byteOffset: number; count: number; componentType: string };

/** Keep authored draw order and Three's primitive-restart-safe index width,
 * without materializing the indices as boxed JavaScript numbers. */
export function decodeIndexBuffer(binary: ArrayBuffer, ranges: readonly IndexRange[]) {
  const views = ranges.map((range) =>
    range.componentType === 'uint16'
      ? new Uint16Array(binary, range.byteOffset, range.count)
      : new Uint32Array(binary, range.byteOffset, range.count),
  );
  let count = 0;
  let wide = false;
  for (const view of views) {
    count += view.length;
    if (!wide)
      for (let index = view.length - 1; index >= 0; index--)
        if (view[index]! >= 65535) {
          wide = true;
          break;
        }
  }
  const IndexArray = wide ? Uint32Array : Uint16Array;
  // Geometry vertices already retain this same immutable asset buffer.
  if (views.length === 1 && views[0] instanceof IndexArray) return views[0];
  const indices = new IndexArray(count);
  let offset = 0;
  for (const view of views) {
    indices.set(view, offset);
    offset += view.length;
  }
  return indices;
}
