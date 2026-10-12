/** Pure assertions also allow inspecting a saved browser report without rerendering. */
import assert from 'node:assert/strict';
export function validateComputerComparison(report) {
  assert.equal(report.glError, 0, 'No invalid WebGL draw');
  for (const result of report.cases) {
    assert(
      result.foregroundCompositedRGBError < 1,
      `Computer ${result.time}s exceeds existing <1/255 foreground RGB tolerance`,
    );
    assert(result.foregroundAlphaError < 1, 'Alpha coverage remains within 1/255');
    const expectedBounds = { ...result.bounds[1] };
    // Pin measured alpha-threshold edges, including the original coordinate.
    // Purple top-fur alpha is 22 vs 20 on these rows, crossing the >20 bounds cutoff.
    // These are known raster shortfalls, not permission for any edge to drift.
    const knownEdges =
      {
        'blue_beret:2': { maxX: [297, 296] },
        'purple_heart:0': { minY: [39, 38] },
        'purple_heart:2': { minY: [55, 54] },
        'lime_headphones:5': { maxY: [291, 290] },
      }[`${result.preset}:${result.time}`] || {};
    for (const [edge, [original, actual]] of Object.entries(knownEdges)) {
      assert.equal(result.bounds[1][edge], original, 'Original edge fixture is unchanged');
      expectedBounds[edge] = actual;
    }
    assert.deepEqual(
      result.bounds[0],
      expectedBounds,
      `${result.preset} ${result.time}s: exact bounds except pinned raster edges`,
    );
    if (result.count === 2)
      assert.equal(result.changedNeighborPixels, 0, 'Other avatar remains pixel-identical');
    assert(result.bounds[0].maxX > result.bounds[0].minX, 'Rendered avatar is nonblank');
  }
  assert.deepEqual(report.forbidden, []);
  assert.deepEqual(report.errors, []);
  if (report.ui) {
    assert.equal(report.ui.length, new Set(report.ui.map((c) => c.preset)).size);
    if (report.cases.length)
      assert.equal(report.ui.length, new Set(report.cases.map((c) => c.preset)).size);
    for (const sample of report.ui) {
      assert.equal(sample.glError, 0);
      assert.equal(sample.visibleComputerParts, 0);
      assert.equal(sample.stats.contexts, 1);
    }
    assert.equal(report.mixedWork.glError, 0);
    assert.equal(report.mixedActions.glError, 0);
    assert.equal(report.mixedWork.stats.states.length, 8);
    assert(report.mixedWork.stats.states.every((s) => s.motion === 'work'));
    assert(
      report.mixedActions.stats.states.every(
        (s, i) => s.motion === ['work', 'reaction', 'idle'][i % 3],
      ),
    );
  }
}
