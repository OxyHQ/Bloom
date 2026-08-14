import React from 'react';
import { Image, Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ZoomableImageGallery } from './ZoomableImageGallery';
import type {
  GalleryImage,
  MeasuredRect,
  ZoomableImageGalleryHandle,
  ZoomableImageGalleryProps,
} from './types';

/**
 * There was no story for this component, which is exactly why its four frozen
 * web mappers (`useAnimatedStyle` with no dependency array — see the CRITICAL note
 * in `ZoomableImageGallery.tsx`) were found by static analysis instead of by the
 * web gate. These stories make the animated paths observable in a browser:
 *
 *  - **open**: the tapped thumbnail flies to the fitted centre and the backdrop fades in
 *  - **drag to dismiss**: dragging the open image follows the pointer, fades, and snaps
 *    back or closes
 *  - **zoom**: pinch, or double-tap, then pan the zoomed image
 *
 * All three are driven by shared values read inside those mappers, so if a
 * dependency array is ever dropped again these stories freeze visibly.
 */
const meta: Meta = {
  title: 'Overlays/ZoomableImageGallery',
};

export default meta;

type Story = StoryObj;

const FOREST: GalleryImage = {
  uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
  alt: 'Sunlight through a forest canopy',
  aspectRatio: 1.5,
};

const RIDGE: GalleryImage = {
  uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
  alt: 'A mountain ridge above the clouds',
  aspectRatio: 1.5,
};

const VALLEY: GalleryImage = {
  uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
  alt: 'Fog rolling through a valley of pines',
  aspectRatio: 1.5,
};

const IMAGES: GalleryImage[] = [FOREST, RIDGE, VALLEY];

const THUMB = 96;

/**
 * Mirrors how a consumer wires this up: thumbnails measure themselves so the
 * open/close transition can fly to and from the tapped tile.
 */
function GalleryDemo({
  images,
  ...props
}: ZoomableImageGalleryProps & { images: GalleryImage[] }) {
  const galleryRef = React.useRef<ZoomableImageGalleryHandle>(null);
  const thumbRefs = React.useRef<Array<View | null>>([]);

  const measureRect = React.useCallback(
    (index: number) =>
      new Promise<MeasuredRect | null>((resolve) => {
        const node = thumbRefs.current[index];
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      }),
    [],
  );

  const openAt = React.useCallback(
    async (index: number) => {
      const rect = await measureRect(index);
      galleryRef.current?.open(images, index, rect ?? undefined);
    },
    [images, measureRect],
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {images.map((image, index) => (
          <Pressable
            key={image.uri}
            ref={(node) => {
              thumbRefs.current[index] = node;
            }}
            onPress={() => {
              void openAt(index);
            }}
          >
            <Image
              source={{ uri: image.uri }}
              style={{ width: THUMB, height: THUMB, borderRadius: 8 }}
            />
          </Pressable>
        ))}
      </View>
      <ZoomableImageGallery
        ref={galleryRef}
        measureThumb={measureRect}
        {...props}
      />
    </View>
  );
}

export const SingleImage: Story = {
  render: () => <GalleryDemo images={[FOREST]} />,
};

export const MultipleImages: Story = {
  render: () => <GalleryDemo images={IMAGES} />,
};

export const ThumbnailIndicator: Story = {
  render: () => <GalleryDemo images={IMAGES} indicatorVariant="thumbnails" />,
};

export const SquareCorners: Story = {
  render: () => <GalleryDemo images={IMAGES} cornerRadius={0} />,
};
