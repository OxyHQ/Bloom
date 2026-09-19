/**
 * Write `docs/adoption-matrix.mdx` from the derivation in
 * `src/__tests__/support/adoption-matrix.ts` — which lives under `src/` so
 * `tsc` typechecks it and the package does not ship it, and is imported from
 * here so the generator and the gate can never derive different matrices.
 *
 * Run with bun (imports the TS source directly):
 *   bun run generate:adoption-matrix
 *
 * The checked-in output is asserted byte-identical by
 * `src/__tests__/adoption-matrix.test.ts`, so a family that changes what it
 * reads and is not regenerated fails there rather than shipping a matrix that
 * describes a library Bloom no longer is.
 */
import { writeFileSync } from 'node:fs';
import { relative } from 'node:path';

import {
  MATRIX_PATH,
  REPO_ROOT,
  renderAdoptionMatrix,
} from '../src/__tests__/support/adoption-matrix';

const mdx = renderAdoptionMatrix();
writeFileSync(MATRIX_PATH, mdx);
console.log(
  `[generate-adoption-matrix] wrote ${relative(REPO_ROOT, MATRIX_PATH)} (${mdx.length} bytes)`,
);
