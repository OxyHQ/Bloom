/**
 * The ADOPTION MATRIX: every published family, against every composition
 * contract that applies to it.
 *
 * ## Why it is derived and not written
 *
 * A matrix maintained by hand answers the question "what did someone last write
 * down", and it is wrong the first time a family changes without its row being
 * updated — silently, because a stale row reads exactly like a fresh one. Every
 * fact here is read out of the source instead:
 *
 *   - the published surface, from `package.json#exports` and the root barrel
 *   - the platform split, from the presence of an `index.web.ts`
 *   - docs, stories and suites, from the files that exist and what they import
 *   - which contracts a family READS, from its import graph
 *   - which contracts APPLY to it, from what it renders
 *
 * The output is `docs/adoption-matrix.mdx`, asserted byte-identical by
 * `src/__tests__/adoption-matrix.test.ts` — the same arrangement as
 * `design-tokens/tokens.json`. Regenerate with:
 *
 *     bun run generate:adoption-matrix
 *
 * ## APPLICABILITY IS THE HARD PART, and it is derived from what a family RENDERS
 *
 * "Does the field contract apply to `Search`?" cannot be answered by its name.
 * `Search` renders no control of its own — it composes `TextFieldInput`, which
 * reads the contract — so it is not a subject at all, and "fixing" it would mean
 * giving it a second implementation of what it already gets from the primitive:
 * the duplication #148 asks to detect, arrived at by trying to be thorough.
 *
 * So a contract applies to a family when that family writes the node the
 * contract governs — a raw `<TextInput`, a `role="radiogroup"` of its own, a
 * size prop whose vocabulary IS the density pair, its own `asChild`, its own
 * `default*`/controlled prop pair. An earlier version of this file resolved
 * conformance transitively instead ("it imports something that reads it"), and
 * that was worse than no answer: nearly every family reaches `text-field`
 * eventually, so 17 families rendering raw inputs came out green.
 *
 * ## Every applicable family that does NOT read the contract is classified HERE
 *
 * With a verdict and a reason, in {@link CLASSIFICATION}, and the gate asserts
 * that map's keys EQUAL the derived set — so a new one cannot be quiet (it
 * renders as `unclassified` and fails), and a stale one cannot linger either.
 * Three verdicts, because "not read" is three different situations:
 *
 *   `delegated`       it passes the decision to a child that reads the contract
 *   `does-not-apply`  the derivation matched something that is not the contract's
 *                     subject after reading the code — a menu row, a scrubber
 *   `adaptation`      a real remaining gap, named rather than hidden
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * The repo root, found by walking UP from the working directory.
 *
 * Not `import.meta.url`: this module is imported by a jest suite as well as by
 * the generator, and ts-jest compiles to CommonJS, where `import.meta` is a
 * syntax error. Not `__dirname` either, for the mirror reason under bun. Walking
 * up for Bloom's own `package.json` works under both and fails loudly rather
 * than deriving a plausible wrong root.
 */
function findRepoRoot(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string };
      if (pkg.name === '@oxy.so/bloom') return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "adoption-matrix: could not find Bloom's package.json above the working directory — run this from inside the repo.",
  );
}

export const REPO_ROOT = findRepoRoot();
const SRC = join(REPO_ROOT, 'src');
const DOCS = join(REPO_ROOT, 'docs');

export const MATRIX_PATH = join(DOCS, 'adoption-matrix.mdx');

// ---------------------------------------------------------------------------
//  The tree
// ---------------------------------------------------------------------------

function directories(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.') && statSync(join(dir, name)).isDirectory())
    .sort();
}

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, match, out);
    else if (match.test(name)) out.push(full);
  }
  return out;
}

const families = (): string[] => directories(SRC).filter((name) => name !== '__tests__');

/** Every source file of a family, minus its stories and its own tests. */
function sourceFiles(family: string): string[] {
  return walk(join(SRC, family), /\.(ts|tsx)$/).filter(
    (file) => !/\.(stories|test|spec)\.tsx?$/.test(file),
  );
}

