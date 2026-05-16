// Web variant of the `./dialog` barrel.
//
// The default barrel (`./index.ts`) re-exports from `./Dialog`, which on
// native uses `react-native-safe-area-context` and pulls in
// `@gorhom/bottom-sheet` via `lazyRequire`. The web fork (`./Dialog.web`)
// is a pure-DOM modal overlay that depends only on `react-remove-scroll-bar`
// and the in-package `Portal`.
//
// Web bundlers select this file via the `"browser"` condition in
// `package.json`'s `exports['./dialog']`; native bundlers fall through to
// the React Native build.
export { Outer, Inner, ScrollableInner, Handle, Close, Backdrop } from './Dialog.web';
export { useDialogContext, useDialogControl } from './context';
export type { DialogControlProps, DialogOuterProps, DialogInnerProps, DialogContextProps } from './types';
