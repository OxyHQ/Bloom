/**
 * @jest-environment node
 */

/**
 * Every stateful role in the source, enumerated — so a component that renders
 * one and does not spell its state the way react-native-web reads, or gives it
 * no NAME to announce that state against, FAILS by default.
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
 *   - The NAME is not that rule. `accessibilityLabel` reaches BOTH platforms:
 *     react-native-web's `createDOMProps` emits `aria-label` from it when no
 *     `aria-label` is given, and React Native reads it directly. So one spelling
 *     is enough here, and it is the one this library already uses in 43 places.
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
 * Roles that must carry a NAME, and where the name is allowed to come from.
 *
 * The state rules above and this one are the same defect one step apart: a
 * control that announces "switch, on" and never says WHICH setting is as
 * unusable as one that announces "switch" and never says whether it is on. The
 * state half was found and fixed; `Switch` shipped with `role="switch"`,
 * `aria-checked` and no way for a caller to name it at all — its props were
 * `value`/`onValueChange`/`disabled`/`style`/`size`/`testID` and nothing else —
 * so a consumer forked the component rather than report it.
 *
 * `fromContents: true` means ARIA computes the name from the element's own text
 * when the author gives none, so a `role="button"` wrapping a `<Text>` is named.
 * `false` is the author-only set: no amount of content names a `progressbar` or
 * a `slider`, which is why the three that render dots, a track and a step bar
 * needed props of their own.
 */
const NAME_REQUIRED_ROLES: Record<string, { fromContents: boolean }> = {
  button: { fromContents: true },
  link: { fromContents: true },
  checkbox: { fromContents: true },
  switch: { fromContents: true },
  radio: { fromContents: true },
  tab: { fromContents: true },
  option: { fromContents: true },
  menuitem: { fromContents: true },
  menuitemcheckbox: { fromContents: true },
  menuitemradio: { fromContents: true },
  progressbar: { fromContents: false },
  slider: { fromContents: false },
  adjustable: { fromContents: false },
};

/**
 * The props that give an element a name. All four reach both platforms — the
 * two `accessibility*` spellings because react-native-web falls back to them
 * when the `aria-*` one is absent, the two `aria-*` because React Native folds
 * them the other way.
 */
const NAME_PROPS = [
  'accessibilityLabel',
  'aria-label',
  'aria-labelledby',
  'accessibilityLabelledBy',
];

/**
 * Elements exempted because the CALLER's props reach them through a spread.
 *
 * A spread is not evidence of anything on its own, and treating it as such is
 * how this rule nearly shipped unable to fail: `Slider` spreads
 * `panResponder.panHandlers`, gesture callbacks with no name among them, and
 * would have been excused by a rule that reads `{...anything}` as "the caller
 * can name it". So the exemption is a written decision per element, not an
 * inference — `PressableScale` earns it because its props type extends
 * `PressableProps` and it forwards `rest` whole, which is a claim about that
 * file that somebody has to make.
 */
const NAMED_BY_SPREAD = ['pressable-scale/PressableScale.tsx <AnimatedPressable role="button">'];

/**
 * Elements named by their own CONTENTS, listed exactly, for the same reason.
 *
 * Each renders text inside the role — a toast action renders its label, an
 * accordion trigger its heading — so ARIA computes a name with no prop. The set
 * is an equality because the branch is the weak one: an element that stops
 * rendering text silently keeps passing under it otherwise, which is how
 * `ToastCloseButton` (a lone glyph, `role="button"`, no name) survived beside
 * the action button it sits next to.
 */
const NAMED_BY_CONTENTS = [
  'accordion/Accordion.tsx <Pressable role="button">',
  'toast/ToastContent.tsx <Pressable role="button">',
];

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

/**
 * The same equality for the NAME rule, which covers a wider role set and so
 * reaches one more component. `card/Card.tsx` forwards both `accessibilityRole`
 * and `accessibilityLabel` to its `StyledPressable`, where the rules below
 * apply — but only on the pressable branch; the plain-`View` branch forwards
 * the label and drops the role, which is correct, because a card with no
 * `onPress` is not a link. `link-preview` is its one role-passing caller and it
 * always passes `onPress`.
 */
const NAME_DELEGATING_TAGS = ['Card', 'Item', 'MenuRowShell'];

/**
 * `const X = Animated.createAnimatedComponent(<host>)`, collected from the
 * source rather than listed.
 *
 * These wrappers pass every prop but `style` straight to the primitive they
 * wrap, so the rules apply to them exactly as to the bare name — but they are
 * named per file (`AnimatedPressable` four times over) and a hand-kept list
 * would drift. Deriving them closes a hole in the STATE rules too: an
 * `<AnimatedPressable role="checkbox">` was previously read as some component
 * with a prop contract of its own, and skipped.
 */
