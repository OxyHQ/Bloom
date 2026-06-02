// Web variant of the `./dialog` barrel.
//
// The default barrel (`./index.ts`) re-exports from `./Dialog`, which uses
// bloom's `BottomSheet` (a native-only primitive built on
// react-native-gesture-handler + reanimated). The web fork (`./Dialog.web`)
// is a pure-DOM modal overlay that renders into the bloom Portal.
//
// Web bundlers select this file via the `"browser"` export condition in
// `package.json`'s `exports['./dialog']`; native bundlers fall through to
// the React Native build above.
export { Dialog, BLOOM_DIALOG_CSS } from './Dialog.web';
export {
  CenteredDialog,
  BLOOM_CENTERED_DIALOG_CSS,
  CENTERED_DIALOG_BACKDROP_TESTID,
} from './CenteredDialog.web';
export { BloomDialogProvider } from './BloomDialogProvider.web';
export { alert } from './alert';
export { useDialogContext, useDialogControl } from './context';
export type {
  AlertButton,
  AlertButtonStyle,
} from './alert-store';
export type {
  DialogAction,
  DialogActionColor,
  DialogContextProps,
  DialogControlProps,
  DialogProps,
} from './types';
export type { CenteredDialogProps } from './centered-dialog-types';
