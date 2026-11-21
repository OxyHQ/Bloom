import { type ReactElement, useEffect, useRef } from 'react';
import { PortalOutlet, PortalProvider } from '@oxy.so/bloom/portal';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';
import {
  type GalleryMedia,
  ZoomableMediaGallery,
  type ZoomableMediaGalleryHandle,
  type ZoomableMediaGalleryProps,
} from '@oxy.so/bloom/zoomable-media-gallery';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const ITEMS: GalleryMedia[] = [
  { uri: 'https://example.com/one.jpg', aspectRatio: 4 / 3, alt: 'A harbour' },
  { uri: 'https://example.com/two.jpg', aspectRatio: 1 },
];

/** What an app writes today: the gallery beside its thumbnail, opened through its ref. */
function BloomCover({
  open,
  index = 0,
  ...props
}: ZoomableMediaGalleryProps & { open: boolean; index?: number }) {
  const ref = useRef<ZoomableMediaGalleryHandle>(null);
  useEffect(() => {
    if (open) ref.current?.open([...ITEMS], index);
  }, [open, index]);
  return (
    <>
      <Text>Photos</Text>
      <ZoomableMediaGallery ref={ref} onOpenChange={set} {...props} />
    </>
  );
}

/** The app root's portal, where an open gallery draws: the same around both sides. */
function Root({ children }: { children: ReactElement }) {
  return (
    <PortalProvider>
      {children}
      <PortalOutlet />
    </PortalProvider>
  );
}

const CASES: readonly ParityCase[] = [
  {
    name: 'a closed gallery beside its view',
    language: () => toElement(L.Text('Photos').fullScreenCover([false, set], L.Gallery(ITEMS))),
    bloom: () => <BloomCover open={false} />,
  },
  {
    name: 'an open gallery',
    language: () => toElement(L.Text('Photos').fullScreenCover([true, set], L.Gallery(ITEMS))),
    bloom: () => <BloomCover open />,
  },
  {
    name: 'a page of its own, at the second item, with thumbnails, a corner, controls and words',
    language: () =>
      toElement(
        L.Text('Photos').fullScreenCover(
          [true, set],
          L.Gallery(ITEMS)
            .page([1, set])
            .style('page')
            .pageIndicator('thumbnails')
            .mediaCorner('lg')
            .nativeControls(true)
            .labels({ share: 'Send' }),
        ),
      ),
    bloom: () => (
      <BloomCover
        open
        index={1}
        onIndexChange={set}
        appearance="page"
        indicatorVariant="thumbnails"
        cornerRadius={tokens.borderRadius.lg}
        videoControls
        labels={{ share: 'Send' }}
      />
    ),
  },
  {
    name: 'an avatar, round at every size',
    language: () =>
      toElement(
        L.Text('Photos').fullScreenCover([true, set], L.Gallery(ITEMS).mediaCorner('full')),
      ),
    bloom: () => <BloomCover open cornerRadius="circle" />,
  },
];

export const GALLERY_CASES: readonly ParityCase[] = CASES.map((c) => ({
  name: c.name,
  language: () => <Root>{c.language()}</Root>,
  bloom: () => <Root>{c.bloom()}</Root>,
}));
