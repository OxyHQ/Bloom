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
  before: () => ReactElement;
  after: () => ReactElement;
}

export const CORPUS = process.env.CODEMOD_CORPUS ?? join(__dirname, '../corpus');

export function loadCorpus(): { cases: CorpusCase[]; css: string } {
  const { CASES } = require(join(CORPUS, 'corpus.generated.tsx')) as { CASES: CorpusCase[] };
  return { cases: CASES, css: readFileSync(join(CORPUS, 'app.generated.css'), 'utf8') };
}
