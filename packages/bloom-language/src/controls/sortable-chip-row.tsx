import {
  SortableChipRow as BloomSortableChipRow,
  type SortableChipItem,
} from '@oxy.so/bloom/sortable-chip-row';

import { Node, type Child, type ViewModifiers } from '../node';
import { type ControlRenderer, nodesOf, slot } from './draw';

/** A row of chips reordered by a drag on the gesture layer, or by the keyboard (Bloom `sortable-chip-row`). */
export type SortableChipRowKind = 'sortableChipRow' | 'sortableChip';

/** Bloom `SortableChipRow`: its chips, in the order the screen keeps. */
export interface SortableChipRowView extends ViewModifiers<SortableChipRowView> {
  /** The new order of the chips' keys, after one has been moved. */
  onReorder(value: (keys: string[]) => void): SortableChipRowView;
  /** A drag began (`true`) or ended (`false`), so a parent can hold its scroll. */
  onDragChange(value: (dragging: boolean) => void): SortableChipRowView;
  /** Drawn after the chips (an add control), not part of the order. */
  trailing(...value: Child[]): SortableChipRowView;
  disabled(value?: boolean): SortableChipRowView;
}
/** One chip of a `SortableChipRow`: drawn by its row. */
export type SortableChipView = { readonly kind: 'sortableChip' };

/** Bloom `SortableChipRow`: `chips` in the screen's order; `.label()` names the row. */
export function SortableChipRow(...chips: SortableChipView[]): SortableChipRowView {
  return new Node('sortableChipRow', null, chips as unknown as Child[]);
}
/** A chip: `key` is its identity across moves, `label` what a screen reader says of it when moved. */
export function SortableChip(key: string, label: string, content: Child): SortableChipView {
  return new Node('sortableChip', { key, label, content }, []) as unknown as SortableChipView;
}

const NOT_DRAWN = () => {
  throw new Error('bloom-language: a SortableChip is drawn by its SortableChipRow');
};

export const SORTABLE_CHIP_ROWS: Record<SortableChipRowKind, ControlRenderer> = {
  sortableChipRow: (d) => {
    const props = d.props();
    Object.assign(props, {
      items: nodesOf(d.node.children).map((chip): SortableChipItem => {
        const { key, label, content } = chip.props as {
          key: string;
          label: string;
          content: Child;
        };
        return { key, label, node: d.render(content) };
      }),
      onReorder: d.own('onReorder')?.value,
      onDragStateChange: d.own('onDragChange')?.value,
      trailing: slot(d, d.own('trailing')?.value),
      disabled: d.own('disabled')?.value,
    });
    return d.component(BloomSortableChipRow, props);
  },
  sortableChip: NOT_DRAWN,
};
