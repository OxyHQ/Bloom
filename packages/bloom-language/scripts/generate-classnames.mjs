#!/usr/bin/env node
/**
 * The className table: every Tailwind/NativeWind utility the Oxy apps write
 * (`codemod/classname-usage.json`, from `scan-classnames.mjs`), resolved to the
 * language modifier and token it becomes, or flagged.
 *
 * A utility resolves through Bloom's own vocabulary: its Tailwind preset (the
 * spacing, radius and type roles of `src/design-tokens/tokens.json`, the
 * colour roles of `color-roles.ts` and `component-roles.ts`), Tailwind's
 * default scales for the rest, and the language spec's rungs. A value lands on
 * a token only when a rung has exactly that value; anything else is flagged
 * with the raw value, never kept as an arbitrary number.
 *
 * Writes:
 * - `codemod/classnames.generated.json`: the table the app codemods read;
 * - `docs/bloom-language-classnames.mdx`: the table, for people;
 * - the summary between the `GENERATED:classnames` markers of `docs/bloom-language.mdx`.
 *
 * `--check` writes nothing and fails when an output is stale.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const bloom = join(pkg, '../..');
const check = process.argv.includes('--check');

const spec = JSON.parse(readFileSync(join(pkg, 'spec/language.json'), 'utf8'));
const usage = JSON.parse(readFileSync(join(pkg, 'codemod/classname-usage.json'), 'utf8'));
const designTokens = JSON.parse(readFileSync(join(bloom, 'src/design-tokens/tokens.json'), 'utf8'));
const read = (path) => readFileSync(join(bloom, path), 'utf8');

const { scales } = spec;
const colors = Object.fromEntries(Object.entries(spec.colors).filter(([k]) => k !== '$comment'));
const ramp = Object.fromEntries(Object.entries(spec.typeRamp).filter(([k]) => k !== '$comment'));

// ── Bloom's vocabulary ───────────────────────────────────────────

const px = (text) => Number(String(text).replace(/px$/, ''));
const presetSpace = Object.fromEntries(
  Object.entries(designTokens.spacing)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [k, px(v.$value)]),
);
const presetRadius = Object.fromEntries(
  Object.entries(designTokens.radius)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [k, px(v.$value)]),
);
const presetType = Object.fromEntries(
  Object.entries(designTokens.typography)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [
      k,
      {
        size: px(v.fontSize.$value),
        lineHeight: px(v.lineHeight.$value),
        weight: String(v.fontWeight.$value),
      },
    ]),
);
const firstPreset = Object.keys(designTokens.color).find((k) => !k.startsWith('$'));
const themeVariables = new Set(Object.keys(designTokens.color[firstPreset].light));

/** Bloom's colour utilities: `name: ref('token')` and `'name': 'var(--token)'`. */
const colorUtilities = {};
for (const file of ['src/design-tokens/color-roles.ts', 'src/design-tokens/component-roles.ts']) {
  for (const match of read(file).matchAll(
    /^\s*'?([\w-]+)'?:\s*(?:ref\('([\w-]+)'\)|'var\(--([\w-]+)\)')/gm,
  ))
    colorUtilities[match[1]] = match[2] ?? match[3];
}

/** The language's colour role for a theme variable. */
const roleByVariable = Object.fromEntries(
  Object.entries(colors).map(([role, [, css]]) => [css, role]),
);

const rung = (table, value) =>
  Object.entries(table).find(([, v]) => typeof v === 'number' && Math.abs(v - value) < 1e-9)?.[0];

// Tailwind's own defaults, for the utilities the preset does not redefine.
const TW_TEXT = {
  xs: [12, 16],
  sm: [14, 20],
  base: [16, 24],
  lg: [18, 28],
  xl: [20, 28],
  '2xl': [24, 32],
  '3xl': [30, 36],
  '4xl': [36, 40],
  '5xl': [48, 48],
  '6xl': [60, 60],
};
const TW_RADIUS = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 };
const TW_LEADING = { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 };
const TW_WEIGHT = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};
const TW_TRACKING = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
};
const TW_PALETTE =
  /^(white|black|transparent|current|inherit|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})$/;

