// Web variant of the `./button` barrel.
//
// The default barrel (`./index.ts`) re-exports the React Native (`Pressable`)
// implementation. Via react-native-web that renders `<button type="button">`,
// which breaks form submits, HTML5 validation, Enter-to-submit, `className`
// layout passthrough, `asChild`/links, and lacks the `outline`/`link`/
// `destructive` variants web apps use. This fork (`./Button.web`) renders a real
// HTML `<button>` with full web semantics while keeping the SAME Bloom design
// tokens, variants, and sizes so it is visually identical to the native button.
//
// Web bundlers select this file via the `"browser"` export condition in
// `package.json`'s `exports['./button']`; native bundlers fall through to the
// React Native build. Types are platform-agnostic, so they come from `./types`.
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  IconButton,
  GhostButton,
  TextButton,
  InverseButton,
  OutlineButton,
  LinkButton,
  DestructiveButton,
} from './Button.web';

export type { ButtonProps, ButtonVariant, ButtonSize } from './types';
