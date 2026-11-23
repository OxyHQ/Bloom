/**
 * Native parity of the corpus: each region as the app draws it (NativeWind's
 * runtime over the app's compiled stylesheet, React Native's rem at the
 * preset's 16) and as the codemod wrote it, compared as committed host trees.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'react-native-css/compiler';

import { nativeTree } from '../../bloom-language/parity/support/native';
import { appNative, bloom22Native } from './support/native-frames';
import { bloom23Labels, withBloom23Changes } from './support/bloom-23-changes';
import { CORPUS, loadCorpus } from './support/corpus';
import { normalizeNative } from './support/normalize';

// NativeWind's style collection, required (its source is typed for its own build, not this one).
const { StyleCollection } = require('react-native-css/native-internal') as {
  StyleCollection: { styles: { clear(): void }; inject(sheet: unknown): void };
};

const { cases, css } = loadCorpus();
const stylesheet = compile(css, { inlineRem: 16 }).stylesheet();
const results: Record<string, boolean> = {};
const met = new Set<string>();

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
    const drawn = normalizeNative(
      nativeTree(c.before(), scheme, c.bloom22 ? bloom22Native : appNative),
    );
    const after = normalizeNative(nativeTree(c.after(), scheme));
    // Bloom 22 drawn, Bloom 23's own changes taken where the after side has them.
    const before = c.bloom22 ? withBloom23Changes(drawn, after, 'native', met) : drawn;
    results[`${scheme} ${name}`] = JSON.stringify(before) === JSON.stringify(after);
    expect(after).toEqual(before);
  });
});

// The sample's Bloom 22 regions still meet every listed Bloom 23 change; one no longer met goes.
if (!process.env.CODEMOD_CORPUS)
  it('meets each listed Bloom 23 change', () => {
    expect([...met].sort()).toEqual(bloom23Labels('native').sort());
  });
