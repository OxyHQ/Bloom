import { Platform } from 'react-native';
import { adoptStyleSheet } from '@oxy.so/bloom/styles';

import { BREAKPOINT, VARIANT_SELECTORS } from './generated/spec.generated';
import { WEB_SHEET } from './generated/web-sheet.generated';
import { LIVE_ORDER, termsOf, type LiveCondition, type LiveTerm } from './variants';

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

/** A variant class's suffix: its condition, terms joined by `-` (`md-hovered`). */
export function variantSuffix(condition: LiveCondition): string {
  return condition.replaceAll('+', '-');
}

/** Two states of one view are one anchor with both pseudo-classes (`.blsg:hover:active &`). */
const STATE_SELECTOR = /^\.blsg(:[\w-]+) &, \.blsg\1&$/;

/**
 * The selector of a condition's terms that are no breakpoint (`&` standing for
 * the class it styles): the scheme's on the document around the states' anchor,
 * the states one anchor, the view's own box.
 */
function termsSelector(terms: readonly LiveTerm[]): string {
  const states = terms.filter((term) => term !== 'dark' && !(term in BREAKPOINT));
  let selector = '&';
  if (states.length === 1)
    selector = VARIANT_SELECTORS[states[0] as keyof typeof VARIANT_SELECTORS];
  else if (states.length > 1) {
    const pseudo = states.map((state) => {
      const found = STATE_SELECTOR.exec(VARIANT_SELECTORS[state as keyof typeof VARIANT_SELECTORS]);
      if (found === null)
        throw new Error(`[Bloom language] ${state}: not an anchor state selector`);
      return found[1];
    });
    selector = `.blsg${pseudo.join('')} &, .blsg${pseudo.join('')}&`;
  }
  if (!terms.includes('dark')) return selector;
  // Each part of the scheme's selector around each part of the states'.
  return VARIANT_SELECTORS.dark
    .split(', ')
    .flatMap((outer) => selector.split(', ').map((inner) => outer.replace('&', inner)))
    .join(', ');
}

/**
 * A variant sheet: every class of the generated sheet again under one live
 * condition, as `<class>-<condition>`: a breakpoint is a min-width media query,
 * the scheme and the states the spec's selectors (`.dark &`, `.blsg:hover &`…).
 * A condition that joins several (a variant inside a variant) is all of them:
 * the widest breakpoint's query around the other terms' selector. Composed from
 * the generated sheet the first time a variant of that condition renders.
 */
export function variantSheet(condition: LiveCondition): string {
  // A rule is `.<class><rest>{…}`: `rest` is what follows the class in its
  // selector (`>*` for what a `pointerEvents` rule reaches), kept after it.
  const rules = WEB_SHEET.split('\n').map((rule) => {
    const open = rule.indexOf('{');
    const selector = rule.slice(1, open);
    const end = /^[\w-]+/.exec(selector)?.[0].length ?? selector.length;
    return [selector.slice(0, end), selector.slice(end), rule.slice(open)] as const;
  });
  const terms = termsOf(condition);
  const suffix = variantSuffix(condition);
  const selector = termsSelector(terms);
  const body = rules
    .map(
      ([name, rest, declarations]) =>
        `${selector.replaceAll('&', `.${name}-${suffix}${rest}`)}${declarations}`,
    )
    .join('\n');
  const widths = terms
    .map((term) => (BREAKPOINT as Record<string, number | undefined>)[term])
    .filter((width) => width !== undefined);
  return widths.length === 0
    ? body
    : `@media (min-width: ${Math.max(...widths)}px){${body.replaceAll('\n', '')}}`;
}

const composed = new Map<LiveCondition, string>();

/**
 * Adopts the variant sheets after the language's own: one per live condition,
 * placed in the order they override (`LIVE_ORDER`, then each condition that
 * joins several, in the order they first render) and empty until a variant of
 * that condition renders, so a page pays only for the conditions it uses.
 *
 * Order and specificity do the overriding: a breakpoint's rule has the base
 * rule's specificity and comes after it (a wider breakpoint after a narrower);
 * the scheme's selector is one class stronger, a state's two (a press after a
 * hover), and a joined condition's at least its strongest term's. Within each
 * sheet, rules keep react-native-web's precedence.
 */
export function adoptLanguageVariants(condition: LiveCondition): void {
  if (Platform.OS !== 'web') return;
  adoptLanguageSheet();
  if (!composed.has(condition)) composed.set(condition, variantSheet(condition));
  for (const live of LIVE_ORDER)
    adoptStyleSheet(`bloom-language-${live}`, composed.get(live) ?? '');
  for (const [joined, css] of composed)
    if (joined.includes('+')) adoptStyleSheet(`bloom-language-${variantSuffix(joined)}`, css);
}
