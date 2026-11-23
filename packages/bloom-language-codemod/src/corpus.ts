/**
 * The parity corpus as a module: each fixture's two sides as functions. The
 * before side is the app as it draws today: React Native's components as
 * NativeWind's own (react-native-css, as the app's Babel preset rewrites React
 * Native's imports, its Text among them, which names no face of its own) and
 * Bloom's. The after side is the language over this checkout's
 * Bloom. `parity/corpus.*.test.tsx` renders them.
 *
 * Bloom 23 has no `className`: a region whose before side hands a class to a
 * Bloom component (`<Text className>`, `contentContainerClassName`) is drawn,
 * before, with the last Bloom that drew it (22, `bloom22` on the case); every
 * other region with this checkout's Bloom on both sides, so the two differ
 * only by what the codemod wrote.
 */
import { join, relative } from 'node:path';
import { parseExpression } from '@babel/parser';
import type { Node } from '@babel/types';

import { LANGUAGE_PACKAGE } from './table';
import type { Fixture, Source } from './transform';

/** What `screen()` draws a body's root with. */
const SCREEN_HOST = join(LANGUAGE_PACKAGE, 'src/router/screen-host');
/**
 * The Bloom that draws a class handed to a Bloom component: Bloom 22, the last
 * that took one (Bloom 23 has no `className` prop), installed as `bloom-22`.
 */
export const BEFORE_BLOOM = 'bloom-22';

/** Which Bloom a side draws: Bloom 22 (`before22`) or this checkout's. */
type Side = 'before' | 'before22' | 'after';

const NATIVEWIND: Record<string, string> = {
  View: 'react-native-css/components/View',
  Pressable: 'react-native-css/components/Pressable',
  Text: 'react-native-css/components/Text',
  Image: 'react-native-css/components/Image',
};

/** A module path relative to the corpus written to `dir`. */
function relativeTo(dir: string, module: string): string {
  const path = relative(dir, module);
  return path.startsWith('.') ? path : `./${path}`;
}

const BLOOM_MODULE = /^@oxy\.so\/bloom(\/|$)/;
/** A class prop Bloom 22 took and Bloom 23 removed (`className`, `contentContainerClassName`…). */
const CLASS_PROP = /^(className|[a-z]\w*ClassName)$/;

/** A Bloom module on `side`: Bloom 22's for `before22`, else this checkout's. */
function bloomModule(module: string, side: Side): string {
  if (side !== 'before22' || !BLOOM_MODULE.test(module)) return module;
  return module.replace('@oxy.so/bloom', BEFORE_BLOOM);
}

