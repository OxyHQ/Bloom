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

/**
 * A variant sheet: every class of the generated sheet again under one live
 * condition, as `<class>-<condition>`: a breakpoint is a min-width media query,
 * the scheme and the states the spec's selectors (`.dark &`, `.blsg:hover &`…).
 * Composed from the generated sheet the first time a variant of that condition
 * renders.
 */
export function variantSheet(condition: LiveCondition): string {
  const rules = WEB_SHEET.split('\n').map((rule) => {
    const open = rule.indexOf('{');
    return [rule.slice(1, open), rule.slice(open)] as const;
  });
  const width = (BREAKPOINT as Record<string, number | undefined>)[condition];
  if (width !== undefined) {
    const body = rules.map(([name, declarations]) => `.${name}-${condition}${declarations}`);
    return `@media (min-width: ${width}px){${body.join('')}}`;
  }
  const selector = VARIANT_SELECTORS[condition as keyof typeof VARIANT_SELECTORS];
  return rules
    .map(
      ([name, declarations]) =>
        `${selector.replaceAll('&', `.${name}-${condition}`)}${declarations}`,
    )
    .join('\n');
}

const composed = new Map<LiveCondition, string>();

/**
 * Adopts the variant sheets after the language's own: one per live condition,
 * placed in the order they override (`LIVE_ORDER`) and empty until a variant of
 * that condition renders, so a page pays only for the conditions it uses.
 *
 * Order and specificity do the overriding: a breakpoint's rule has the base
 * rule's specificity and comes after it (a wider breakpoint after a narrower);
 * the scheme's selector is one class stronger, a state's two (a press after a
 * hover). Within each sheet, rules keep react-native-web's precedence.
 */
export function adoptLanguageVariants(condition: LiveCondition): void {
  if (Platform.OS !== 'web') return;
  adoptLanguageSheet();
  if (!composed.has(condition)) composed.set(condition, variantSheet(condition));
  for (const live of LIVE_ORDER)
    adoptStyleSheet(`bloom-language-${live}`, composed.get(live) ?? '');
}