const readAll = (files: string[]): string =>
  files
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
    // Comments are prose, and prose NAMES contracts it does not use — the
    // derivation would read every doc comment mentioning `TextInput` as a
    // control being rendered.
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

// ---------------------------------------------------------------------------
//  The published surface
// ---------------------------------------------------------------------------

interface Pkg {
  exports: Record<string, Record<string, unknown> | string>;
}

function subpaths(): Map<string, string> {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as Pkg;
  const out = new Map<string, string>();
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    if (typeof entry === 'string') continue;
    const rn = entry['react-native'];
    const source = typeof rn === 'object' && rn !== null ? (rn as { default?: unknown }).default : rn;
    if (typeof source !== 'string') continue;
    const rel = source.replace(/^\.\/src\//, '');
    if (!rel.includes('/')) continue;
    const family = rel.slice(0, rel.indexOf('/'));
    // A family with several subpaths (`icons`, `theme`) is listed at its own.
    if (!out.has(family) || subpath.length < out.get(family)!.length) out.set(family, subpath);
  }
  return out;
}

function rootBarrelFamilies(): Set<string> {
  const barrel = readAll([join(SRC, 'index.ts')]);
  const out = new Set<string>();
  for (const match of barrel.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)) {
    const first = match[1]?.split('/')[0];
    if (first !== undefined) out.add(first);
  }
  return out;
}

// ---------------------------------------------------------------------------
//  Docs, stories, suites
// ---------------------------------------------------------------------------

/**
 * A family documented under a name a reader would actually look for. The same
 * aliases `family-coverage.test.ts` holds, kept here rather than imported
 * because that file is a jest suite.
 */
const DOC_ALIASES: Readonly<Record<string, string>> = {
  surfaces: 'alert',
  'control-surface': 'composition',
  field: 'field',
};

function docStem(family: string): string | null {
  const alias = DOC_ALIASES[family];
  if (alias !== undefined && existsSync(join(DOCS, `${alias}.mdx`))) return alias;
  return existsSync(join(DOCS, `${family}.mdx`)) ? family : null;
}

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    base,
    join(base, 'index.tsx'),
    join(base, 'index.ts'),
    join(base, 'index.web.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const SPEC_RE =
  /from\s+['"](\.[^'"]+)['"]|require\(\s*['"](\.[^'"]+)['"]\s*\)|import\(\s*['"](\.[^'"]+)['"]\s*\)|jest\.mock\(\s*['"](\.[^'"]+)['"]/g;

function specifiersOf(file: string, text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(SPEC_RE)) {
    const spec = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (spec !== undefined) out.push(spec);
  }
  return out;
}

const familyOf = (file: string): string => relative(SRC, file).split('/')[0] ?? '';

/** Family → how many suites reach into it, by RESOLVING a relative import. */
function suiteCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const file of walk(SRC, /\.(test|spec)\.tsx?$/)) {
    const text = readAll([file]);
    const reached = new Set<string>();
    for (const spec of specifiersOf(file, text)) {
      const resolved = resolveLocal(file, spec);
      if (resolved === null || !resolved.startsWith(SRC)) continue;
      reached.add(familyOf(resolved));
    }
    for (const family of reached) out.set(family, (out.get(family) ?? 0) + 1);
  }
  return out;
}


// ---------------------------------------------------------------------------
//  The contracts
// ---------------------------------------------------------------------------

/**
 * What a family renders when the FIELD contract applies to it: a raw platform
 * text input, or a form role it wrote itself.
 *
 * `<TextInput` must be followed by a prop, a newline or a `/` — `useRef<TextInput
 * | null>` and `forwardRef<TextInput, P>` are TYPE references and were both
 * counted as rendered controls by the first version of this regex.
 */
