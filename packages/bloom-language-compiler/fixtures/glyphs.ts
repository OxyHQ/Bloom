import { createElement } from 'react';

/** Icon stand-ins: what reaches them (size and fill) is what parity compares. */
export const Glyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('Glyph', props);
export const MoreGlyph = (props: { width?: number; height?: number; fill?: string }) =>
  createElement('MoreGlyph', props);
