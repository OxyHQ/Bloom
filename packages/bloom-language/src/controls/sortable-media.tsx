import {
  SortablePhotoGrid as BloomSortablePhotoGrid,
  type SortablePhoto,
  type SortablePhotoGridLabels,
} from '@oxy.so/bloom/sortable-media';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** An editable grid of uploaded photos, reordered by a drag or by its move buttons (Bloom `sortable-media`). */
export type SortableMediaKind = 'sortablePhotoGrid';

/** Bloom `SortablePhotoGrid`: the binding's photos, the first its cover. */
export interface SortablePhotoGridView extends ViewModifiers<SortablePhotoGridView> {
  /** A photo's remove button, and what it does (by the photo's id). */
  onRemove(value: (id: string) => void): SortablePhotoGridView;
  /** A failed photo's retry, and what it does. */
  onRetry(value: (id: string) => void): SortablePhotoGridView;
  /** The add tile, and what pressing it does. */
  onAdd(value: () => void): SortablePhotoGridView;
  /** The most photos: the add tile goes at it. */
  max(value: number): SortablePhotoGridView;
  /** The line under the add tile's label. */
  addHint(value: string): SortablePhotoGridView;
  /** Tiles per row. */
  columns(value: number): SortablePhotoGridView;
  /** The image resolver's variant each photo is drawn at (a thumbnail's). */
  imageVariant(value: string): SortablePhotoGridView;
  disabled(value?: boolean): SortablePhotoGridView;
  labels(value: Partial<SortablePhotoGridLabels>): SortablePhotoGridView;
}

/** Bloom `SortablePhotoGrid`: the binding's photos, in order; a move writes the new order. */
export function SortablePhotoGrid(
  photos: Binding<ReadonlyArray<SortablePhoto>>,
): SortablePhotoGridView {
  return new Node('sortablePhotoGrid', { photos }, []);
}

export const SORTABLE_MEDIA: Record<SortableMediaKind, ControlRenderer> = {
  sortablePhotoGrid: (d) => {
    const [photos, onReorder] = (d.node.props as { photos: Binding<ReadonlyArray<SortablePhoto>> })
      .photos;
    const props = d.props();
    Object.assign(props, {
      photos,
      onReorder,
      onRemove: d.own('onRemove')?.value,
      onRetry: d.own('onRetry')?.value,
      onAdd: d.own('onAdd')?.value,
      maxPhotos: d.own('max')?.value,
      addHint: d.own('addHint')?.value,
      columns: d.own('columns')?.value,
      photoVariant: d.own('imageVariant')?.value,
      disabled: d.own('disabled')?.value,
      labels: d.own('labels')?.value,
    });
    return d.component(BloomSortablePhotoGrid, props);
  },
};