const FORM_CONTROL_RE =
  /<TextInput\n|<TextInput\s+[A-Za-z{/]|accessibilityRole=(['"])(checkbox|radio|switch|adjustable)\1|\brole=(['"])(checkbox|radio|switch|slider|radiogroup|textbox|combobox|spinbutton)\3/;

/**
 * A size prop whose vocabulary IS `ControlDensity`. The union has to END there:
 * `'small' | 'medium' | 'large'` is a THREE-rung scale of a family's own, and a
 * container that set `density` could not say which of its rungs it meant.
 */
const DENSITY_PROP_RE =
  /(size|density)\??:\s*(TextFieldSize|ButtonGroupSize|TimeFieldSize|ControlDensity)\s*;|(size|density)\??:\s*'(medium|small)'\s*\|\s*'(small|medium)'\s*;/;

/** Both halves of a controlled pair, declared as props by this family. */
function declaresControlledPair(text: string): boolean {
  for (const match of text.matchAll(/\bdefault([A-Z]\w*)\?:/g)) {
    const base = match[1]![0]!.toLowerCase() + match[1]!.slice(1);
    if (base === 'props') continue;
    if (new RegExp(`\\b${base}\\?:`).test(text)) return true;
  }
  return false;
}

export interface Contract {
  key: string;
  title: string;
  source: string;
  blurb: string;
  applies: (text: string) => boolean;
  reads: (text: string) => boolean;
}

export const CONTRACTS: Contract[] = [
  {
    key: 'field',
    title: 'Field membership',
    source: 'field/context.ts, field/membership.ts',
    blurb:
      'The id, accessible name, description, error, invalid, required and disabled state of an enclosing `Field`, applied to the control. Applies to a family that renders a raw `TextInput` or writes a form role of its own',
    applies: (text) => FORM_CONTROL_RE.test(text),
    reads: (text) => /field\/(membership|context)|useFieldMembership|useFieldControl/.test(text),
  },
  {
    key: 'control-surface',
    title: 'Control presentation',
    source: 'control-surface/context.ts',
    blurb:
      'The material and density a container asks the controls inside it for. Applies to a family that PAINTS a container material, or whose size prop is the density pair `medium | small`',
    applies: (text) => DENSITY_PROP_RE.test(text),
    reads: (text) => /control-surface|useInheritedControl|useControlSurface/.test(text),
  },
  {
    key: 'trigger',
    title: 'Trigger composition',
    source: 'floating/TriggerSlot.tsx',
    blurb:
      '`asChild`, the composed press handler, the cancellable open, the refused fragment and the two-sided disabled guard. Applies to a family that declares an `asChild` prop of its own',
    applies: (text) => /asChild\??:\s*boolean/.test(text),
    reads: (text) => /TriggerSlot|cloneTrigger/.test(text),
  },
  {
    key: 'controlled-state',
    title: 'Controlled / uncontrolled state',
    source: 'hooks/use-controllable-state.ts',
    blurb:
      'One reconciliation of "controlled the moment the prop is passed", with the callback firing either way. Applies to a family that declares both halves of a pair (`value` and `defaultValue`, `open` and `defaultOpen`, …)',
    applies: declaresControlledPair,
    reads: (text) => /use-controllable-state|useControllableState/.test(text),
  },
];

// ---------------------------------------------------------------------------
//  The classification of everything the contracts apply to and that does not
//  read them. An EQUALITY, asserted in `src/__tests__/adoption-matrix.test.ts`.
// ---------------------------------------------------------------------------

export type Verdict = 'reads' | 'delegated' | 'does-not-apply' | 'adaptation' | 'unclassified';

export interface Classification {
  verdict: Exclude<Verdict, 'reads' | 'unclassified'>;
  reason: string;
}

/** One shared reason, for the families that draw a bare input ON PURPOSE. */
const BARE_INPUT =
  'renders a bare `TextInput` deliberately — a composer or a search box that draws its own chrome and is not a form field a `Field` wraps. Wiring it to `TextFieldInput` would give it the field shell it exists not to draw.';

/** One shared reason, for a selection row that is not a form control. */
const SELECTION_ROW =
  'writes a selection role on a ROW or a chip rather than on a form control — a list the user picks from, inside its own container, never inside a `Field`.';

export const CLASSIFICATION: Record<string, Record<string, Classification>> = {
  field: {
    'agent-chat': { verdict: 'does-not-apply', reason: BARE_INPUT },
    'chat-composer': { verdict: 'does-not-apply', reason: BARE_INPUT },
    'chat-list': { verdict: 'does-not-apply', reason: BARE_INPUT },
    command: { verdict: 'does-not-apply', reason: BARE_INPUT },
    'home-search': { verdict: 'does-not-apply', reason: BARE_INPUT },
    'music-library': { verdict: 'does-not-apply', reason: BARE_INPUT },
    sidebar: { verdict: 'does-not-apply', reason: BARE_INPUT },
    'chat-people': { verdict: 'does-not-apply', reason: SELECTION_ROW },
    'stay-filters': { verdict: 'does-not-apply', reason: SELECTION_ROW },
    'map-marker': { verdict: 'does-not-apply', reason: SELECTION_ROW },
    address: { verdict: 'does-not-apply', reason: SELECTION_ROW },
    'composer-panel': {
      verdict: 'does-not-apply',
      reason:
        'its pills and effort slider are a toolbar of a composer, named by the group they sit in; the panel is never a field.',
    },
    floating: {
      verdict: 'does-not-apply',
      reason:
        'a MENU row. `checkbox`/`radio` inside a menu is the menu-item semantic, and the menu owns its own name, state and keyboard model (`floating/menu-rows.tsx`).',
    },
    'media-controls': {
      verdict: 'does-not-apply',
      reason:
        'a transport SCRUBBER (`adjustable`): it is named by the track it plays and lives in a player, not in a field.',
    },
    'message-media': {
      verdict: 'does-not-apply',
      reason: 'a voice message\u2019s scrubber — same as `media-controls`.',
    },
    'theme-toggle': {
      verdict: 'does-not-apply',
      reason:
        'the switch row draws its own label ("Dark mode") as both visible text and accessible name, inside the toggle\u2019s own menu.',
    },
    questionnaire: {
      verdict: 'adaptation',
      reason:
        'a FORM whose multi-select answers are hand-written `role="checkbox"` rows instead of `Checkbox`, so a `Field` can neither name nor disable them. Not closed here: the rows carry their own card chrome and selection model, so it is a redesign of the answer control rather than an import.',
    },
    'listing-editor': {
      verdict: 'adaptation',
      reason:
        'the property-type, offering and address-precision pickers are hand-written `radiogroup`s over cards, for the same reason and with the same cost as `questionnaire`.',
    },
    'listing-actions': {
      verdict: 'adaptation',
      reason:
        'the mortgage calculator\u2019s term picker is a hand-written `radiogroup`; it sits beside `TextFieldInput`s that DO read the contract, so one form has two association models.',
    },
    'note-card': {
      verdict: 'does-not-apply',
      reason:
        'the `checkbox` role is on the CARD (bulk selection in a list) and on read-only checklist PREVIEW rows. Neither is a form control: a note card is never inside a `Field`, and the preview rows take no press at all.',
    },
    'note-editor': {
      verdict: 'does-not-apply',
      reason:
        'the raw `TextInput` is a DOCUMENT TITLE — it draws no box, no label and no hint, because the words are the document rather than a value being collected. A `Field` around it would put a form label above a heading.',
    },
    'vehicle-picker': {
      verdict: 'adaptation',
      reason:
        'a hand-written `radiogroup` over `listing-editor`\u2019s selectable cards \u2014 it REUSES that family\u2019s card rather than writing a third one, so it inherits the same gap for the same reason: a `Field` can neither name nor disable the group.',
    },
    'shipment-request': {
      verdict: 'adaptation',
      reason:
        'the load KIND is the same hand-written `radiogroup` over `listing-editor`\u2019s cards. The rest of the form is worse than that, not better: its `TextField`, `Textarea`, `Switch` and `SegmentedControl` all read the contract, so one form has two association models.',
    },
    'carrier-quote': {
      verdict: 'does-not-apply',
      reason: SELECTION_ROW,
    },
    'job-board': {
      verdict: 'does-not-apply',
      reason: SELECTION_ROW,
    },
  },
  'control-surface': {
    'place-card': {
      verdict: 'does-not-apply',
      reason:
        'its `density` is the CARD\u2019s \u2014 a result row against a detail header \u2014 not a control\u2019s size, and the only controls it draws are `Button`s, which read nothing by design (`docs/composition.mdx`).',
    },
    'note-editor': {
      verdict: 'delegated',
      reason:
        'the toolbar passes `size` straight to `ButtonGroup`, which reads the contract \u2014 so a `ControlSurface` reaches the formatting row without this family reading anything.',
    },
    'phone-input': {
      verdict: 'delegated',
      reason:
        'passes `size` straight through to `TextField`, which inherits density — so a `ControlSurface` reaches the phone field without this family reading anything.',
    },
    'chat-composer': {
      verdict: 'does-not-apply',
      reason:
        'the `small | medium` prop sizes a composer PART (an attachment row), not a control a container would set the density of.',
    },
    'chat-people': {
      verdict: 'does-not-apply',
      reason:
        'sizes an avatar row of its own, not a control: there is nothing for a container\u2019s density to mean here, and honouring it would resize a presentation block.',
    },
    'chat-screen': {
      verdict: 'does-not-apply',
      reason:
        'sizes the chat HEADER, which is chrome around the screen rather than a control a container sets the density of.',
    },
    'creator-studio': {
      verdict: 'does-not-apply',
      reason:
        'sizes a studio stat block — a presentation part, whose two sizes happen to be spelled with the same two words as the density pair.',
    },
    'media-header': {
      verdict: 'does-not-apply',
      reason:
        'sizes the media header\u2019s meta row, which is layout of a header rather than a control inside a container.',
    },
    tenancy: {
      verdict: 'does-not-apply',
      reason:
        'sizes a tenancy summary row: a presentation part, for the same reason as `creator-studio` and `chat-people`.',
    },
  },
  trigger: {
    button: {
      verdict: 'does-not-apply',
      reason:
        '`Button`\u2019s own `asChild` renders the button AS an anchor or a router `Link` — it opens nothing and merges no open handler, so it is a different feature with the same name. It FORWARDS the trigger contract\u2019s props when an anchored family clones it, which is the half that matters here.',
    },
    theme: {
      verdict: 'does-not-apply',
      reason:
        '`BloomColorScope`/`SeedScope` clone their child to merge a style instead of adding a layout node. No surface, no press, no open.',
    },
  },
  'controlled-state': {
    'map-controls': {
      verdict: 'delegated',
      reason:
        'the layer picker declares `open`/`defaultOpen` and hands both straight to `DropdownMenu`, which reconciles them with the shared hook \u2014 so a controlled caller is honoured without this family reconciling anything itself.',
    },
    textarea: {
      verdict: 'does-not-apply',
      reason:
        'the VALUE belongs to React Native\u2019s `TextInput`, which reconciles `value`/`defaultValue` itself; the only local state is the character count, which is why it is kept for the uncontrolled case alone.',
    },
    'input-otp': {
      verdict: 'adaptation',
      reason:
        'reconciles `value`/`defaultValue` by hand (`const controlled = value !== undefined`) because it also CLEANS and pads the string to `length`, which the shared hook does not do.',
    },
    'chat-list': {
      verdict: 'adaptation',
      reason:
        'the folder tabs reconcile `value`/`defaultValue` with their own `useState` seeded from the default, so a controlled caller\u2019s later change to `value` is honoured but the callback and the internal state can disagree.',
    },
    'chart-cards': {
      verdict: 'adaptation',
      reason:
        'a card\u2019s range selector reconciles `range`/`defaultRange` by hand, in three cards, each with its own copy.',
    },
    'creator-studio': {
      verdict: 'adaptation',
      reason:
        'the streams chart\u2019s metric picker keeps its own state seeded from `defaultMetric` instead of the shared hook.',
    },
    'queue-panel': {
      verdict: 'adaptation',
      reason: 'the panel\u2019s tab keeps its own state seeded from `defaultTab` instead of the shared hook.',
    },
    'track-list': {
      verdict: 'adaptation',
      reason:
        'the selection set keeps its own state seeded from `defaultSelectedIds` instead of the shared hook, which matters more here because the value is an ARRAY and identity decides whether a caller\u2019s update lands.',
    },
    questionnaire: {
      verdict: 'adaptation',
      reason:
        'the step and the answers are each reconciled by hand, which is two copies of the rule in one family.',
    },
  },
};

// ---------------------------------------------------------------------------
//  The rows
// ---------------------------------------------------------------------------

export interface FamilyRow {
  family: string;
  subpath: string | null;
  rootBarrel: boolean;
  webForked: boolean;
  doc: string | null;
  stories: boolean;
  suites: number;
  /** Contract key → verdict. `null` when the contract does not apply at all. */
  verdicts: Record<string, Verdict | null>;
}

export function matrix(): FamilyRow[] {
  const subs = subpaths();
  const barrel = rootBarrelFamilies();
  const suites = suiteCounts();
  const all = families();

  return all.map((family) => {
    const text = readAll(sourceFiles(family));
    const verdicts: Record<string, Verdict | null> = {};
    for (const contract of CONTRACTS) {
      if (contract.reads(text)) verdicts[contract.key] = 'reads';
      else if (!contract.applies(text)) verdicts[contract.key] = null;
      else verdicts[contract.key] = CLASSIFICATION[contract.key]?.[family]?.verdict ?? 'unclassified';
    }
    return {
      family,
      subpath: subs.get(family) ?? null,
      rootBarrel: barrel.has(family),
      webForked: existsSync(join(SRC, family, 'index.web.ts')),
      doc: docStem(family),
      stories: walk(join(SRC, family), /\.stories\.tsx?$/).length > 0,
      suites: suites.get(family) ?? 0,
      verdicts,
    };
  });
}

/** The families a contract APPLIES to but that do not read it — what must be classified. */
export function unread(rows: FamilyRow[], key: string): string[] {
  return rows
    .filter((row) => row.verdicts[key] !== null && row.verdicts[key] !== 'reads')
    .map((row) => row.family);
}

export function withVerdict(rows: FamilyRow[], key: string, verdict: Verdict): string[] {
  return rows.filter((row) => row.verdicts[key] === verdict).map((row) => row.family);
}

// ---------------------------------------------------------------------------
//  The document
// ---------------------------------------------------------------------------

const CELL: Record<Verdict, string> = {
  reads: 'reads',
  delegated: 'delegated',
  'does-not-apply': 'n/a¹',
  adaptation: '**adaptation**',
  unclassified: '**UNCLASSIFIED**',
};

export function renderAdoptionMatrix(): string {
  const rows = matrix();
  const published = rows.filter((row) => row.subpath !== null || row.rootBarrel);
  const out: string[] = [];

  out.push('---');
  out.push('title: Adoption matrix');
  out.push(
    'description: Every family in Bloom against every composition contract that applies to it — derived from the source, with each shortfall named and justified.',
  );
  out.push('order: 3');
  out.push('---');
  out.push('');
  out.push('{/* AUTO-GENERATED by scripts/generate-adoption-matrix.ts — do not edit. */}');
  out.push(
    '{/* `bun run generate:adoption-matrix`; asserted byte-identical by src/__tests__/adoption-matrix.test.ts. */}',
  );
  out.push('');
  out.push('# Adoption matrix');
  out.push('');
  out.push(
    'The contracts in [Composition](/docs/composition) are worth something only where they are read. This page is that measurement, and it is derived from the source on every change rather than written down once — a matrix maintained by hand is wrong the first time a family changes without its row being updated, and a stale row reads exactly like a fresh one.',
  );
  out.push('');
  out.push('## What is measured');
  out.push('');
  for (const contract of CONTRACTS) {
    out.push(`- **${contract.title}** — \`${contract.source}\`. ${contract.blurb}.`);
  }
  out.push('');
  out.push(
    'A contract that a family does not read is not automatically a failure, and this is where a matrix usually starts lying in one direction or the other. `Search` renders no control of its own — it composes `TextFieldInput` — so the field contract is not its to read. A menu row carrying `role="checkbox"` is a menu item, not a form field. Every family a contract applies to and that does not read it is therefore classified, with a reason, in `src/__tests__/support/adoption-matrix.ts`:',
  );
  out.push('');
  out.push('| verdict | means |');
  out.push('| --- | --- |');
  out.push('| `reads` | the family imports the contract and applies it itself |');
  out.push('| `delegated` | it hands the decision to a child that reads it |');
  out.push('| `n/a¹` | the derivation matched something that is not the contract\u2019s subject — the reason is below |');
  out.push('| `**adaptation**` | a real remaining gap, named rather than hidden |');
  out.push('| blank | the contract does not apply: the family renders nothing it governs |');
  out.push('');
  out.push(
    'The classification is an EQUALITY in `src/__tests__/adoption-matrix.test.ts`, not a floor: a family that starts matching a contract and is not classified renders as `**UNCLASSIFIED**` and fails the gate, and a classification whose family no longer matches fails it too.',
  );
  out.push('');

  out.push('## Totals');
  out.push('');
  out.push(
    `- **${rows.length} families** in \`src/\`, **${published.length}** published (a subpath, the root barrel, or both). **${rows.filter((r) => r.webForked).length}** carry a web fork.`,
  );
  out.push(
    `- Docs, stories and suites are gated as a standard by \`src/__tests__/family-coverage.test.ts\`; the per-family counts are in the table below.`,
  );
  out.push('');
  out.push('| contract | applies to | reads | delegated | n/a¹ | adaptation |');
  out.push('| --- | --- | --- | --- | --- | --- |');
  for (const contract of CONTRACTS) {
    const applies = rows.filter((row) => row.verdicts[contract.key] !== null).length;
    out.push(
      `| ${contract.title} | ${applies} | ${withVerdict(rows, contract.key, 'reads').length} | ${
        withVerdict(rows, contract.key, 'delegated').length
      } | ${withVerdict(rows, contract.key, 'does-not-apply').length} | ${
        withVerdict(rows, contract.key, 'adaptation').length
      } |`,
    );
  }
  out.push('');

  out.push('## What remains — the named adaptations');
  out.push('');
  const anyAdaptation = CONTRACTS.some((c) => withVerdict(rows, c.key, 'adaptation').length > 0);
  if (!anyAdaptation) out.push('None.');
  for (const contract of CONTRACTS) {
    const list = withVerdict(rows, contract.key, 'adaptation');
    if (list.length === 0) continue;
    out.push(`### ${contract.title}`);
    out.push('');
    for (const family of list) {
      out.push(`- \`${family}\` — ${CLASSIFICATION[contract.key]![family]!.reason}`);
    }
    out.push('');
  }

  out.push('## ¹ Why a match is not a subject');
  out.push('');
  for (const contract of CONTRACTS) {
    const list = [
      ...withVerdict(rows, contract.key, 'does-not-apply'),
      ...withVerdict(rows, contract.key, 'delegated'),
    ].sort();
    if (list.length === 0) continue;
    out.push(`### ${contract.title}`);
    out.push('');
    for (const family of list) {
      const entry = CLASSIFICATION[contract.key]![family]!;
      out.push(`- \`${family}\` (${entry.verdict}) — ${entry.reason}`);
    }
    out.push('');
  }

  out.push('## Every family');
  out.push('');
  const header = ['family', 'import', 'platform', 'doc', 'story', 'suites', ...CONTRACTS.map((c) => c.title)];
  out.push(`| ${header.join(' | ')} |`);
  out.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (const row of rows) {
    const importPath = row.subpath
      ? `\`@oxy.so/bloom${row.subpath.slice(1)}\`${row.rootBarrel ? ' + barrel' : ''}`
      : row.rootBarrel
        ? 'barrel only'
        : 'internal';
    const cells = CONTRACTS.map((c) => {
      const verdict = row.verdicts[c.key];
      return verdict === null || verdict === undefined ? '' : CELL[verdict];
    });
    out.push(
      `| \`${row.family}\` | ${importPath} | ${row.webForked ? 'web fork' : 'universal'} | ${
        row.doc ? `\`${row.doc}.mdx\`` : '—'
      } | ${row.stories ? 'yes' : '—'} | ${row.suites} | ${cells.join(' | ')} |`,
    );
  }
  out.push('');
  return out.join('\n');
}
