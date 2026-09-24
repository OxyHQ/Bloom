/**
 * Bloom's base web rules: the few that hold for every family, adopted once by
 * `BloomThemeProvider`.
 *
 * - **A control is not text.** React Native never makes text selectable unless
 *   asked (`selectable`); react-native-web renders every `Text` selectable, so
 *   on web a drag across the sidebar, a press on a menu item or a double-click
 *   on a tab painted a text selection over the interface. Controls take no
 *   selection, as a browser's own `<button>` does, whatever family drew them
 *   and however their labels are nested. Links are left alone on purpose: they
 *   sit inside prose, and a selection across a paragraph must include them.
 */
export const BASE_WEB_CSS_ID = 'bloom-base';

export const BASE_WEB_CSS = `
button,
[role="button"],
[role="tab"],
[role="menuitem"],
[role="menuitemradio"],
[role="menuitemcheckbox"],
[role="option"],
[role="radio"],
[role="checkbox"],
[role="switch"] {
  -webkit-user-select: none;
  user-select: none;
}
`;
