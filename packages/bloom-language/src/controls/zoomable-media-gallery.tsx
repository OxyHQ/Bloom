import { createElement, useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { useMediaFlight } from '@oxy.so/bloom/media-flight';
import {
  ZoomableMediaGallery,
  type GalleryMedia,
  type GalleryVideo,
  type ZoomableMediaGalleryHandle,
  type ZoomableMediaGalleryLabels,
  type ZoomableMediaGalleryProps,
} from '@oxy.so/bloom/zoomable-media-gallery';

import type { Binding } from '../binding';
import { Node, type Child, type ViewNode } from '../node';
import { type CornerName, resolveCorner } from '../tokens';
import { type ControlRenderer, lastOf } from './draw';

/** The full-screen media viewer, presented by a binding (Bloom `zoomable-media-gallery`). */
export type GalleryKind = 'gallery';

/** A dimmed overlay (default) or an opaque page in the theme. */
export type GalleryStyle = NonNullable<ZoomableMediaGalleryProps['appearance']>;
/** A many-item gallery's page indicator: `dots` (default) or `thumbnails`. */
export type GalleryIndicator = NonNullable<ZoomableMediaGalleryProps['indicatorVariant']>;

/**
 * Bloom `ZoomableMediaGallery`'s content: images and the app's own videos.
 * Only `.fullScreenCover()` presents it; it is never placed in a stack.
 */
export interface GalleryView extends ViewNode {
  /** The page shown: where it opens, and what swiping sets (the first by default). */
  page(value: Binding<number>): GalleryView;
  /** `overlay` (default) or `page`. */
  style(value: GalleryStyle): GalleryView;
  pageIndicator(value: GalleryIndicator): GalleryView;
  /** The media's corner, as its thumbnails have it; `full` is a circle at every size (an avatar). */
  mediaCorner(value: Exclude<CornerName, 'concentric'>): GalleryView;
  /** The platform's playback controls on a video page (off: a video opens as a moving picture). */
  nativeControls(value: boolean): GalleryView;
  /** Status or actions of your own over the active video. */
  videoOverlay(value: (media: GalleryVideo) => Child): GalleryView;
  /**
   * The media-flight anchors (`MediaFlightHost` ids) its items open from and
   * fly back to, by index: without one, an item fades in and out at the centre.
   */
  sourceAnchors(value: readonly (string | undefined)[]): GalleryView;
  labels(value: Partial<ZoomableMediaGalleryLabels>): GalleryView;
}

/** Bloom `ZoomableMediaGallery` of `items`, presented with `.fullScreenCover(isPresented, Gallery(items))`. */
export function Gallery(items: readonly GalleryMedia[]): GalleryView {
  return new Node('gallery', { items }, []);
}

export const GALLERIES: Record<GalleryKind, ControlRenderer> = {
  gallery: () => {
    throw new Error('bloom-language: a Gallery is content; present it with .fullScreenCover()');
  },
};

/** What a view's `.fullScreenCover()` holds: its binding and the content it presents. */
export type Cover = readonly [isPresented: Binding<boolean>, content: GalleryView];

interface GalleryCoverProps {
  readonly isPresented: Binding<boolean>;
  readonly gallery: Node;
  readonly render: (child: Child) => ReactNode;
}

/**
 * Bloom's gallery beside the view that presents it, opened and closed by the
 * binding: setting it opens the gallery at its page (from that page's source
 * anchor) and clearing it closes it; the gallery closing itself clears it.
 */
function GalleryCover({ isPresented: [open, setOpen], gallery, render }: GalleryCoverProps) {
  const ref = useRef<ZoomableMediaGalleryHandle>(null);
  const shown = useRef(false);
  const { measureAnchor } = useMediaFlight();
  const { items } = gallery.props as { items: readonly GalleryMedia[] };
  const page = lastOf(gallery, 'page')?.value as Binding<number> | undefined;
  const anchors = lastOf(gallery, 'sourceAnchors')?.value;
  const corner = lastOf(gallery, 'mediaCorner')?.value;
  const overlay = lastOf(gallery, 'videoOverlay')?.value;
  const index = page?.[0] ?? 0;

  useEffect(() => {
    if (open === shown.current) return;
    const gallery = ref.current;
    if (!open) {
      gallery?.close?.();
      return;
    }
    const anchor = anchors?.[index];
    if (anchor === undefined) {
      gallery?.open([...items], index);
      return;
    }
    let live = true;
    void measureAnchor(anchor).then((rect) => {
      if (live) ref.current?.open([...items], index, rect ?? undefined);
    });
    return () => {
      live = false;
    };
  }, [open, items, index, anchors, measureAnchor]);

  return createElement(ZoomableMediaGallery, {
    ref,
    appearance: lastOf(gallery, 'style')?.value as GalleryStyle | undefined,
    indicatorVariant: lastOf(gallery, 'pageIndicator')?.value,
    videoControls: lastOf(gallery, 'nativeControls')?.value,
    cornerRadius:
      corner === undefined ? undefined : corner === 'full' ? 'circle' : resolveCorner(corner),
    labels: lastOf(gallery, 'labels')?.value as Partial<ZoomableMediaGalleryLabels> | undefined,
    renderVideoOverlay:
      overlay === undefined ? undefined : (media: GalleryVideo) => render(overlay(media)),
    measureThumb:
      anchors === undefined
        ? undefined
        : (i: number) => {
            const anchor = anchors[i];
            return anchor === undefined ? Promise.resolve(null) : measureAnchor(anchor);
          },
    onIndexChange: page?.[1],
    onOpenChange: (next: boolean) => {
      shown.current = next;
      if (!next) setOpen(false);
    },
  });
}

/** The gallery a view's `.fullScreenCover()` presents, drawn beside the view. */
export function drawCover(
  [isPresented, gallery]: Cover,
  render: (child: Child) => ReactNode,
): ReactElement {
  return createElement(GalleryCover, { isPresented, gallery: gallery as Node, render });
}
