// Web variant of the `./responsive-sheet` barrel.
//
// `ResponsiveSheet` is now a deprecated thin wrapper over `<Dialog>`. The
// default barrel (`./index.ts`) imports the default `Dialog`; THIS web barrel
// re-exports from `./ResponsiveSheet.web`, which imports the web `Dialog`
// explicitly so a non-Metro bundler never follows the native (reanimated)
// `Dialog` sibling. Web bundlers select this file via the `"browser"` export
// condition in `package.json`'s `exports['./responsive-sheet']`.
export { ResponsiveSheet, RESPONSIVE_SHEET_BACKDROP_TESTID } from './ResponsiveSheet.web';
export type {
  ResponsiveSheetProps,
  ResponsiveSheetSide,
  ResponsiveSheetInset,
} from './types';