/** Whether the before side hands a class to a Bloom component, which only Bloom 22 draws. */
export function handsBloomAClass(fixture: Fixture): boolean {
  const bloom = (name: string) => {
    const source = fixture.bindings[name.split('.')[0] as string];
    return source !== undefined && BLOOM_MODULE.test(source.module);
  };
  let found = false;
  const visit = (node: unknown): void => {
    if (found || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const n = node as Node;
    if (n.type === 'JSXOpeningElement') {
      const name =
        n.name.type === 'JSXIdentifier'
          ? n.name.name
          : n.name.type === 'JSXMemberExpression' && n.name.object.type === 'JSXIdentifier'
            ? n.name.object.name
            : undefined;
      if (
        name !== undefined &&
        bloom(name) &&
        n.attributes.some(
          (a) =>
            a.type === 'JSXAttribute' &&
            a.name.type === 'JSXIdentifier' &&
            CLASS_PROP.test(a.name.name),
        )
      )
        found = true;
    }
    for (const [key, value] of Object.entries(n))
      if (key !== 'loc' && key !== 'start' && key !== 'end') visit(value);
  };
  visit(parseExpression(`<>${fixture.before}</>`, { plugins: ['jsx', 'typescript'] }));
  return found;
}

/** The module and export a binding is drawn from on `side` of a corpus written to `dir`. */
function origin(source: Source, dir: string, side: Side): { module: string; name: string } {
  if (source.module === 'react-native') {
    const module = NATIVEWIND[source.imported];
    if (module) return { module, name: source.imported };
  }
  const module =
    source.module === '@oxy.so/bloom/icons'
      ? `@oxy.so/bloom/icons/${source.imported}`
      : source.module;
  return { module: bloomModule(module, side), name: source.imported };
}

/** The corpus module for `fixtures`, to be written to the directory `dir`. */
export function corpusModule(fixtures: readonly Fixture[], dir: string): string {
  const imports = new Map<string, string>();
  const alias = (source: Source, side: Side) => {
    const { module, name } = origin(source, dir, side);
    const key = `${module}#${name}`;
    const known = imports.get(key);
    if (known) return known;
    const local = `I${imports.size}`;
    imports.set(key, local);
    return local;
  };
  /** Each region's app colour table, declared once at module scope as the app declares it. */
  const tables: string[] = [];
  const cases = fixtures.map((fixture) => {
    const bloom22 = handsBloomAClass(fixture);
    const beforeSide: Side = bloom22 ? 'before22' : 'before';
    const bindings = (side: Side) =>
      Object.entries(fixture.bindings)
        .map(([local, source]) => `const ${local} = ${alias(source, side)};`)
        .join(' ');
    // A language name the file already imports (a file partly in the language) is bound once, as a binding.
    const names = fixture.language.filter(
      (entry) => !((entry.split(':').pop() as string).trim() in fixture.bindings),
    );
    const language = names.length ? `const { ${names.join(', ')} } = L;` : '';
    // A node drawn only inside a Bloom component (a screen's scroll view in a Screen) is, on both sides.
    const within = (side: Side) =>
      fixture.within.map((key) => {
        const [module, imported] = key.split('#') as [string, string];
        return alias({ module, imported }, side);
      });
    // A region that pads by the device's insets is drawn under the corpus's, on both sides.
    const open = (side: Side) =>
      [
        ...(fixture.insets ? ['<SafeAreaInsetsContext.Provider value={PARITY_INSETS}>{'] : []),
        ...within(side).map((local) => `<${local}>{`),
      ].join('');
    const close = (side: Side) =>
      [
        ...within(side)
          .map((local) => `}</${local}>`)
          .reverse(),
        ...(fixture.insets ? ['}</SafeAreaInsetsContext.Provider>'] : []),
      ].join('');
    // A before side that reads the theme is a component, so it reads it where it is drawn.
    const theme = bloom22 ? 'useParityTheme22' : 'useParityTheme';
    const before = fixture.themed
      ? `function Before() { const parityTheme = ${theme}(); const parityTokens = useParityTokens(); const paritySurface = useParitySurface(); ${bindings(beforeSide)} return (${fixture.before}); } return (${open(beforeSide)}<Before />${close(beforeSide)});`
      : `${bindings(beforeSide)} return (${open(beforeSide)}${fixture.before}${close(beforeSide)});`;
    let colors = '';
    if (fixture.appColors) {
      const local = `T${tables.length}`;
      tables.push(
        `const ${local} = L.defineTokens({ color: ${JSON.stringify(fixture.appColors.color)} });`,
      );
      colors = `const ${fixture.appColors.table} = ${local};`;
    }
    // A route's Screen is drawn as `screen()` draws its body's root.
    const after = fixture.screen ? `<ScreenHost root={${fixture.after}} />` : fixture.after;
    return `  {
    name: ${JSON.stringify(fixture.name)},
    bloom22: ${bloom22},
    before: () => { ${before} },
    after: () => { ${bindings('after')} ${language} ${colors} return (${open('after')}${after}${close('after')}); },
  },`;
  });
  const lines = [
    '// @ts-nocheck GENERATED by bloom-language-codemod --fixtures: each region of the app, before and after.',
    "import * as RN from 'react-native';",
    "import * as L from '@oxy.so/bloom-language';",
    "import { toElement } from '@oxy.so/bloom-language';",
    "import { useColorTokens as useParityTokens, useTheme as useParityTheme } from '@oxy.so/bloom/theme';",
    `import { useTheme as useParityTheme22 } from '${BEFORE_BLOOM}/theme';`,
    "import { useSurfaceFill as useParitySurface } from '@oxy.so/bloom/styles';",
    "import { SafeAreaInsetsContext } from 'react-native-safe-area-context';",
    `import { ScreenHost } from '${relativeTo(dir, SCREEN_HOST)}';`,
    ...[...imports].map(([key, local]) => {
      const [module, name] = key.split('#');
      return `import { ${name} as ${local} } from '${module}';`;
    }),
    '',
    ...(tables.length ? [...tables, ''] : []),
    '/** The insets of a phone with a notch and a home bar. */',
    'const PARITY_INSETS = { top: 47, bottom: 34, left: 0, right: 0 };',
    '',
    'function Hole({ n }: { n: string }) {',
    "  return <RN.View testID={'hole-' + n} />;",
    '}',
    '',
    '/** The items an array of data stands for, on both sides: records with the fields Bloom reads of a list, a choice or a member. */',
    'const ITEMS = [',
    "  { id: 'a', value: 'a', label: 'Ana', title: 'Ana', name: 'Ana' },",
    "  { id: 'b', value: 'b', label: 'Rui', title: 'Rui', name: 'Rui' },",
    '];',
    '',
    'export const CASES = [',
    ...cases,
    '];',
    '',
  ];
  return lines.join('\n');
}
