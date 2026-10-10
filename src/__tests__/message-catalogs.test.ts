/**
 * Every message catalog in Bloom, found rather than listed: each
 * `src/<family>/messages.ts` and `src/locale/common-messages.ts`, and in them
 * each export shaped like a
 * `MessageCatalog` (an `id` and the English strings). The other languages live
 * in `src/locale/translations/<language>.ts`, registered for every suite by
 * `__mocks__/setup.ts`.
 *
 * The `MessageCatalog` type already refuses a missing language or key. What a
 * type cannot see, this does:
 *   - the same SHAPE in every language, nested objects included;
 *   - a function entry that answers every language (called with sample
 *     arguments, it returns a non-empty string);
 *   - a language that is really English pasted in — the type-check passes on
 *     it. At most a quarter of a language's strings may equal English (brand
 *     names, "Menu", "OK" are legitimately shared), never all of them;
 *   - a family module that carries a language besides English, which would put
 *     that language back into every app that renders the family.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { BLOOM_LANGUAGES } from '../locale';
import { pickMessages, type MessageCatalog } from '../locale/messages';
import type { Translations } from '../locale/translations/types';

const SRC = join(__dirname, '..');

function catalogFiles(): string[] {
  const out = [join(SRC, 'locale', 'common-messages.ts')];
  for (const family of readdirSync(SRC)) {
    const file = join(SRC, family, 'messages.ts');
    if (family !== '__tests__' && statSync(join(SRC, family)).isDirectory()) {
      try {
        statSync(file);
        out.push(file);
      } catch {
        // No catalog in this family (yet).
      }
    }
  }
  return out;
}

type Leaf = string;

/** Flattens a catalog entry to `path → rendered string`, calling functions with sample arguments. */
function leaves(value: unknown, path = ''): Map<string, Leaf> {
  const out = new Map<string, Leaf>();
  if (typeof value === 'string') {
    out.set(path, value);
  } else if (typeof value === 'function') {
    const fn = value as (...args: unknown[]) => unknown;
    // Arguments are counts or strings, and a function's type says which — this
    // runtime check cannot read it, so it tries counts at even positions first
    // (the common `(n)` / `(name, n)` shapes) and all-strings second. A catalog
    // entry that renders under neither is broken for real callers too.
    const numeric = Array.from({ length: fn.length }, (_, index) =>
      index % 2 === 0 ? 3 : `«${index}»`,
    );
    const textual = Array.from({ length: fn.length }, (_, index) => `«${index}»`);
    let rendered: unknown;
    try {
      rendered = fn(...numeric);
    } catch {
      rendered = fn(...textual);
    }
    out.set(`${path}()`, typeof rendered === 'string' ? rendered : `<${typeof rendered}>`);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      for (const [p, leaf] of leaves(child, path ? `${path}.${key}` : key)) out.set(p, leaf);
    }
  }
  return out;
}

const isCatalog = (value: unknown): value is MessageCatalog<unknown> =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as { id?: unknown }).id === 'string' &&
  'en' in (value as object);

const catalogs: {
  name: string;
  exportName: string;
  source: MessageCatalog<unknown>;
  catalog: Record<string, unknown>;
}[] = [];
for (const file of catalogFiles()) {
  const module = require(file) as Record<string, unknown>;
  for (const [name, value] of Object.entries(module)) {
    if (isCatalog(value)) {
      const catalog = Object.fromEntries(
        BLOOM_LANGUAGES.map((language) => [language, pickMessages(value, language)]),
      );
      catalogs.push({
        name: `${relative(SRC, file)}#${name}`,
        exportName: name,
        source: value,
        catalog,
      });
    }
  }
}

// These exact broadcast labels are also idiomatic in German and Indonesian.
// Pin catalog/language/key/text: splitting shape labels into their own family
// leaves a one-word Avatar catalog, for which the percentage heuristic is invalid.
const SHARED_WORDS = [
  { catalog: 'avatar/messages.ts#AVATAR_MESSAGES', language: 'de', path: 'live', text: 'LIVE' },
  { catalog: 'avatar/messages.ts#AVATAR_MESSAGES', language: 'id', path: 'live', text: 'LIVE' },
] as const;

describe('message catalogs', () => {
  it('finds the catalogs (control: the common words and the date-picker at least)', () => {
    const names = catalogs.map((c) => c.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'locale/common-messages.ts#COMMON_MESSAGES',
        'date-picker/messages.ts#DATE_PICKER_MESSAGES',
      ]),
    );
  });

  it('pins shared-word exceptions to existing identical translations', () => {
    for (const entry of SHARED_WORDS) {
      const catalog = catalogs.find((item) => item.name === entry.catalog)?.catalog;
      expect(catalog).toBeDefined();
      expect(leaves(catalog?.en).get(entry.path)).toBe(entry.text);
      expect(leaves(catalog?.[entry.language]).get(entry.path)).toBe(entry.text);
    }
  });

  describe.each(catalogs.map((c) => [c.name, c.catalog, c] as const))(
    '%s',
    (_name, catalog, found) => {
      const english = leaves(catalog.en);

      it('carries English only, under its own name as id', () => {
        expect(Object.keys(found.source).sort()).toEqual(['en', 'id']);
        expect(found.source.id).toBe(found.exportName);
      });

      it('is translated in every language module', () => {
        for (const language of BLOOM_LANGUAGES) {
          if (language === 'en') continue;
          const module = require(`../locale/translations/${language}`) as { default: Translations };
          expect({ language, present: found.source.id in module.default }).toEqual({
            language,
            present: true,
          });
        }
      });

      it('has the same shape in every language, and every entry renders a string', () => {
        for (const language of BLOOM_LANGUAGES) {
          const own = leaves(catalog[language]);
          expect([...own.keys()].sort()).toEqual([...english.keys()].sort());
          for (const [path, text] of own) {
            expect({ language, path, ok: text.trim().length > 0 && !text.startsWith('<') }).toEqual(
              { language, path, ok: true },
            );
          }
        }
      });

      it('is translated, not English pasted in', () => {
        for (const language of BLOOM_LANGUAGES) {
          if (language === 'en') continue;
          const own = leaves(catalog[language]);
          const same = [...own]
            .filter(
              ([path, text]) =>
                english.get(path) === text &&
                !SHARED_WORDS.some(
                  (entry) =>
                    entry.catalog === _name &&
                    entry.language === language &&
                    entry.path === path &&
                    entry.text === text,
                ),
            )
            .map(([path]) => path);
          expect({ language, same: same.length > own.size / 4 ? same : [] }).toEqual({
            language,
            same: [],
          });
        }
      });
    },
  );
});
