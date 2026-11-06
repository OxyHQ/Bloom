import type { ReactNode } from 'react';

/** One chip of a `SortableChipRow`. `key` is its identity across reorders. */
export interface SortableChipItem {
  key: string;
  /** Its name: what a screen reader says of it when it is moved. */
  label: string;
  /** The chip itself, drawn as the caller wants it. */
  node: ReactNode;
}

export interface SortableChipRowProps {
  items: readonly SortableChipItem[];
  /** The new order of keys, after one chip has been moved. */
  onReorder: (keys: string[]) => void;
  /** Drawn after the chips (an add control), not part of the order. */
  trailing?: ReactNode;
  /** Called when a drag starts and ends, so a parent can hold its scroll. */
  onDragStateChange?: (dragging: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}
