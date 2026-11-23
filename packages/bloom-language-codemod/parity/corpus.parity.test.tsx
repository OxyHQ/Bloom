/**
 * Native parity of the corpus: each region as the app draws it (NativeWind's
 * runtime over the app's compiled stylesheet, React Native's rem at the
 * preset's 16) and as the codemod wrote it, compared as committed host trees.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'react-native-css/compiler';

import { nativeTree } from '../../bloom-language/parity/support/native';
import { CORPUS, loadCorpus } from './support/corpus';
import { normalizeNative } from './support/normalize';

// NativeWind's style collection, required (its source is typed for its own build, not this one).
const { StyleCollection } = require('react-native-css/native-internal') as {
  StyleCollection: { styles: { clear(): void }; inject(sheet: unknown): void };
};

const { cases, css } = loadCorpus();
const stylesheet = compile(css, { inlineRem: 16 }).stylesheet();
const results: Record<string, boolean> = {};

beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(stylesheet);
});

afterAll(() => {
  if (process.env.CODEMOD_CORPUS)
    writeFileSync(join(CORPUS, 'parity-native.json'), `${JSON.stringify(results, null, 1)}\n`);
});

describe.each(['light', 'dark'] as const)('%s', (scheme) => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (name, c) => {
    const before = normalizeNative(nativeTree(c.before(), scheme));
    const after = normalizeNative(nativeTree(c.after(), scheme));
    results[`${scheme} ${name}`] = JSON.stringify(before) === JSON.stringify(after);
    expect(after).toEqual(before);
  });
});
