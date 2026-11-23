/**
 * An SDK's className → style conversion as a parity corpus.
 *
 *   bun parity/sdk/corpus.ts <table.json> <out-dir>
 *
 * `table.json` lists each converted JSX site of the SDK: the element, its import, its literal props,
 * the class string it had and the style (colours as Bloom tokens, `$mutedForeground`) it now has.
 * Each site becomes a case: before, the element with its class, drawn as an app on Bloom 22 drew it
 * (NativeWind's runtime over the app's compiled Tailwind); after, the same element with the style
 * under Bloom 23, its colours read from `useColorTokens()`. `parity/*.parity*.test.tsx` compare the
 * two with `CODEMOD_CORPUS=<out-dir>`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import { BLOOM_BASELINE_CSS, packageCandidates, tailwind } from '../../src/tailwind';

interface Site {
  file: string;
  line: number;
  attr: string;
  element: string;
  source: string;
  imported: string;
  className: string;
  props: Record<string, string | number | boolean>;
  style: Record<string, string | number>;
  /** A hand-converted site's style as code, in place of `style`: it reads `t` (the colour tokens) and `md` (the window at Bloom's md breakpoint or wider). */
  styleExpr?: string;
  /** The after side is another element (a Bloom 22 heading under a class is Bloom 23's Text as a heading). */
  after?: { imported: string; source?: string; props: Site['props'] };
}

const [tablePath, outArg] = process.argv.slice(2);
const out = resolve(outArg as string);
const table = JSON.parse(readFileSync(tablePath as string, 'utf8')) as Site[];
const SUPPORT = resolve(__dirname, '../support');

const STYLE_OF: Record<string, string> = {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  columnWrapperClassName: 'columnWrapperStyle',
};

/** Children a site's element is given, the same on both sides. */
function children(site: Site): string {
  if (/^(FlatList|ScrollView|Image)$/.test(site.imported) || site.element.endsWith('Image'))
    return '';
  return `{'⟨${site.line}⟩'}`;
}

function extraProps(site: Site): string {
  if (site.imported === 'FlatList') return ' data={ITEMS} renderItem={() => null}';
  if (site.imported === 'Button' && site.props.onPress === undefined) return ' onPress={() => {}}';
  return '';
}

const imports = new Map<string, string>();
function local(name: string, from: string): string {
  const key = `${name}|${from}`;
  let id = imports.get(key);
  if (id === undefined) {
    id = `I${imports.size}`;
    imports.set(key, id);
  }
  return id;
}

function sides(site: Site): { before: string; after: string; bloom22: boolean } {
  const [root, member] = site.element.split('.');
  const name = site.imported === 'default' ? (root as string) : site.imported;
  let before: string;
  let after: string;
  let bloom22 = false;
  if (site.source.startsWith('@oxy.so/bloom')) {
    bloom22 = true;
    before = local(name, site.source.replace('@oxy.so/bloom', 'bloom-22'));
    after = local(name, site.source);
  } else if (site.source === 'react-native' && name === 'Text') {
    before = local('Text', join(SUPPORT, 'app-text'));
    after = before;
  } else if (site.source === 'react-native' || site.source === 'react-native-css/components') {
    before = local(name, `react-native-css/components/${name}`);
    after = `RN.${name}`;
  } else {
    throw new Error(`no rule for ${site.element} from ${site.source} (${site.file}:${site.line})`);
  }
  if (member) {
    before = `${before}.${member}`;
    after = `${after}.${member}`;
  }
  if (site.after) after = local(site.after.imported, site.after.source ?? site.source);
  return { before, after, bloom22 };
}

function propsCode(props: Site['props']): string {
  return Object.entries(props)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}={${JSON.stringify(v)}}`))
    .join('');
}

function styleCode(style: Site['style']): string {
  const entries = Object.entries(style).map(([k, v]) => {
    if (typeof v === 'number') return `${k}: ${v}`;
    let m = /^\$(\w+)$/.exec(v);
    if (m) return `${k}: t.${m[1]}`;
    m = /^tokenAlpha\(\$(\w+), ([\d.]+)\)$/.exec(v);
    if (m) return `${k}: tokenAlpha(t.${m[1]}, ${m[2]})`;
    return `${k}: ${JSON.stringify(v)}`;
  });
  return `{ ${entries.join(', ')} }`;
}

const cases = table.map((site) => {
  const { before, after, bloom22 } = sides(site);
  const props = propsCode(site.props) + extraProps(site);
  const kids = children(site);
  const cls = JSON.stringify(site.className);
  const styleProp = STYLE_OF[site.attr];
  const open = (tag: string, attr: string, own = props) =>
    kids ? `<${tag}${own}${attr}>${kids}</${tag}>` : `<${tag}${own}${attr} />`;
  const afterProps = site.after
    ? propsCode({ ...site.props, ...site.after.props }) + extraProps(site)
    : props;
  return `  {
    name: ${JSON.stringify(`${site.file}:${site.line}`)},
    bloom22: ${bloom22},
    before: () => ${open(before, ` ${site.attr}=${cls}`)},
    after: () => <Styled render={(t, md) => ${open(after, ` ${styleProp}={${site.styleExpr ?? styleCode(site.style)}}`, afterProps)}} />,
  },`;
});

const header = `// @ts-nocheck GENERATED by parity/sdk/corpus.ts from an SDK's conversion table.
import * as RN from 'react-native';
import { tokenAlpha, useColorTokens } from '@oxy.so/bloom/theme';
import { useWindowBreakpoint } from '@oxy.so/bloom/hooks';
${[...imports]
  .map(([key, id]) => {
    const [name, from] = key.split('|');
    return `import { ${name} as ${id} } from '${from}';`;
  })
  .join('\n')}

const ITEMS = [
  { id: 'a', title: 'Ana' },
  { id: 'b', title: 'Rui' },
];

/**
 * The after side reads the tokens of the theme it is drawn in, as the SDK's createTokenStyles does,
 * and whether the window is at Bloom's md breakpoint, as a responsive SDK view does.
 */
function Styled({ render }) {
  const tier = useWindowBreakpoint();
  return render(useColorTokens(), tier !== 'base' && tier !== 'sm');
}

export const CASES = [
${cases.join('\n')}
];
`;

async function main() {
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'corpus.generated.tsx'), header);
  // The app's stylesheet: Bloom's entry over the SDK's classes and Bloom 22's own (its lib is an app's @source).
  const bloom22 = dirname(createRequire(__filename).resolve('bloom-22/package.json'));
  const classes = new Set([
    ...table.flatMap((s) => s.className.split(/\s+/).filter(Boolean)),
    ...packageCandidates(join(bloom22, 'lib/module')),
  ]);
  const from = join(out, 'global.css');
  const css = (await tailwind(BLOOM_BASELINE_CSS, from)).build([...classes]);
  writeFileSync(join(out, 'app.generated.css'), css);
  console.log(`${cases.length} cases → ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
