import { ShareSheet as BloomShareSheet, type ShareSheetProps } from '@oxy.so/bloom/share-sheet';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ShareSheetSize } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** What a "send" button opens: people, a search and other destinations. */
export type ShareSheetKind = 'shareSheet';

/**
 * Bloom `ShareSheet`'s data: its title, search, people and their press, the
 * other destinations and the locale; `peopleEmpty` is a language child.
 */
export type ShareSheetOptions = Omit<
  ShareSheetProps,
  'style' | 'testID' | 'size' | 'peopleEmpty'
> & {
  readonly peopleEmpty?: Child;
};

/** Bloom `ShareSheet`. */
export interface ShareSheetView extends ViewModifiers<ShareSheetView> {
  /** `sm`, `md` (default) or `lg`. */
  size(value: ShareSheetSize): ShareSheetView;
}

export function ShareSheet(options: ShareSheetOptions = {}): ShareSheetView {
  return new Node('shareSheet', { options }, []);
}

export const SHARE_SHEETS: Record<ShareSheetKind, ControlRenderer> = {
  shareSheet: product(BloomShareSheet, {
    slots: ['peopleEmpty'],
    own: (d) => ({ size: d.own('size')?.value }),
  }),
};
