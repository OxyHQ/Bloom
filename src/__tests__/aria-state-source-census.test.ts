/**
 * @jest-environment node
 */

/**
 * Every stateful role in the source, enumerated — so a component that renders
 * one and does not spell its state the way react-native-web reads FAILS by
 * default.
 *
 * `aria-state-web.test.tsx` is the runtime half and it is the right shape: it
 * reads emitted ATTRIBUTES through the real react-native-web. What it cannot do
 * is notice a component that is not in it. It imports its subjects BY NAME, so
 * joining it is an act somebody has to remember, and the record of what happens
 * when nobody does is `slider` (fixed) beside `stat-bar`, `dot-grid-meter` and
 * `dialog/DialogHeader` (three `role="progressbar"` announcing no value, for as
 * long as they had existed). A hand-maintained list of subjects is the same
 * defect as a hand-maintained allow-list: what is missing from it is skipped,
 * and skipping is indistinguishable from passing.
 *
 * So this scans the SOURCE instead. Each rule below states, for one role, which
 * `aria-*` prop ARIA defines the state as — and the census fails on any element
 * carrying the role without it. The two halves are complementary and neither
 * subsumes the other: a source scan cannot see what react-native-web does with a
 * prop, and a runtime suite cannot see a component nobody wired into it.
 *
 * The cross-platform contract (verified against both runtimes in node_modules,
 * and restated at the top of the runtime suite):
 *   - react-native-web's `createDOMProps` reads `aria-*` and never
 *     `accessibilityState` / `accessibilityValue`.
 *   - React Native folds `aria-busy|checked|disabled|expanded|selected` and
 *     `aria-value{min,max,now,text}` back into those objects.
 *   - EXCEPT `aria-pressed`, which React Native has no concept of, so a
 *     `role="button"` toggle sets BOTH spellings.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

/**
 * The state each role carries, as ARIA defines it. A role appears here only if
 * its state is a property of the ELEMENT rather than of a wrapper — which is why
 * `button` is absent: a plain button has no state, and the toggle case is
 * `aria-pressed`, asserted separately below because it needs both spellings.
 */
const REQUIRED_BY_ROLE: Record<string, readonly string[]> = {
  checkbox: ['aria-checked'],
  switch: ['aria-checked'],
  radio: ['aria-checked'],
  tab: ['aria-selected'],
  option: ['aria-selected'],
  progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  // react-native-web maps `accessibilityRole="adjustable"` to `role="slider"`,
  // so the two spellings are one rule.
  slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  adjustable: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
};

/**
 * Props that reach NATIVE ONLY. Setting one is not wrong — native needs it — but
 * it is never sufficient, so an element carrying one of these and no `aria-*`
 * counterpart is exactly the defect this file exists for.
 */
const NATIVE_ONLY_STATE = ['accessibilityState', 'accessibilityValue'];

/**
 * The react-native primitives whose props land on a real host element. The rules
 * are about what a platform DOES with a prop, so they apply to these and to raw
 * DOM tags, and not to a Bloom component with a prop contract of its own.
 */
const RN_HOSTS = new Set([
  'View',
  'Text',
  'Pressable',
  'ScrollView',
  'FlatList',
  'TextInput',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Image',
  'ImageBackground',
  'Modal',
  'ActivityIndicator',
  // `styles/styled-primitives.ts`'s four wrappers. They are the SAME primitives
  // with `className` mapped onto `style` — every other prop is spread straight
  // through to the host element — so the rules below apply to them exactly as
  // they apply to the bare names above. Listing them here rather than in
  // `DELEGATING_TAGS` is the honest classification: a delegating tag answers a
  // role in its own file, and these answer nothing, they forward.
  'StyledView',
  'StyledText',
  'StyledPressable',
  'StyledImage',
]);

/**
 * Components that take a `role` prop and answer it THEMSELVES — the role reaches
 * a host element inside their own file, where the rules below already apply.
 *
 * An EQUALITY, not an allow-list floor: a new component that starts accepting a
 * stateful role has to be added here deliberately, and adding it is a claim that
 * its own file translates the role. `item/Item.tsx` does (`role === 'option'` →
 * `aria-selected`, a `button` toggle → `aria-pressed`, `menuitem`/`listitem` →
 * neither) and `floating/shared.tsx`'s `MenuRowShell` does (`checkbox`/`radio` →
 * `aria-checked`, `menuitem` → no checked state and `accessibilityRole="button"`,
 * plus `aria-expanded` for a sub-trigger). The runtime suite pins every one of
 * those cases against the real DOM.
 */
const DELEGATING_TAGS = ['Item', 'MenuRowShell'];

const isDom = (tag: string): boolean => /^[a-z]/.test(tag);
const isHost = (tag: string): boolean =>
  isDom(tag) || RN_HOSTS.has(tag) || RN_HOSTS.has(tag.replace(/^Animated\./, ''));

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...sourceFiles(full));
      continue;
    }
    if (!entry.endsWith('.tsx')) continue;
    if (entry.endsWith('.stories.tsx')) continue;
    out.push(full);
  }
  return out;
}

