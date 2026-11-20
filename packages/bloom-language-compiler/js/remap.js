const { TraceMap, originalPositionFor } = require('@jridgewell/trace-mapping');
const { isVlqMap, toBabelSegments, toSegmentTuple, vlqMapFromTuples } = require('metro-source-map');

/**
 * Point the source map Metro's worker produced for the compiled module back
 * at the file the author wrote, through the compiler's own source map.
 *
 * Metro keeps a module map either as segment tuples (`[genLine, genColumn,
 * line, column, name?]`, lines 1-based, columns 0-based, as trace-mapping
 * also counts) or VLQ-encoded (`{ mappings, names }`); the result keeps the
 * form it was given.
 *
 * @param {Array<Array<number | string>> | { mappings: string, names: string[] }} map
 * @param {string} compilerMap
 */
function remapMetroMap(map, compilerMap) {
  const vlq = isVlqMap(map);
  const tuples = vlq
    ? toBabelSegments({ version: 3, sources: [''], names: map.names, mappings: map.mappings }).map(
        toSegmentTuple,
      )
    : map;
  const trace = new TraceMap(compilerMap);
  const remapped = tuples.map((segment) => {
    if (segment.length < 4) return segment;
    const original = precedingOriginal(trace, segment[2], segment[3]);
    if (original == null) return [segment[0], segment[1]];
    // Metro's names only: the compiler's generated identifiers carry their
    // chain's source text as a name, which is no name a debugger should show.
    const name = segment[4];
    return name == null
      ? [segment[0], segment[1], original.line, original.column]
      : [segment[0], segment[1], original.line, original.column, name];
  });
  return vlq ? vlqMapFromTuples(remapped) : remapped;
}

/**
 * The original position of the nearest mapping at or before a position of
 * the compiled module. Every node the compiler generates for one chain shares
 * the chain's position, and the code generator writes that position once, so
 * the lines of a hoisted style or element after its first carry no mapping of
 * their own: they belong to the mapping before them.
 */
function precedingOriginal(trace, line, column) {
  for (let current = line; current >= 1; current--) {
    const searchColumn = current === line ? column : Number.MAX_SAFE_INTEGER;
    const original = originalPositionFor(trace, { line: current, column: searchColumn });
    if (original.line != null) return original;
  }
  return null;
}

module.exports = { remapMetroMap };
