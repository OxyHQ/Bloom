import { createElement } from 'react';
export { TYPE_SCALE } from '../../../../../src/typography/scale';
export type { TypeScaleFamily, TypeScaleWeight } from '../../../../../src/typography/scale';
export type { TypeScaleVariant } from '../../../../../src/typography/scale';

// Bloom's typography components, as named hosts: what reaches them is the contract under test.
// `Text` hands its props to React Native's text host, so a suite finds the text it drew.
export const Text = (props: Record<string, unknown>) => createElement('Text', props);
export const Title = 'Title';
export const Subtitle = 'Subtitle';
export const H1 = 'H1';
export const H2 = 'H2';
export const H3 = 'H3';
export const H4 = 'H4';
export const H5 = 'H5';
export const H6 = 'H6';
export const P = 'P';
export const Lead = 'Lead';
export const Large = 'Large';
export const Small = 'Small';
export const Muted = 'Muted';
export const Blockquote = 'Blockquote';
/** Bloom's family style, as the native renderer names it (`fontFamilyStyle` in Typography.tsx). */
export const fontFamilyStyle = (kind: 'display' | 'sans' | 'mono') => ({
  fontFamily: kind === 'mono' ? 'JetBrains Mono' : kind === 'sans' ? 'Inter' : 'BlomusModernus',
});
