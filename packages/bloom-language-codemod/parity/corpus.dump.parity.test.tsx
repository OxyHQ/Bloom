/**
 * One side of the corpus (PARITY_SIDE=before|after), rendered natively and written as
 * normalized host trees to <corpus>/dump-native-<side>.json, so each side can be drawn by
 * its own Bloom checkout (before: the owner's Bloom with NativeWind; after: the final line).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'react-native-css/compiler';

import { nativeTree } from '../../bloom-language/parity/support/native';
import { CORPUS, loadCorpus } from './support/corpus';
import { normalizeNative } from './support/normalize';

const { StyleCollection } = require('react-native-css/native-internal') as {
  StyleCollection: { styles: { clear(): void }; inject(sheet: unknown): void };
};

const SIDE = process.env.PARITY_SIDE as 'before' | 'after';
const { cases, css } = loadCorpus();
const stylesheet = compile(css, { inlineRem: 16 }).stylesheet();
const out: Record<string, string> = {};

beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(stylesheet);
});

afterAll(() => {
  writeFileSync(join(CORPUS, `dump-native-${SIDE}.json`), `${JSON.stringify(out, null, 0)}\n`);
});

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (name, c) => {
    let tree: unknown;
    try {
      tree = normalizeNative(nativeTree(c[SIDE](), scheme));
    } catch (error) {
      tree = { error: String(error) };
    }
    out[`${scheme} ${name}`] = JSON.stringify(tree);
  });
});
