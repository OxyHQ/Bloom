import { ShareSheet as BloomShareSheet, type ShareSheetProps } from '@oxy.so/bloom/share-sheet';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ShareSheetSize } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** What a "send" button opens: people, a search and other destinations. */
export type ShareSheetKind = 'shareSheet';

/**
 * Bloom `ShareSheet`'s data: its title, people and their press, the other
 * destinations and the locale; `peopleEmpty` is a language child. Its search
 * field is its `.search()`.
 */
export type ShareSheetOptions = Omit<
  ShareSheetProps,
  'style' | 'testID' | 'size' | 'peopleEmpty' | 'search'
> & {
  readonly peopleEmpty?: Child;
};
type ShareSheetSearch = NonNullable<ShareSheetProps['search']>;
/** A share sheet's search field's placeholder and submit, as Bloom's `search` takes them, but its text. */
export type ShareSheetSearchOptions = Omit<ShareSheetSearch, 'value' | 'onValueChange'>;

/** Bloom `ShareSheet`. */
export interface ShareSheetView extends ViewModifiers<ShareSheetView> {
  /** `sm`, `md` (default) or `lg`. */
  size(value: ShareSheetSize): ShareSheetView;
  /** The search field above the people: the text its binding holds. Without it there is none. */
  search(value: Binding<string>, options?: ShareSheetSearchOptions): ShareSheetView;
}

export function ShareSheet(options: ShareSheetOptions = {}): ShareSheetView {
  return new Node('shareSheet', { options }, []);
}

type SearchModifier = readonly [Binding<string>, ShareSheetSearchOptions?];

/** A share sheet's `.search()` as Bloom's `search`: its options, its binding as the text and its setter. */
function searchOf(search: SearchModifier | undefined): ShareSheetSearch | undefined {
  if (search === undefined) return undefined;
  const [[value, set], options] = search;
  return { ...options, value, onValueChange: set };
}

export const SHARE_SHEETS: Record<ShareSheetKind, ControlRenderer> = {
  shareSheet: product(BloomShareSheet, {
    slots: ['peopleEmpty'],
    own: (d) => ({
      size: d.own('size')?.value,
      search: searchOf(d.own('search')?.value as SearchModifier | undefined),
    }),
  }),
};
