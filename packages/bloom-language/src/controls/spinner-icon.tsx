import { SpinnerIcon as BloomSpinnerIcon } from '@oxy.so/bloom/loading';

import { Node, type ViewModifiers } from '../node';
import { type IconSizeToken, type InkToken, resolveIconSize } from '../tokens';
import { type ControlRenderer, defineControls } from './draw';

/** Bloom's morphing loader glyph, alone (`@oxy.so/bloom/loading`). */
export type SpinnerIconKind = 'spinnerIcon';

/** Bloom `SpinnerIcon`: a shape that morphs into the next as it turns. */
export interface SpinnerIconView extends ViewModifiers<SpinnerIconView> {
  /** Its width and height: an icon rung, a numeric side or an app token (Bloom's 26 by default). */
  size(value: IconSizeToken): SpinnerIconView;
  /**
   * Its colour (Bloom's `color`): a role painted from the theme, or an app's
   * own colour (`defineTokens({ color: { onVideo: '#FFFFFF' } })`), drawn as
   * written; the text's colour by default.
   */
  tint(value: InkToken): SpinnerIconView;
}

/** Bloom `SpinnerIcon`: the loader's glyph without its label or its track. */
export function SpinnerIcon(): SpinnerIconView {
  return new Node('spinnerIcon', null, []);
}

const SPINNER_ICONS: Record<SpinnerIconKind, ControlRenderer> = {
  // Its box is its `style`, after its own size, as an app writes it.
  spinnerIcon: (d) => {
    const size = d.own('size')?.value as IconSizeToken | undefined;
    return d.painted(
      BloomSpinnerIcon,
      { key: d.key, size: size === undefined ? undefined : resolveIconSize(size) },
      { color: d.own('tint')?.value as InkToken | undefined },
    );
  },
};
defineControls(SPINNER_ICONS);