function animatedHostAliases(): Set<string> {
  const aliases = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const sf = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    // Where each imported identifier in THIS file comes from. Matching on the
    // wrapped name alone would be the same mistake as deriving a map from
    // names: `media-flight` wraps `Image` from `expo-image`, which
    // shares a name with the react-native primitive and shares none of its
    // props.
    const origin = new Map<string, string>();
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
      const from = stmt.moduleSpecifier.text;
      const bindings = stmt.importClause?.namedBindings;
      if (bindings === undefined || !ts.isNamedImports(bindings)) continue;
      for (const el of bindings.elements) origin.set(el.name.getText(sf), from);
    }
    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer !== undefined &&
        ts.isCallExpression(node.initializer) &&
        node.initializer.expression.getText(sf) === 'Animated.createAnimatedComponent' &&
        node.initializer.arguments.length === 1
      ) {
        const [argument] = node.initializer.arguments;
        const wrapped = argument === undefined ? '' : argument.getText(sf);
        const from = origin.get(wrapped);
        const isRnPrimitive =
          RN_HOSTS.has(wrapped) &&
          (from === 'react-native' || from?.endsWith('styles/styled-primitives') === true);
        if (isRnPrimitive) aliases.add(node.name.getText(sf));
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return aliases;
}

const ANIMATED_HOSTS = animatedHostAliases();

const isDom = (tag: string): boolean => /^[a-z]/.test(tag);
const isHost = (tag: string): boolean =>
  isDom(tag) ||
  RN_HOSTS.has(tag) ||
  RN_HOSTS.has(tag.replace(/^Animated\./, '')) ||
  ANIMATED_HOSTS.has(tag);

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
  /** `{...rest}` anywhere in the attribute list. */
  spread: boolean;
  /** Whether ARIA could compute a name from what this element renders. */
  textChildren: boolean;
}

/**
 * Whether an element's own subtree could produce an accessible name.
 *
 * Three things count, and the third is deliberately generous: a `<Text>`-ish
 * host element, literal JSX text, and any `{expression}` child — which is a
 * value the scan cannot evaluate and is usually the caller's `children`. Being
 * generous here is the safe direction, because everything it lets through is
 * pinned by the `NAMED_BY_CONTENTS` equality below. Being strict would fail
 * elements that are genuinely named.
 *
 * It walks CHILDREN and never attributes, and that distinction is the whole
 * function. A `ts.forEachChild` recursion reaches an element's props too, so
 * `<TimesIcon fill={color} />` — one glyph and no text anywhere — read as
 * text-bearing on the strength of `{color}`, and the toast close button this
 * rule was written to catch survived its own mutation test.
 */
function hasTextChildren(sf: ts.SourceFile, opening: ts.Node): boolean {
  const parent = opening.parent;
  if (!ts.isJsxElement(parent)) return false;
  const isTextTag = (tag: string): boolean => {
    const bare = tag.replace(/^Animated\./, '');
    return /(^|\.)(Text|StyledText)$/.test(bare) || bare.startsWith('Typography');
  };
  const scan = (children: readonly ts.JsxChild[]): boolean =>
    children.some((child) => {
      if (ts.isJsxText(child)) return child.getText(sf).trim() !== '';
      if (ts.isJsxExpression(child)) return child.expression !== undefined;
      if (ts.isJsxSelfClosingElement(child)) return isTextTag(child.tagName.getText(sf));
      if (ts.isJsxElement(child)) {
        return isTextTag(child.openingElement.tagName.getText(sf)) || scan(child.children);
      }
      if (ts.isJsxFragment(child)) return scan(child.children);
      return false;
    });
  return scan(parent.children);
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
        let spread = false;
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) {
            spread = true;
            continue;
          }
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
          spread,
          textChildren: hasTextChildren(sf, node),
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
    // Every rule must have a live subject or it is guarding nothing.
    //
    // `slider` was the one exception for as long as it was purely the web
    // spelling react-native-web PRODUCES from `adjustable`. It is not any more:
    // `level-picker/LevelPicker.web.tsx` renders a RAW `<div role="slider">`,
    // because a DOM element gets no `accessibilityRole` translation — and that
    // is exactly the element these rules have to reach, since nothing else
    // gives it a value or a name.
    expect(missing).toEqual([]);
  });

  it('resolves the animated host aliases it treats as primitives', () => {
    // A regex that stopped matching would silently reclassify every animated
    // control as an opaque component and skip it, which reads as "no
    // violations". The exact set is asserted: these are the wrappers whose
    // props reach a react-native primitive untouched.
    expect([...ANIMATED_HOSTS].sort()).toEqual([
      'AnimatedPanel',
      'AnimatedPressable',
      'AnimatedStyledView',
    ]);
  });

  it('finds the native-only state props it exists to pair', () => {
    const withNativeOnly = ALL.filter((e) =>
      NATIVE_ONLY_STATE.some((p) => e.props.has(p)),
    );
    expect(withNativeOnly.length).toBeGreaterThan(5);
  });

  it('finds the name props, the spreads and the text children the name rule reads', () => {
    // Three positive controls, one per branch of the name rule. A branch whose
    // detector silently matched nothing would exempt everything it was meant to
    // scrutinise, and "no violations" is what that prints.
    expect(ALL.filter((e) => NAME_PROPS.some((p) => e.props.has(p))).length).toBeGreaterThan(30);
    expect(ALL.filter((e) => e.spread).length).toBeGreaterThan(20);
    expect(ALL.filter((e) => e.textChildren).length).toBeGreaterThan(100);
    // And a negative control on the last one, which is the generous branch: a
    // detector returning true for everything would also print no violations.
    expect(ALL.filter((e) => !e.textChildren).length).toBeGreaterThan(100);
  });

  it('finds at least one element for every role the name rule covers', () => {
    const seen = new Set(ALL.map((e) => e.role).filter((r): r is string => r !== undefined));
    const missing = Object.keys(NAME_REQUIRED_ROLES).filter((role) => !seen.has(role));
    // `slider` is present now that a raw-DOM fork writes it (see above). The two
    // menu-item checkbox/radio spellings are ARIA's and Bloom uses the plain
    // `checkbox`/`radio` roles inside its menus, so they are covered but unused
    // — kept because a role list derived from what happens to be present today
    // is a rule that cannot fail tomorrow.
    expect(missing).toEqual(['menuitemcheckbox', 'menuitemradio']);
  });
});

