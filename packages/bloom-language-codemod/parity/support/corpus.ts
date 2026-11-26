/**
 * The corpus the parity suites render: `CODEMOD_CORPUS` (a directory the CLI
 * wrote with `--fixtures`: `corpus.generated.tsx` and `app.generated.css`), else the
 * package's own sample (`parity/corpus`, from `parity/sample-app`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';

export interface CorpusCase {
  name: string;
  /** The before side hands a class to a Bloom component: it is drawn with Bloom 22 (`parity/support/*-frames.tsx`). */
  bloom22: boolean;
  before: () => ReactElement;
  after: () => ReactElement;
}

export const CORPUS = process.env.CODEMOD_CORPUS ?? join(__dirname, '../corpus');

export function loadCorpus(): { cases: CorpusCase[]; css: string } {
  const { CASES } = require(join(CORPUS, 'corpus.generated.tsx')) as { CASES: CorpusCase[] };
  return { cases: CASES, css: readFileSync(join(CORPUS, 'app.generated.css'), 'utf8') };
}

/**
 * `expect(after).toEqual(before)`, its outcome recorded under `key` as the
 * test reports it: a result is `true` exactly when the test passes (no
 * stricter comparison, which a key order or an undefined value would fail).
 */
export function expectSame(
  results: Record<string, boolean>,
  key: string,
  after: unknown,
  before: unknown,
): void {
  results[key] = false;
  expect(after).toEqual(before);
  results[key] = true;
}
