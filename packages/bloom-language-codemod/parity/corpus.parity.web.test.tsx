/**
 * Web parity of the corpus: each region as the app draws it (NativeWind's web
 * runtime hands the classes to react-native-web, the app's Tailwind sheet in
 * the document) and as the codemod wrote it, compared as DOM and the CSS that
 * reaches each element.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { webTree } from '../../bloom-language/parity/support/web';
import { CORPUS, loadCorpus } from './support/corpus';
import { insertRules, jsdomRules, normalizeWeb } from './support/web-css';

const { cases, css } = loadCorpus();
const results: Record<string, boolean> = {};

beforeAll(() => {
  insertRules(jsdomRules(css));
});

afterAll(() => {
  if (process.env.CODEMOD_CORPUS)
    writeFileSync(join(CORPUS, 'parity-web.json'), `${JSON.stringify(results, null, 1)}\n`);
});

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (name, c) => {
    const before = normalizeWeb(webTree(c.before(), scheme));
    const after = normalizeWeb(webTree(c.after(), scheme));
    results[`${scheme} ${name}`] = JSON.stringify(before) === JSON.stringify(after);
    expect(after).toEqual(before);
  });
});