interface Element {
  file: string;
  line: number;
  tag: string;
  role: string | undefined;
  props: Set<string>;
}

/** Every JSX opening element in the package, with its literal prop names. */
function elements(): Element[] {
  const found: Element[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const props = new Set<string>();
        let role: string | undefined;
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) continue;
          const name = attr.name.getText(sf);
          props.add(name);
          if (name !== 'role' && name !== 'accessibilityRole') continue;
          const init = attr.initializer;
          if (init && ts.isStringLiteral(init)) role = init.text;
          // A computed role (`role={resolvedRole}`) is deliberately NOT read as
          // a role: the census would have to guess its value, and guessing is
          // how a check that cannot fail gets written. Those elements are
          // covered by the runtime suite instead — `item/Item.tsx` is the one,
          // and it has four cases there.
        }
        found.push({
          file: relative(SRC, file),
          line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
          tag: (ts.isJsxOpeningElement(node) ? node.tagName : node.tagName).getText(sf),
          role,
          props,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return found;
}

const ALL = elements();

describe('the census can see', () => {
  // Vacuity floors. "No violations" and "the walk matched nothing" print the
  // same result, so both the file set and the element set carry a floor, and the
  // roles the rules cover must each be FOUND somewhere.
  it('parses a realistic number of components and elements', () => {
    expect(sourceFiles(SRC).length).toBeGreaterThan(100);
    expect(ALL.length).toBeGreaterThan(800);
  });

  it('finds at least one element for every role it has a rule for', () => {
    const seen = new Set(ALL.map((e) => e.role).filter((r): r is string => r !== undefined));
    const missing = Object.keys(REQUIRED_BY_ROLE).filter((role) => !seen.has(role));
    // `slider` is the web spelling react-native-web PRODUCES rather than one
    // Bloom writes, so it is legitimately absent from the source; every other
    // rule must have a live subject or the rule is guarding nothing.
    expect(missing).toEqual(['slider']);
  });

  it('finds the native-only state props it exists to pair', () => {
    const withNativeOnly = ALL.filter((e) =>
      NATIVE_ONLY_STATE.some((p) => e.props.has(p)),
    );
    expect(withNativeOnly.length).toBeGreaterThan(5);
  });
});

describe('a stateful role spells its state the way web reads it', () => {
  const stateful = ALL.filter(
    (el) => el.role !== undefined && REQUIRED_BY_ROLE[el.role] !== undefined,
  );

  it('every literal role on a host element carries the aria state ARIA defines for it', () => {
    const violations: string[] = [];
    for (const el of stateful) {
      if (!isHost(el.tag)) continue;
      const required = REQUIRED_BY_ROLE[el.role as string] ?? [];
      const missing = required.filter((prop) => !el.props.has(prop));
      if (missing.length > 0) {
        violations.push(
          `${el.file}:${el.line} <${el.tag} role="${el.role}"> lacks ${missing.join(', ')}`,
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it('the only components handed a stateful role are the ones that answer it', () => {
    // Being in neither list FAILS. Without this, handing a stateful role to a
    // component that ignores it would simply not be scanned — the shape of a
    // gate that cannot fail.
    const delegated = [
      ...new Set(stateful.filter((el) => !isHost(el.tag)).map((el) => el.tag)),
    ].sort();
    expect(delegated).toEqual(DELEGATING_TAGS);
  });

  it('no element states a value for native only', () => {
    // `accessibilityValue` reaches native alone. An element setting it without
    // the flat props announces its role and nothing else on web — the exact
    // shape `slider`, `stat-bar`, `dot-grid-meter` and `DialogHeader` shipped.
    const violations = ALL.filter(
      (el) => el.props.has('accessibilityValue') && !el.props.has('aria-valuenow'),
    ).map((el) => `${el.file}:${el.line} <${el.tag}>`);
    expect(violations).toEqual([]);
  });

  it('a cross-platform toggle setting aria-pressed also sets accessibilityState', () => {
    // The one place two spellings are REQUIRED rather than redundant: React
    // Native has no `aria-pressed` and react-native-web ignores
    // `accessibilityState`. Missing either half is silent on one platform.
    //
    // A `.web.tsx` fork is exempt because it reaches only one platform — its raw
    // `<button>` has no native side to serve, and `accessibilityState` there
    // would be a prop nothing reads. Its native counterpart is scanned by the
    // same rule in the unforked file.
    const violations = ALL.filter(
      (el) =>
        !el.file.includes('.web.') &&
        el.props.has('aria-pressed') &&
        !el.props.has('accessibilityState'),
    ).map((el) => `${el.file}:${el.line} <${el.tag}> sets aria-pressed without accessibilityState`);
    expect(violations).toEqual([]);
  });
});
