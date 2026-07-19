// Web variant of the `./frosted-icon-button` barrel.
//
// The default barrel (`./index.ts`) re-exports the React Native implementation,
// which frosts via `expo-blur`'s `BlurView`. The web fork (`./FrostedIconButton.web`)
// renders a real HTML `<button>` and frosts via a real CSS `backdrop-filter` —
// no `expo-blur` import ever reaches a web bundler. Web bundlers select this
// file via the `"browser"` export condition in `package.json`.
export { FrostedIconButton } from './FrostedIconButton.web';
export type { FrostedIconButtonProps, FrostedIconButtonSize } from './types';
