/**
 * The language's entries (`packages/bloom-language/spec/entries.generated.json`):
 * the root holds its views and values, `/router` the router, and each family
 * of nodes an entry of its own, so the codemod imports each name from its own.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LANGUAGE_PACKAGE } from './table';

export const LANGUAGE_MODULE = '@oxy.so/bloom-language';

const ENTRIES = (
  JSON.parse(readFileSync(join(LANGUAGE_PACKAGE, 'spec/entries.generated.json'), 'utf8')) as {
    entries: Record<string, readonly string[]>;
  }
).entries;

/** Each name the language exports, by the module that exports it. */
export const MODULE_OF: ReadonlyMap<string, string> = new Map(
  Object.entries(ENTRIES).flatMap(([entry, names]) =>
    names.map((name) => [name, entry === '.' ? LANGUAGE_MODULE : `${LANGUAGE_MODULE}/${entry}`]),
  ),
);

/** Whether `module` is one of the language's entries. */
export const isLanguageModule = (module: string | undefined): boolean =>
  module === LANGUAGE_MODULE || (module?.startsWith(`${LANGUAGE_MODULE}/`) ?? false);
