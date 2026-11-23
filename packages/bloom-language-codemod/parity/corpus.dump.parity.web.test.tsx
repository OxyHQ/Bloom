/**
 * One side of the corpus (PARITY_SIDE=before|after) on the web, written as normalized DOM and
 * CSS to <corpus>/dump-web-<side>.json (see corpus.dump.parity.test.tsx).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { webTree } from '../../bloom-language/parity/support/web';
import { CORPUS, loadCorpus } from './support/corpus';
import { insertRules, jsdomRules, normalizeWeb } from './support/web-css';

const SIDE = process.env.PARITY_SIDE as 'before' | 'after';
const { cases, css } = loadCorpus();
const out: Record<string, string> = {};

beforeAll(() => {
  insertRules(jsdomRules(css));
});

afterAll(() => {
  writeFileSync(join(CORPUS, `dump-web-${SIDE}.json`), `${JSON.stringify(out, null, 0)}\n`);
});

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (name, c) => {
    let tree: unknown;
    try {
      tree = normalizeWeb(webTree(c[SIDE](), scheme));
    } catch (error) {
      tree = { error: String(error) };
    }
    out[`${scheme} ${name}`] = JSON.stringify(tree);
  });
});
