import { SortablePhotoGrid } from '@oxy.so/bloom/sortable-media';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const PHOTOS = [
  { id: 'a', uri: 'https://example.com/a.jpg', alt: 'The front door' },
  { id: 'b', uri: 'https://example.com/b.jpg', status: 'uploading', progress: 40 },
  { id: 'c', uri: 'https://example.com/c.jpg', status: 'error', error: 'Too large' },
] as const;

export const SORTABLE_MEDIA_CASES: readonly ParityCase[] = [
  {
    name: 'a photo grid',
    language: () => toElement(L.SortablePhotoGrid([PHOTOS, set])),
    bloom: () => <SortablePhotoGrid photos={PHOTOS} onReorder={set} />,
  },
  {
    name: 'removable, retried, an add tile with its hint, a ceiling, columns',
    language: () =>
      toElement(
        L.SortablePhotoGrid([PHOTOS, set])
          .onRemove(set)
          .onRetry(set)
          .onAdd(set)
          .max(6)
          .addHint('Up to 6')
          .columns(4)
          .imageVariant('thumb')
          .labels({ cover: 'Main photo', add: 'Add a photo' })
          .label('Listing photos')
          .testID('photos'),
      ),
    bloom: () => (
      <SortablePhotoGrid
        photos={PHOTOS}
        onReorder={set}
        onRemove={set}
        onRetry={set}
        onAdd={set}
        maxPhotos={6}
        addHint="Up to 6"
        columns={4}
        photoVariant="thumb"
        labels={{ cover: 'Main photo', add: 'Add a photo' }}
        accessibilityLabel="Listing photos"
        testID="photos"
      />
    ),
  },
  {
    name: 'a disabled grid with a box',
    language: () =>
      toElement(L.SortablePhotoGrid([PHOTOS, set]).onAdd(set).disabled().padding('md')),
    bloom: () => (
      <SortablePhotoGrid
        photos={PHOTOS}
        onReorder={set}
        onAdd={set}
        disabled
        style={{ paddingTop: 12, paddingBottom: 12, paddingStart: 12, paddingEnd: 12 }}
      />
    ),
  },
];
