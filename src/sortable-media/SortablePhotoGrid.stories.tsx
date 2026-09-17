import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SortablePhotoGrid } from './SortablePhotoGrid';
import type { SortablePhoto } from './types';

const meta: Meta = {
  title: 'Base/Sortable Photo Grid',
};

export default meta;

type Story = StoryObj;

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/600/600`;

const INITIAL: SortablePhoto[] = [
  { id: 'living', uri: photo('marlow-living'), alt: 'Living room' },
  { id: 'kitchen', uri: photo('marlow-kitchen'), alt: 'Kitchen' },
  { id: 'bedroom', uri: photo('marlow-bedroom'), alt: 'Bedroom' },
  { id: 'terrace', uri: photo('marlow-terrace'), status: 'uploading', progress: 42 },
  { id: 'bath', uri: photo('marlow-bath'), status: 'error' },
  { id: 'hall', uri: photo('marlow-hall') },
];

/** A stand-in for the app's uploader: advances every uploading photo, fails on demand. */
function useFakeUploads(initial: SortablePhoto[]) {
  const [photos, setPhotos] = useState(initial);
  const counter = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setPhotos((list) =>
        list.some((p) => p.status === 'uploading' && p.progress != null)
          ? list.map((p) =>
              p.status === 'uploading' && p.progress != null
                ? p.progress >= 100
                  ? { ...p, status: 'uploaded', progress: undefined }
                  : { ...p, progress: Math.min(100, p.progress + 4) }
                : p,
            )
          : list,
      );
    }, 400);
    return () => clearInterval(timer);
  }, []);
  return {
    photos,
    setPhotos,
    add: () => {
      counter.current += 1;
      const id = `new-${counter.current}`;
      setPhotos((list) => [...list, { id, uri: photo(`marlow-${id}`), status: 'uploading', progress: 0 }]);
    },
    remove: (id: string) => setPhotos((list) => list.filter((p) => p.id !== id)),
    retry: (id: string) =>
      setPhotos((list) => list.map((p) => (p.id === id ? { ...p, status: 'uploading', progress: 0 } : p))),
  };
}

function Demo({ width, testID, initial = INITIAL }: { width: number; testID: string; initial?: SortablePhoto[] }) {
  const theme = useTheme();
  const { photos, setPhotos, add, remove, retry } = useFakeUploads(initial);
  return (
    <View style={{ width, gap: 12 }}>
      <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
        {`${width} wide · order: ${photos.map((p) => p.id).join(', ')}`}
      </Text>
      <SortablePhotoGrid
        photos={photos}
        onReorder={setPhotos}
        onRemove={remove}
        onRetry={retry}
        onAdd={add}
        maxPhotos={12}
        addHint="JPG or PNG"
        testID={testID}
      />
    </View>
  );
}

/** Drag a tile with a mouse, or use the arrow buttons. Upload progress runs; the failed photo retries. */
export const Playground: Story = {
  render: () => <Demo width={720} testID="grid" />,
};

/** Three columns at phone width; the controls are always shown on touch. */
export const Narrow: Story = {
  render: () => <Demo width={343} testID="grid-narrow" />,
};

/** No photos yet: the add tile alone. */
export const Empty: Story = {
  render: () => <Demo width={720} testID="grid-empty" initial={[]} />,
};

/** Read-only while the listing publishes. */
export const Disabled: Story = {
  render: () => (
    <View style={{ width: 720 }}>
      <SortablePhotoGrid
        photos={INITIAL.slice(0, 3)}
        onReorder={() => undefined}
        onRemove={() => undefined}
        onAdd={() => undefined}
        disabled
        testID="grid-disabled"
      />
    </View>
  ),
};
