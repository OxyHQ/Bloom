import {
  EmptyMediaSurface,
  MediaFlightHost,
  MediaFlightLayer,
  MediaPoster,
  MediaSurface,
  type MediaSurfaceContent,
  type VideoPlayerLike,
} from '@oxy.so/bloom/media-flight';
import { Text } from '@oxy.so/bloom/typography';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const PHOTO: MediaSurfaceContent = { uri: 'https://example.com/photo.jpg' };
const PREVIEWED: MediaSurfaceContent = {
  uri: 'https://example.com/photo.jpg',
  previewUri: 'https://example.com/photo-small.jpg',
};
/** A consumer-owned player: Bloom only hands it on. */
const PLAYER = {} as VideoPlayerLike;
const CLIP: MediaSurfaceContent = {
  kind: 'video',
  player: PLAYER,
  poster: 'https://example.com/poster.jpg',
};
const BOX = { width: 320, height: 200 };
const frame = { width: '320', height: '200' } as const;

// On the web a flight id names ONE media node, moved into whichever host claims it, so the
// two sides of a case (drawn side by side in the story) are hosts of their own ids.
// `.allowsHitTesting(false)` is the language's own layer on every view (on the web, a host
// around a Bloom component), not the host's `pointerEvents`: no case here compares it.
export const MEDIA_FLIGHT_CASES: readonly ParityCase[] = [
  {
    name: 'the layer flights paint in, at rest',
    // At rest no flight is up: the layer draws nothing on the web.
    drawsNothing: ['web'],
    language: () => toElement(L.MediaFlightLayer()),
    bloom: () => <MediaFlightLayer />,
  },
  {
    name: 'a flight host',
    language: () => toElement(L.MediaFlightHost('language-1', PHOTO).frame(frame)),
    bloom: () => <MediaFlightHost id="bloom-1" content={PHOTO} style={BOX} />,
  },
  {
    name: 'a flight host that fits, is named and lands a flight',
    language: () =>
      toElement(
        L.MediaFlightHost('language-2', PREVIEWED)
          .frame(frame)
          .contentFit('contain')
          .surfaceType('surfaceView')
          .flightId('post-2')
          .label('Photo'),
      ),
    bloom: () => (
      <MediaFlightHost
        id="bloom-2"
        content={PREVIEWED}
        style={BOX}
        contentFit="contain"
        surfaceType="surfaceView"
        flightId="post-2"
        accessibilityLabel="Photo"
      />
    ),
  },
  {
    name: 'a surface',
    language: () => toElement(L.MediaSurface(PHOTO).frame(frame).contentFit('cover')),
    bloom: () => <MediaSurface content={PHOTO} style={BOX} contentFit="cover" />,
  },
  {
    name: 'a video drawn by a slot of its own, with controls',
    language: () =>
      toElement(
        L.MediaSurface(CLIP)
          .frame(frame)
          .nativeControls(true)
          .videoSlot(() => L.Text('Playing')),
      ),
    bloom: () => (
      <MediaSurface
        content={CLIP}
        style={BOX}
        nativeControls
        renderVideo={() => <Text>Playing</Text>}
      />
    ),
  },
  {
    name: "a video's poster",
    language: () => toElement(L.MediaPoster(CLIP).frame(frame).contentFit('contain')),
    bloom: () => <MediaPoster content={CLIP} style={BOX} contentFit="contain" />,
  },
  {
    name: 'an empty surface',
    language: () => toElement(L.EmptyMediaSurface().frame(frame)),
    bloom: () => <EmptyMediaSurface style={BOX} />,
  },
];
