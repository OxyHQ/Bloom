/**
 * Bloom ships English inline and loads every other language on demand
 * (`src/locale/translations.ts`). These pin the three properties that make
 * that invisible to an app:
 *   - a `LocaleProvider` publishes a locale only once its strings are loaded,
 *     so neither a first paint nor a switch shows an English frame;
 *   - a language that fails to load renders English instead of holding the
 *     screen;
 *   - each language module has exactly ONE importer, the loader's `import()`:
 *     Expo's web export hoists any module two async chunks share into the eager
 *     `__common` chunk, which would put that language back into every page.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import type React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

import { COMMON_MESSAGES } from '../locale/common-messages';
import { LocaleProvider, useBloomLocale } from '../locale/context';
import { BLOOM_LANGUAGES } from '../locale/languages';
import { useMessages } from '../locale/messages';
import {
  getBloomTranslations,
  loadBloomLocale,
  registerBloomTranslations,
  resetBloomTranslations,
} from '../locale/translations';

const SRC = join(__dirname, '..');
const TRANSLATED = BLOOM_LANGUAGES.filter((language) => language !== 'en');

// Every frame the probe rendered, so a test can say what was NEVER on screen.
let frames: string[] = [];
let mounted: ReactTestRenderer[] = [];
const mount = (element: React.ReactElement): ReactTestRenderer => {
  const tree = create(element);
  mounted.push(tree);
  return tree;
};
function Probe() {
  const { messages } = useMessages(COMMON_MESSAGES);
  const locale = useBloomLocale();
  const text = `${locale ?? 'runtime'}:${messages.cancel}`;
  frames.push(text);
  return <Text testID="probe">{text}</Text>;
}
beforeEach(() => {
  frames = [];
});
afterEach(() => {
  act(() => mounted.forEach((tree) => tree.unmount()));
  mounted = [];
});

const shown = (tree: ReactTestRenderer) => tree.root.findAllByProps({ testID: 'probe' })[0]?.props.children;

// Snapshot of what `__mocks__/setup.ts` registered, restored after each test.
const registered = getBloomTranslations().tables;
afterEach(() => {
  resetBloomTranslations();
  for (const [language, translations] of Object.entries(registered)) {
    registerBloomTranslations(language as (typeof TRANSLATED)[number], translations!);
  }
});

describe('on-demand languages', () => {
  it('holds the first paint on `fallback`, then paints translated', async () => {
    resetBloomTranslations();
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = mount(
        <LocaleProvider locale="es" fallback={<Text testID="fallback">…</Text>}>
          <Probe />
        </LocaleProvider>,
      );
    });
    // The effect has started the load; jest resolves `import()` as a require.
    await act(async () => {
      await loadBloomLocale('es');
    });
    expect(tree.root.findAllByProps({ testID: 'fallback' })).toHaveLength(0);
    expect(shown(tree)).toBe('es:Cancelar');
  });

  it('never renders an English frame on a translated first paint', async () => {
    resetBloomTranslations();
    await act(async () => {
      mount(
        <LocaleProvider locale="de" fallback={<Text testID="fallback">…</Text>}>
          <Probe />
        </LocaleProvider>,
      );
    });
    await act(async () => {
      await loadBloomLocale('de');
    });
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.every((frame) => frame === 'de:Abbrechen')).toBe(true);
  });

  it('keeps the previous locale during a switch, then changes in one render', async () => {
    resetBloomTranslations();
    await loadBloomLocale('es');
    let tree!: ReactTestRenderer;
    act(() => {
      tree = mount(
        <LocaleProvider locale="es">
          <Probe />
        </LocaleProvider>,
      );
    });
    expect(shown(tree)).toBe('es:Cancelar');

    act(() => {
      tree.update(
        <LocaleProvider locale="fr">
          <Probe />
        </LocaleProvider>,
      );
    });
    await act(async () => {
      await loadBloomLocale('fr');
    });
    expect(shown(tree)).toBe('fr:Annuler');
    // Until French loaded the subtree stayed Spanish: no English frame, and no
    // frame mixing French formatting with Spanish words.
    expect(new Set(frames)).toEqual(new Set(['es:Cancelar', 'fr:Annuler']));
  });

  it('renders English when a language fails to load, instead of holding the screen', async () => {
    resetBloomTranslations();
    jest.doMock('../locale/translations/ja', () => {
      throw new Error('chunk failed');
    });
    try {
      let tree!: ReactTestRenderer;
      await act(async () => {
        tree = mount(
          <LocaleProvider locale="ja" fallback={<Text testID="fallback">…</Text>}>
            <Probe />
          </LocaleProvider>,
        );
      });
      await act(async () => {
        await loadBloomLocale('ja').catch(() => undefined);
      });
      expect(tree.root.findAllByProps({ testID: 'fallback' })).toHaveLength(0);
      expect(shown(tree)).toBe('ja:Cancel');
    } finally {
      jest.dontMock('../locale/translations/ja');
    }
  });
});

describe('language modules', () => {
  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return entry === '__tests__' ? [] : sources(path);
      return /\.tsx?$/.test(entry) ? [path] : [];
    });
  }

  it('have exactly one importer, one `import()` each', () => {
    const importers = new Map<string, string[]>();
    for (const file of sources(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]*translations\/([a-z]{2}))['"]/g)) {
        const language = match[2] ?? '';
        const list = importers.get(language) ?? [];
        list.push(`${relative(SRC, file)} ${match[0].startsWith('from') ? 'static' : 'import()'}`);
        importers.set(language, list);
      }
    }
    for (const language of TRANSLATED) {
      expect({ language, importers: importers.get(language) }).toEqual({
        language,
        importers: ['locale/translations.ts import()'],
      });
    }
  });

  it('link no family module, so loading one cannot pull English strings into it', () => {
    for (const language of TRANSLATED) {
      const text = readFileSync(join(SRC, 'locale', 'translations', `${language}.ts`), 'utf8');
      const runtime = [...text.matchAll(/^import (?!type )[^;]*from '([^']+)';/gm)].map((match) => match[1] ?? '');
      for (const specifier of runtime) {
        expect({ language, specifier, ok: /^\.\.\/(plural|languages)$|\/message-helpers$/.test(specifier) }).toEqual({
          language,
          specifier,
          ok: true,
        });
      }
    }
  });
});
