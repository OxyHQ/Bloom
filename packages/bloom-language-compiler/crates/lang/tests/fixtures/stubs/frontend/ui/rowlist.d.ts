import type { ReactElement } from 'react';

/** A list component whose props Bloom cannot read (an index signature, as React Native's
 * `FlatList` props are generic): TS checks them, and `renderItem` is a TS callback. */
export interface RowListProps {
  data: readonly string[];
  renderItem: (info: { item: string; index: number }) => ReactElement | null;
  [prop: string]: unknown;
}
export declare function RowList(props: RowListProps): ReactElement;
