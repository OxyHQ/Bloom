import { Platform } from 'react-native';
import { adoptStyleSheet } from '@oxy.so/bloom/styles';

import { BREAKPOINT, VARIANT_SELECTORS } from './generated/spec.generated';
import { WEB_SHEET } from './generated/web-sheet.generated';
import { LIVE_ORDER } from './variants';

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
 * The variant sheet: every class of the generated sheet again, once per live
 * condition, as `<class>-<condition>` under that condition's CSS: a breakpoint
 * is a min-width media query, the scheme and the states the spec's selectors
 * (`.dark &`, `.blsg:hover &`…). Composed from the generated sheet once per
 * document, the first time a variant renders, and adopted after it.
 *
 * Order and specificity do the overriding: a breakpoint's rule has the base
 * rule's specificity and comes after it (a wider breakpoint after a narrower);
 * the scheme's selector is one class stronger, a state's two (a press after a
 * hover). Within each condition, rules keep react-native-web's precedence.
 */
export function variantSheet(): string {
  const rules = WEB_SHEET.split('\n').map((rule) => {
    const open = rule.indexOf('{');
    return [rule.slice(1, open), rule.slice(open)] as const;
  });
  const blocks: string[] = [];
  for (const condition of LIVE_ORDER) {
    const width = (BREAKPOINT as Record<string, number | undefined>)[condition];
    if (width !== undefined) {
      const body = rules.map(([name, declarations]) => `.${name}-${condition}${declarations}`);
      blocks.push(`@media (min-width: ${width}px){${body.join('')}}`);
      continue;
    }
    const selector = VARIANT_SELECTORS[condition as keyof typeof VARIANT_SELECTORS];
    for (const [name, declarations] of rules) {
      blocks.push(`${selector.replaceAll('&', `.${name}-${condition}`)}${declarations}`);
    }
  }
  return blocks.join('\n');
}

let variants: string | undefined;

/** Adopts the variant sheet, once per document, after the language's own. */
export function adoptLanguageVariants(): void {
  if (Platform.OS !== 'web') return;
  adoptLanguageSheet();
  variants ??= variantSheet();
  adoptStyleSheet('bloom-language-variants', variants);
}
