/**
 * Where each usage error the runtime reports is explained, appended to the
 * message as `See <link>`. The compiler's diagnostics link the same docs
 * (`bloom-language-compiler/test/doc-links.test.cjs` checks every anchor).
 */
const DOCS = 'https://github.com/OxyHQ/Bloom/blob/main/docs/';

export const SEE = {
  tokens: `${DOCS}bloom-language-tour.mdx#tokens`,
  variants: `${DOCS}bloom-language-tour.mdx#variants`,
  environment: `${DOCS}bloom-language-tour.mdx#environment`,
  navigation: `${DOCS}bloom-language-tour.mdx#navigation`,
  overlays: `${DOCS}bloom-language-tour.mdx#overlays`,
  animation: `${DOCS}bloom-language-tour.mdx#animation-and-gestures`,
  corner: `${DOCS}bloom-language-modifiers.mdx#corner`,
  contentView: `${DOCS}bloom-language-modifiers.mdx#contentview`,
} as const;
