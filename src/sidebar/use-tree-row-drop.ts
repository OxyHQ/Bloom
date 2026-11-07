import { useEffect, useState } from 'react';

import type { DropTargetDragEvent } from '../platform-surface/types';
import type { SidebarTreeItemDrop } from './types';

/**
 * A tree row's `drop`: the `DropZone` props that follow the drag over the row,
 * and whether the row is lit, as Finder lights a sidebar row under a drag it
 * would take. Lit while a drag over it would drop something (its action is not
 * null: Option or Command can make a drag drop nothing), cleared when it
 * leaves, is dropped or the row stops taking drops.
 */
export function useTreeRowDrop(drop: SidebarTreeItemDrop | undefined): {
  lit: boolean;
  zone: SidebarTreeItemDrop | null;
} {
  const [over, setOver] = useState(false);
  const takes = drop != null && drop.disabled !== true;
  useEffect(() => {
    if (!takes) setOver(false);
  }, [takes]);
  if (!drop) return { lit: false, zone: null };
  const follow = (event: DropTargetDragEvent) => setOver(event.action !== null);
  return {
    lit: takes && over,
    zone: {
      ...drop,
      onDragEnter: (event) => {
        follow(event);
        drop.onDragEnter?.(event);
      },
      onDragOver: (event) => {
        follow(event);
        drop.onDragOver?.(event);
      },
      onDragLeave: () => {
        setOver(false);
        drop.onDragLeave?.();
      },
      onDrop: (event) => {
        setOver(false);
        drop.onDrop(event);
      },
    },
  };
}