/** A spacing value in px: Tailwind's 4px steps, Bloom's `space-N`, or a bracketed `[Npx]`. */
function spaceValue(text) {
  if (text === 'px') return 1;
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text) * 4;
  if (presetSpace[text] !== undefined) return presetSpace[text];
  const arbitrary = /^\[(-?\d+(?:\.\d+)?)px\]$/.exec(text);
  return arbitrary ? Number(arbitrary[1]) : undefined;
}

// ── Resolution ───────────────────────────────────────────────────

const mapped = (language) => ({ status: 'mapped', language });
const token = (scale, value, language) => ({ status: 'token', scale, value, language });
const modifier = (language) => ({ status: 'modifier', language });
const structure = (language) => ({ status: 'structure', language });
const drop = (language) => ({ status: 'drop', language });

/** A space utility to `make(token)`, or the raw value it needs a token for. */
function space(text, make, negative = false) {
  const value = spaceValue(text);
  if (value === undefined) return undefined;
  if (value === 0) return mapped(make("'none'"));
  const name = rung(scales.space, value);
  if (name) return mapped(make(`'${negative ? '-' : ''}${name}'`));
  return token('space', `${value}px`, make('…'));
}

const EDGE = {
  '': 'all',
  x: 'horizontal',
  y: 'vertical',
  t: 'top',
  b: 'bottom',
  s: 'leading',
  e: 'trailing',
  l: 'leading',
  r: 'trailing',
};

/** A colour utility's theme variable, or why it has none. */
function colorVariable(name) {
  const [base, alpha] = name.split('/');
  const variable = colorUtilities[base] ?? (themeVariables.has(base) ? base : undefined);
  return { base, alpha, variable };
}

function color(name, make) {
  const { base, alpha, variable } = colorVariable(name);
  if (TW_PALETTE.test(base)) return token('color', base, make('…'));
  if (variable === undefined) return undefined;
  const role = roleByVariable[variable];
  if (alpha !== undefined)
    return token('opacity', `--${variable} at ${alpha}%`, role ? make(`'${role}'`) : make('…'));
  return role ? mapped(make(`'${role}'`)) : token('color', `--${variable}`, make('…'));
}

function fontSize(name) {
  if (ramp[name]) {
    const [, family, weight] = /^(.*)-(regular|medium|semibold|bold)$/.exec(name);
    return mapped(`.font('${family}').weight('${weight}')`);
  }
  const preset = presetType[name];
  const pair = preset ? [preset.size, preset.lineHeight] : TW_TEXT[name];
  const arbitrary = /^\[(\d+(?:\.\d+)?)px\]$/.exec(name);
  if (!pair && !arbitrary) return undefined;
  const [size, lineHeight] = pair ?? [Number(arbitrary[1]), undefined];
  // A ramp step is a size and a line height together; a size alone is a size rung.
  const step =
    lineHeight === undefined
      ? undefined
      : Object.entries(ramp).find(
          ([variant, [s, l]]) => variant.endsWith('-regular') && s === size && l === lineHeight,
        );
  if (step) return mapped(`.font('${step[0].replace(/-regular$/, '')}')`);
  const sizeRung = rung(scales.fontSize, size);
  if (sizeRung && lineHeight === undefined) return mapped(`.font('${sizeRung}')`);
  return token(
    'font',
    lineHeight === undefined ? `${size}px` : `${size}px / ${lineHeight}px`,
    sizeRung ? `.font('${sizeRung}') (line height ${lineHeight}px has no rung)` : '.font(…)',
  );
}

function corner(name) {
  const value =
    name === '' ? TW_RADIUS[''] : (presetRadius[name] ?? TW_RADIUS[name] ?? spaceValue(name));
  if (value === undefined) return undefined;
  if (value >= 9999) return mapped(".corner('full')");
  const name2 = rung(scales.corner, value);
  return name2 ? mapped(`.corner('${name2}')`) : token('corner', `${value}px`, '.corner(…)');
}

const ALIGN = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
};
const TEXT_ALIGN = {
  left: 'start',
  start: 'start',
  center: 'center',
  right: 'end',
  end: 'end',
  justify: 'justify',
};
const FRAME = {
  w: 'width',
  h: 'height',
  'min-w': 'minWidth',
  'min-h': 'minHeight',
  'max-w': 'maxWidth',
  'max-h': 'maxHeight',
};

