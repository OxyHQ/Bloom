import React from 'react';
import { Image, Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ZoomableMediaGallery } from './ZoomableMediaGallery';
import type {
  GalleryImage,
  GalleryMedia,
  MeasuredRect,
  ZoomableMediaGalleryHandle,
  ZoomableMediaGalleryProps,
} from './types';

/**
 * There was no story for this component, which is exactly why its four frozen
 * web mappers (`useAnimatedStyle` with no dependency array — see the CRITICAL note
 * in `ZoomableMediaGallery.tsx`) were found by static analysis instead of by the
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
  title: 'Overlays/ZoomableMediaGallery',
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

/**
 * A video page WITHOUT expo-video installed — which is the shape a browser
 * story can actually show, and the one worth showing. Bloom does not create
 * players, so a story cannot conjure one; what it can demonstrate is the
 * documented degradation: the page falls back to the poster, keeps its aspect
 * ratio, still pages, still zooms and still flies back to its thumbnail.
 *
 * `player` is the structural minimum `VideoPlayerLike` asks for. Handing the
 * real thing is a consumer's job (`useVideoPlayer`), and the whole point of the
 * type being structural is that this stub is the only stand-in a story needs.
 */
const INERT_PLAYER = { playing: false, play: () => {}, pause: () => {} };

const CLIP: GalleryMedia = {
  kind: 'video',
  id: 'story-clip',
  player: INERT_PLAYER,
  poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200',
  alt: 'A video page, degraded to its poster because expo-video is absent',
  aspectRatio: 1.5,
};

const MIXED: GalleryMedia[] = [FOREST, CLIP, VALLEY];

const THUMB = 96;

/**
 * Mirrors how a consumer wires this up: thumbnails measure themselves so the
 * open/close transition can fly to and from the tapped tile.
 */
function GalleryDemo({
  items,
  ...props
}: ZoomableMediaGalleryProps & { items: GalleryMedia[] }) {
  const galleryRef = React.useRef<ZoomableMediaGalleryHandle>(null);
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
      galleryRef.current?.open(items, index, rect ?? undefined);
    },
    [items, measureRect],
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {items.map((item, index) => {
          const poster = item.kind === 'video' ? item.poster : item.uri;
          return (
            <Pressable
              key={item.kind === 'video' ? item.id : item.uri}
              ref={(node) => {
                thumbRefs.current[index] = node;
              }}
              onPress={() => {
                void openAt(index);
              }}
            >
              <Image
                source={poster === undefined ? undefined : { uri: poster }}
                style={{ width: THUMB, height: THUMB, borderRadius: 8 }}
              />
            </Pressable>
          );
        })}
      </View>
      <ZoomableMediaGallery
        ref={galleryRef}
        measureThumb={measureRect}
        {...props}
      />
    </View>
  );
}

export const SingleImage: Story = {
  render: () => <GalleryDemo items={[FOREST]} />,
};

export const MultipleImages: Story = {
  render: () => <GalleryDemo items={IMAGES} />,
};

export const ThumbnailIndicator: Story = {
  render: () => <GalleryDemo items={IMAGES} indicatorVariant="thumbnails" />,
};

export const SquareCorners: Story = {
  render: () => <GalleryDemo items={IMAGES} cornerRadius={0} />,
};

/**
 * An image, a video and an image in one pager — the mixed case, where the
 * indicator, the paging and the fly-back all have to treat the video page as
 * just another page.
 */
export const MixedMedia: Story = {
  render: () => <GalleryDemo items={MIXED} indicatorVariant="thumbnails" />,
};
