import { Platform } from 'react-native';
import { adoptStyleSheet } from '@oxy.so/bloom/styles';

import { WEB_SHEET } from './generated/web-sheet.generated';

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