function resolve(utility) {
  let m;
  // Layout: stacks and placement.
  if (utility === 'flex-row') return structure('HStack(…)');
  if (utility === 'flex-col') return structure('VStack(…)');
  if (utility === 'flex' || utility === 'inline-flex')
    return structure('a stack (HStack or VStack)');
  if (utility === 'flex-1' || utility === 'grow' || utility === 'flex-grow')
    return mapped('.grow()');
  if (utility === 'shrink-0' || utility === 'flex-shrink-0') return mapped(".shrink('never')");
  if (utility === 'shrink' || utility === 'flex-shrink') return mapped(".shrink('normal')");
  if ((m = /^items-(start|center|end|stretch|baseline)$/.exec(utility)))
    return mapped(`.align('${ALIGN[m[1]]}')`);
  if (utility === 'justify-between') return mapped(".spacing('between')");
  if (/^(justify|self|content|place)-/.test(utility) || utility === 'flex-wrap')
    return modifier('a stack’s distribution (justify, self, wrap)');
  if (
    utility === 'absolute' ||
    utility === 'relative' ||
    /^-?(inset|top|bottom|left|right|start|end)-/.test(utility)
  ) {
    if (utility === 'inset-0') return structure('Fill(…) (with `absolute`), or ZStack(…)');
    if (utility === 'relative') return drop('ZStack(…) is the positioned parent');
    return modifier('position (absolute placement beyond Fill and ZStack)');
  }
  if (utility === 'hidden') return structure('a conditional child (`show && view`)');
  if (
    utility === 'block' ||
    utility === 'inline-block' ||
    utility === 'inline' ||
    utility === 'contents'
  )
    return drop('display: views are boxes');
  if ((m = /^aspect-(square|video)$/.exec(utility)))
    return structure(`AspectRatio(${m[1] === 'square' ? '1' : '16 / 9'}, …)`);
  if (/^grid-cols-|^grid$|^col-|^row-|^grid-/.test(utility)) return structure('Grid(…).columns(n)');
  // Spacing.
  if ((m = /^(-?)(p|m)([xytbserl]?)-(.+)$/.exec(utility))) {
    const [, negative, kind, edge, value] = m;
    if (value === 'auto') return modifier('centring (`mx-auto`): a frame and an alignment');
    // A margin is padding outside the view's fill (SwiftUI has no margin); a negative one pulls outward.
    return space(
      value,
      (t) => `.padding('${EDGE[edge]}', ${t})${kind === 'm' ? ' (outside the fill)' : ''}`,
      negative === '-',
    );
  }
  if ((m = /^(gap|space-[xy])-(.+)$/.exec(utility))) return space(m[2], (t) => `.spacing(${t})`);
  if ((m = /^gap-[xy]-(.+)$/.exec(utility))) return modifier('one spacing per axis (gap-x, gap-y)');
  // Frames.
  if ((m = /^(w|h|min-w|min-h|max-w|max-h|size)-(.+)$/.exec(utility))) {
    const [, kind, value] = m;
    if (
      ['full', 'screen', 'auto', 'fit', 'min', 'max', 'dvh', 'svh'].includes(value) ||
      value.includes('/')
    )
      return modifier(
        `a relative size (${utility}): \`grow\` and \`align('stretch')\` cover the full ones`,
      );
    const keys = kind === 'size' ? ['width', 'height'] : [FRAME[kind]];
    const out = space(value, (t) => `.frame({ ${keys.map((k) => `${k}: ${t}`).join(', ')} })`);
    if (out) return out;
    const container = {
      xs: 320,
      sm: 384,
      md: 448,
      lg: 512,
      xl: 576,
      '2xl': 672,
      '3xl': 768,
      '4xl': 896,
      '5xl': 1024,
      '6xl': 1152,
      '7xl': 1280,
    }[value];
    if (container) return token('space', `${container}px`, `.frame({ ${keys[0]}: … })`);
    return undefined;
  }
  // Type.
  if ((m = /^text-(left|center|right|justify|start|end)$/.exec(utility)))
    return mapped(`.textAlign('${TEXT_ALIGN[m[1]]}')`);
  if (/^text-(wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(utility))
    return utility === 'text-nowrap'
      ? mapped('.noWrap()')
      : modifier('text wrapping (balance, pretty)');
  if ((m = /^text-(.+)$/.exec(utility)))
    return fontSize(m[1]) ?? color(m[1], (r) => `.foreground(${r})`) ?? undefined;
  if (
    (m = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.exec(utility))
  ) {
    const weight = rung(
      Object.fromEntries(Object.entries(scales.weight).map(([k, v]) => [k, Number(v)])),
      Number(TW_WEIGHT[m[1]]),
    );
    return weight ? mapped(`.weight('${weight}')`) : token('weight', TW_WEIGHT[m[1]], '.weight(…)');
  }
  if (utility === 'font-mono') return modifier('Bloom’s monospaced family');
  if (/^font-/.test(utility)) {
    const role = presetType[utility.slice(5)];
    if (role) return fontSize(utility.slice(5));
    return drop('the family is Bloom’s: Text takes it from its font');
  }
  if ((m = /^leading-(.+)$/.exec(utility))) {
    const ratio = TW_LEADING[m[1]];
    if (ratio === undefined) {
      const value = spaceValue(m[1]);
      return value === undefined ? undefined : token('leading', `${value}px`, '.leading(…)');
    }
    const name = rung(scales.leading, ratio);
    return name ? mapped(`.leading('${name}')`) : token('leading', `${ratio}`, '.leading(…)');
  }
  if ((m = /^tracking-(.+)$/.exec(utility))) {
    const value = TW_TRACKING[m[1]];
    const raw = value === undefined ? m[1].replace(/^\[(.*)\]$/, '$1') : `${value}em`;
    return token('tracking', raw, 'a tracking modifier');
  }
  if (['uppercase', 'lowercase', 'capitalize'].includes(utility))
    return mapped(`.textCase('${utility}')`);
  if (utility === 'italic') return mapped('.italic()');
  if (utility === 'underline') return mapped('.underline()');
  if (utility === 'line-through') return mapped('.strikethrough()');
  if (utility === 'truncate') return mapped('.lines(1)');
  if ((m = /^line-clamp-(\d+)$/.exec(utility))) return mapped(`.lines(${m[1]})`);
  if (utility === 'whitespace-nowrap') return mapped('.noWrap()');
  if (utility === 'select-none') return mapped('.selectable(false)');
  if (utility === 'select-text' || utility === 'select-all') return mapped('.selectable()');
  // Fills, borders, corners, opacity.
  if ((m = /^bg-(.+)$/.exec(utility))) return color(m[1], (r) => `.background(${r})`);
  if ((m = /^rounded(?:-(t|b|l|r|s|e|tl|tr|bl|br))?(?:-(.+))?$/.exec(utility))) {
    if (m[1]) return modifier('a corner per side');
    return corner(m[2] ?? '');
  }
  if ((m = /^border(?:-([xytbserl]))?(?:-(\d+|hairline))?$/.exec(utility))) {
    const edge = {
      '': 'all',
      t: 'top',
      b: 'bottom',
      s: 'leading',
      l: 'leading',
      e: 'trailing',
      r: 'trailing',
    }[m[1] ?? ''];
    if (edge === undefined) return modifier('a border on two sides');
    const width = m[2] ?? '1';
    if (width === '0') return drop('no border is the default');
    const name = width === 'hairline' ? 'hairline' : rung(scales.borderWidth, Number(width));
    const call = `.border(role, ${name ? `'${name}'` : '…'}${edge === 'all' ? '' : `, '${edge}'`})`;
    return name ? mapped(call) : token('borderWidth', `${width}px`, call);
  }
  if ((m = /^border-(.+)$/.exec(utility))) return color(m[1], (r) => `.border(${r})`);
  if ((m = /^opacity-(\d+)$/.exec(utility))) {
    const value = Number(m[1]) / 100;
    const name = rung(scales.opacity, value);
    return name ? mapped(`.opacity('${name}')`) : token('opacity', `${value}`, '.opacity(…)');
  }
  if (utility === 'overflow-hidden')
    return mapped('.corner(…) clips; alone it needs a clip modifier');
  if (/^overflow-/.test(utility)) return structure('a ScrollView (Embed) for scrolling');
  // What the language says by other means, or does not say.
  if (utility === 'cursor-pointer') return drop('a pressable view takes the pointer');
  if (utility === 'group') return mapped('.hoverGroup()');
  if (/^(shadow|ring|outline|elevation)(-|$)/.test(utility))
    return modifier('an elevation or focus ring');
  if (/^(transition|duration|ease|delay|animate)(-|$)/.test(utility))
    return modifier('motion (the motion runtime)');
  if (
    /^(z|pointer-events|isolate|sr-only|not-sr-only|tabular-nums|object|fill|stroke|blur|backdrop|scale|rotate|translate|-translate|origin|transform|will-change|appearance|resize|list|divide|break|hyphens|indent|align|order|basis|columns|box)(-|$)/.test(
      utility,
    )
  )
    return modifier(`\`${utility.split('-').filter(Boolean)[0]}\` (no modifier)`);
  return undefined;
}

// ── The table ────────────────────────────────────────────────────

const rows = [];
for (const [utility, { count, apps }] of Object.entries(usage.utilities)) {
  const result = resolve(utility) ?? {
    status: 'app',
    language: 'not a Bloom or Tailwind utility (an app’s own class)',
  };
  rows.push({ utility, count, apps: apps.length, ...result });
}

const STATUS = {
  mapped: 'Maps to a modifier and a token',
  structure: 'Expressed by the view’s structure',
  drop: 'Redundant in the language',
  token: 'Needs a named token (raw value)',
  modifier: 'Needs a modifier the language lacks',
  app: 'An app’s own class',
};
const totals = Object.fromEntries(Object.keys(STATUS).map((s) => [s, { utilities: 0, uses: 0 }]));
for (const row of rows) {
  totals[row.status].utilities++;
  totals[row.status].uses += row.count;
}
const allUses = rows.reduce((n, row) => n + row.count, 0);
const pct = (n) => `${((100 * n) / allUses).toFixed(1)}%`;

const HEADER = 'GENERATED by packages/bloom-language/scripts/generate-classnames.mjs. Do not edit.';
const json = `${JSON.stringify(
  {
    $comment: HEADER,
    utilities: Object.fromEntries(rows.map(({ utility, ...row }) => [utility, row])),
  },
  null,
  1,
)}\n`;

const cell = (text) => String(text).replace(/\|/g, '\\|');
const table = (list, columns) =>
  [
    `| ${columns.map(([title]) => title).join(' | ')} |`,
    `| ${columns.map(([, , align]) => (align === 'right' ? '---:' : '---')).join(' | ')} |`,
    ...list.map((row) => `| ${columns.map(([, get]) => cell(get(row))).join(' | ')} |`),
  ].join('\n');
const appsLine = Object.entries(usage.apps)
  .map(([name, { commit }]) => `${name} \`${commit}\``)
  .join(', ');
const COMMON = 2; // utilities written in at least this many apps get a row; the JSON has every one.
const byStatus = (status) => rows.filter((row) => row.status === status && row.apps >= COMMON);

const summaryTable = table(
  Object.entries(STATUS).map(([status, title]) => ({ status, title, ...totals[status] })),
  [
    ['', (r) => r.title],
    ['Utilities', (r) => r.utilities, 'right'],
    ['Uses', (r) => r.uses, 'right'],
    ['Share of uses', (r) => pct(r.uses), 'right'],
  ],
);

const tokenGroups = {};
for (const row of rows.filter((r) => r.status === 'token')) {
  const group = (tokenGroups[row.scale] ??= { values: new Map(), uses: 0 });
  group.uses += row.count;
  group.values.set(row.value, (group.values.get(row.value) ?? 0) + row.count);
}
const tokenTable = table(
  Object.entries(tokenGroups)
    .sort((a, b) => b[1].uses - a[1].uses)
    .map(([scale, group]) => ({
      scale,
      uses: group.uses,
      values: [...group.values]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([value, n]) => `${value} (${n})`)
        .join(', '),
    })),
  [
    ['Scale', (r) => r.scale],
    ['Uses', (r) => r.uses, 'right'],
    ['Raw values with no rung (uses)', (r) => r.values],
  ],
);

