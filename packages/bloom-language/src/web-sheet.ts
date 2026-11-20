import { Platform } from 'react-native';

import { WEB_SHEET } from './generated/web-sheet.generated';

/**
 * Puts the language's generated stylesheet on the page, once per document.
 *
 * The sheet is built at build time from the spec (every class a token can
 * select), so nothing is compiled or inserted per style at runtime. It is a
 * constructed stylesheet, as Bloom's own web forks inject theirs: CSP's
 * `style-src` does not apply to CSSOM, and an adopted sheet orders AFTER every
 * sheet in the document, react-native-web's included, so a language class
 * wins over react-native-web's base `View`/`Text` reset at equal specificity.
 * (A host never mixes the two for one property: styleq keeps one class per
 * property.) Bloom's `adoptStyleSheet` is not a public subpath, so this is the
 * same mechanism, kept to what this one static sheet needs.
 */
const adopted = new WeakSet<Document>();

export function adoptLanguageSheet(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || adopted.has(document)) return;
  adopted.add(document);
  if (
    'adoptedStyleSheets' in document &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  ) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(WEB_SHEET);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    return;
  }
  // No constructed stylesheets (jsdom, old browsers): a style element, as Bloom falls back.
  const element = document.createElement('style');
  element.id = 'bloom-language';
  element.textContent = WEB_SHEET;
  document.head?.appendChild(element);
}