describe('a role a user interacts with has a NAME', () => {
  const named = ALL.filter(
    (el) => el.role !== undefined && NAME_REQUIRED_ROLES[el.role] !== undefined && isHost(el.tag),
  );
  const id = (el: Element): string => `${el.file} <${el.tag} role="${el.role}">`;
  const namesFromContents = (el: Element): boolean =>
    NAME_REQUIRED_ROLES[el.role ?? '']?.fromContents === true;

  /** Elements with no name prop of their own, by the branch that excuses them. */
  const unlabelled = named.filter((el) => !NAME_PROPS.some((p) => el.props.has(p)));

  it('every interactive role can be named', () => {
    // The `Switch` defect: `role="switch"` + `aria-checked` + no name, on a
    // control that renders a track and a thumb and therefore no text. A screen
    // reader announced "switch, off" for every toggle in every app.
    const violations = unlabelled
      .filter(
        (el) =>
          !NAMED_BY_SPREAD.includes(id(el)) &&
          !(namesFromContents(el) && el.textChildren),
      )
      .map((el) => `${el.file}:${el.line} <${el.tag} role="${el.role}"> has no accessible name`);
    expect(violations).toEqual([]);
  });

  it('every spread exemption still names a real, still-unlabelled element', () => {
    // An exemption list only ever grows unless a stale entry fails. Each one
    // has to match an element that is present, carries the role, and still has
    // no name prop — the moment it gains one the entry is wrong and goes.
    const stillNeeded = NAMED_BY_SPREAD.filter((entry) =>
      unlabelled.some((el) => id(el) === entry && el.spread),
    );
    expect(stillNeeded).toEqual(NAMED_BY_SPREAD);
  });

  it('the elements relying on their contents for their name are exactly the listed ones', () => {
    // Unlike a spread, contents ARE evidence the scan can read, so this set is
    // derived and pinned rather than declared. It is the weak branch: an
    // element that stops rendering text drops out and the equality says so.
    const viaContents = [
      ...new Set(
        unlabelled
          .filter(
            (el) =>
              !NAMED_BY_SPREAD.includes(id(el)) &&
              namesFromContents(el) && el.textChildren,
          )
          .map(id),
      ),
    ].sort();
    expect(viaContents).toEqual(NAMED_BY_CONTENTS);
  });

  it('the only components handed a name-requiring role are the ones that answer it', () => {
    // Same equality as the state rule below, over the wider role set: being in
    // neither list FAILS, so handing `role="option"` to a component that drops
    // it cannot pass by not being scanned.
    const delegated = [
      ...new Set(
        ALL.filter(
          (el) =>
            el.role !== undefined &&
            NAME_REQUIRED_ROLES[el.role] !== undefined &&
            !isHost(el.tag),
        ).map((el) => el.tag),
      ),
    ].sort();
    expect(delegated).toEqual(NAME_DELEGATING_TAGS);
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
