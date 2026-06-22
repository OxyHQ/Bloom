// Web variant of the `./fab` barrel.
//
// The default barrel (`./index.ts`) re-exports the React Native (`Pressable`)
// implementation, whose `placement` anchoring uses `position: absolute` within
// the nearest positioned ancestor. The web fork (`./Fab.web`) renders a real
// HTML `<button>` and uses `position: sticky` for its anchored placements so
// the FAB tracks the bottom-right of its CONTAINING content column while
// scrolling — never the viewport edge (the bug that motivated moving the FAB
// into Bloom). Web bundlers select this file via the `"browser"` export
// condition in `package.json`'s `exports['./fab']`.
export { Fab } from './Fab.web';
export type { FabProps, FabVariant, FabSize, FabPlacement } from './types';