const columns = [
  ['Utility', (r) => `\`${r.utility}\``],
  ['Language', (r) => r.language],
  ['Uses', (r) => r.count, 'right'],
  ['Apps', (r) => r.apps, 'right'],
];
const tokenColumns = [
  ['Utility', (r) => `\`${r.utility}\``],
  ['Raw value', (r) => r.value],
  ['Becomes', (r) => r.language],
  ['Uses', (r) => r.count, 'right'],
  ['Apps', (r) => r.apps, 'right'],
];

const variantLine = Object.entries(usage.variants)
  .slice(0, 16)
  .map(([variant, n]) => `\`${variant}:\` ${n}`)
  .join(', ');

const page = `---
title: Bloom language and className
description: Every Tailwind/NativeWind utility the Oxy apps write, as the language modifier and token it becomes, or flagged. Generated; it drives the app codemods.
---

{/* ${HEADER} */}

# Bloom language and className

The language replaces NativeWind's \`className\`. This table is every utility
the apps write (variant prefixes such as \`md:\` and \`dark:\` stripped), at each
app's default branch, resolved through Bloom's own vocabulary: its Tailwind
preset (spacing, radius, type roles and colour roles) and Tailwind's default
scales for the rest. A value becomes a token only when a language rung has
exactly that value; any other is flagged with its raw value, never kept as a
number. \`codemod/classnames.generated.json\` holds every row, for the codemods;
this page shows the utilities written in ${COMMON} apps or more.

Sources: \`scripts/scan-classnames.mjs\` (read-only, \`git grep\` at each
default branch) wrote \`codemod/classname-usage.json\` from ${Object.keys(usage.apps).length} apps:
${appsLine}. \`scripts/generate-classnames.mjs\` writes this page.

## Summary

${summaryTable}

${allUses} uses of ${rows.length} utilities. Variant prefixes (the language has
none yet: a breakpoint, a state or a scheme is a decision per family): ${variantLine}.

## Raw values that need a token

${tokenTable}

## Maps to a modifier and a token

${table(byStatus('mapped'), columns)}

## Expressed by the view's structure

${table(byStatus('structure'), columns)}

## Redundant in the language

${table(byStatus('drop'), columns)}

## Needs a named token

${table(byStatus('token'), tokenColumns)}

## Needs a modifier the language lacks

${table(byStatus('modifier'), columns)}

## An app's own class

${table(byStatus('app').slice(0, 60), columns)}
`;

