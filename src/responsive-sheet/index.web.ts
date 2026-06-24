// Web variant of the `./responsive-sheet` barrel.
//
// The default barrel (`./index.ts`) re-exports from `./ResponsiveSheet`, which
// is itself the reanimated-free web/CSS implementation — Metro additionally
// resolves `./ResponsiveSheet.native` for native targets. Web bundlers select
// THIS file via the `"browser"` export condition in `package.json`'s
// `exports['./responsive-sheet']`, pointing them explicitly at the CSS
// implementation so a non-Metro bundler never follows the `.native` sibling
// (which statically imports `react-native-reanimated`, a native-only module).
// Types are platform-agnostic, so they come straight from `./types`.
export { ResponsiveSheet, RESPONSIVE_SHEET_BACKDROP_TESTID } from './ResponsiveSheet';
export type {
  ResponsiveSheetProps,
  ResponsiveSheetSide,
  ResponsiveSheetInset,
} from './types';
