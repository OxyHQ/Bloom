import { Platform } from 'react-native';
import { adoptStyleSheet } from '@oxy.so/bloom/styles';

import { BREAKPOINT, VARIANT_SELECTORS } from './generated/spec.generated';
import { WEB_SHEET } from './generated/web-sheet.generated';
import { LIVE_ORDER, type LiveCondition } from './variants';

/**
 * Puts the language's generated stylesheet on the page, through Bloom's
 * `adoptStyleSheet`, as Bloom's own web forks inject theirs.
 *
 * The sheet is built at build time from the spec (every class a token can
 * select), so nothing is compiled or inserted per style at runtime. It is a
 * constructed stylesheet: CSP's `style-src` does not apply to CSSOM, and an
 * adopted sheet orders AFTER every sheet in the document, react-native-web's
 * included, so a language class wins over react-native-web's base `View`/`Text`
 * reset at equal specificity. (A host never mixes the two for one property:
 * styleq keeps one class per property.) A repeat call parses and adopts nothing.
 */
export function adoptLanguageSheet(): void {
  if (Platform.OS === 'web') adoptStyleSheet('bloom-language', WEB_SHEET);
}

/** One rule of the generated sheet: its place in react-native-web's order, what follows the class in its selector, its declarations. */
type GeneratedRule = readonly [index: number, rest: string, declarations: string];

/**
 * The generated sheet's rules by class. A rule is `.<class><rest>{…}`: `rest`
 * is what follows the class in its selector (`>*` for what a `pointerEvents`
 * rule reaches), kept after it; a class can have more than one.
 */
let generated: ReadonlyMap<string, readonly GeneratedRule[]> | undefined;
function generatedRules(): ReadonlyMap<string, readonly GeneratedRule[]> {
  if (generated === undefined) {
    const rules = new Map<string, GeneratedRule[]>();
    WEB_SHEET.split('\n').forEach((rule, index) => {
      const open = rule.indexOf('{');
      const selector = rule.slice(1, open);
      const end = /^[\w-]+/.exec(selector)?.[0].length ?? selector.length;
      const name = selector.slice(0, end);
      const list = rules.get(name) ?? [];
      list.push([index, selector.slice(end), rule.slice(open)]);
      rules.set(name, list);
    });
    generated = rules;
  }
  return generated;
}

/**
 * A variant sheet: the rules of the generated classes `names` again under one
 * live condition, as `<class>-<condition>`, in the generated sheet's order. A
 * breakpoint is a min-width media query, the scheme and the states the spec's
 * selectors (`.dark &`, the nearest anchor's state).
 */
export function variantSheet(condition: LiveCondition, names: Iterable<string>): string {
  const rules = generatedRules();
  const ordered = [...new Set(names)]
    .flatMap((name) => (rules.get(name) ?? []).map((rule) => [name, rule] as const))
    .sort((a, b) => a[1][0] - b[1][0]);
  if (ordered.length === 0) return '';
  const width = (BREAKPOINT as Record<string, number | undefined>)[condition];
  if (width !== undefined) {
    const body = ordered.map(
      ([name, [, rest, declarations]]) => `.${name}-${condition}${rest}${declarations}`,
    );
    return `@media (min-width: ${width}px){${body.join('')}}`;
  }
  const selector = VARIANT_SELECTORS[condition as keyof typeof VARIANT_SELECTORS];
  return ordered
    .map(
      ([name, [, rest, declarations]]) =>
        `${selector.replaceAll('&', `.${name}-${condition}${rest}`)}${declarations}`,
    )
    .join('\n');
}

/** The classes each live condition has drawn, and its sheet's text. */
const drawn = new Map<LiveCondition, { names: Set<string>; css: string }>();

/**
 * Puts the rules of classes `names` under `condition` on the page: one
 * constructed sheet per live condition, holding exactly the variant classes
 * that have rendered, so a page parses only the variants it draws. A class is
 * added the first time a style naming it is resolved (styles are cached by
 * key, so once), and the condition's sheet is rewritten in the generated
 * sheet's order.
 *
 * The sheets sit after the language's own, in the order conditions override
 * (`LIVE_ORDER`), each adopted (empty until it draws) on the first variant.
 * Order and specificity do the overriding: a breakpoint's rule has the base
 * rule's specificity and comes after it (a wider breakpoint after a narrower);
 * the scheme's selector is one class stronger, a state's two (a press after a
 * hover). Within each sheet, rules keep react-native-web's precedence.
 */
export function adoptVariantClasses(condition: LiveCondition, names: readonly string[]): void {
  if (Platform.OS !== 'web') return;
  adoptLanguageSheet();
  let entry = drawn.get(condition);
  if (entry === undefined) {
    entry = { names: new Set(), css: '' };
    drawn.set(condition, entry);
  }
  const size = entry.names.size;
  for (const name of names) entry.names.add(name);
  if (entry.names.size !== size) entry.css = variantSheet(condition, entry.names);
  for (const live of LIVE_ORDER)
    adoptStyleSheet(`bloom-language-${live}`, drawn.get(live)?.css ?? '');
}