const docPath = join(bloom, 'docs/bloom-language.mdx');
const doc = readFileSync(docPath, 'utf8');
const START = '{/* GENERATED:classnames — scripts/generate-classnames.mjs */}';
const END = '{/* /GENERATED:classnames */}';
const summary = `${START}

${summaryTable}

${allUses} uses of ${rows.length} utilities across ${Object.keys(usage.apps).length} apps. The values
with no rung, by scale (the owner names each as a token or keeps it out):

${tokenTable}

${END}`;
const startAt = doc.indexOf(START);
const endAt = doc.indexOf(END);
if (startAt < 0 || endAt < 0) throw new Error(`docs/bloom-language.mdx has no ${START} … ${END}`);
const nextDoc = doc.slice(0, startAt) + summary + doc.slice(endAt + END.length);

const outputs = [
  [join(pkg, 'codemod/classnames.generated.json'), json],
  [join(bloom, 'docs/bloom-language-classnames.mdx'), page],
  [docPath, nextDoc],
];
let stale = 0;
for (const [path, text] of outputs) {
  if (check) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {}
    if (current !== text) {
      console.error(`stale: ${path} (run: node scripts/generate-classnames.mjs)`);
      stale++;
    }
  } else writeFileSync(path, text);
}
if (stale) process.exit(1);
console.log(
  check
    ? 'className table is current'
    : `className table: ${rows.length} utilities, ${Object.entries(totals)
        .map(([s, t]) => `${s} ${t.utilities}`)
        .join(', ')}`,
);
