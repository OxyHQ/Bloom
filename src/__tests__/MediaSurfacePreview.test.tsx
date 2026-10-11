/**
 * Pins Bloom's native Expo Image contract. Delayed requests, decoded pixels and
 * failure retention are exercised with the real web renderer by Mention's
 * image viewer browser regression, not simulated by this Expo Image mock.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'expo-image';
import { MediaPoster, MediaSurface } from '../media-flight/MediaSurface';

const PHOTO = { uri: 'https://images.test/full.jpg', previewUri: 'https://images.test/thumb.jpg' };

describe('progressive media surfaces', () => {
  it('starts the full image eagerly using the cached thumbnail until it is ready', () => {
    const view = render(<MediaSurface content={PHOTO} contentFit="contain" />);
    const image = view.UNSAFE_getByType(Image);
    expect(image.props).toMatchObject({
      source: { uri: PHOTO.uri },
      placeholder: { uri: PHOTO.previewUri },
      placeholderContentFit: 'contain',
      contentFit: 'contain',
      recyclingKey: PHOTO.uri,
      cachePolicy: 'memory-disk',
      priority: 'high',
      loading: 'eager',
      transition: 120,
    });
  });

  it('isolates a new source from the previous image and its pending callbacks', () => {
    const view = render(<MediaSurface content={PHOTO} />);
    const previous = view.UNSAFE_getByType(Image);
    const next = {
      uri: 'https://images.test/next.jpg',
      previewUri: 'https://images.test/next-thumb.jpg',
    };
    view.rerender(<MediaSurface content={next} />);
    const image = view.UNSAFE_getByType(Image);
    expect(image).not.toBe(previous);
    expect(image.props.source).toEqual({ uri: next.uri });
    expect(image.props.placeholder).toEqual({ uri: next.previewUri });
    expect(image.props.recyclingKey).toBe(next.uri);
  });

  it('does not restart a same-source render', () => {
    const view = render(<MediaSurface content={PHOTO} />);
    const previous = view.UNSAFE_getByType(Image);
    view.rerender(<MediaSurface content={{ ...PHOTO }} contentFit="cover" />);
    expect(view.UNSAFE_getByType(Image)).toBe(previous);
  });

  it('does not crossfade an image into the same thumbnail URL', () => {
    const view = render(<MediaSurface content={{ uri: PHOTO.uri, previewUri: PHOTO.uri }} />);
    const image = view.UNSAFE_getByType(Image);
    expect(image.props.placeholder).toBeUndefined();
    expect(image.props.transition).toBe(0);
  });

  it('keeps the existing image-only contract for callers without a preview', () => {
    const view = render(<MediaSurface content={{ uri: PHOTO.uri }} />);
    const image = view.UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({ uri: PHOTO.uri });
    expect(image.props.placeholder).toBeUndefined();
    expect(image.props.transition).toBe(0);
  });

  it('does not request the full image for offscreen pages or thumbnail-strip tiles', () => {
    const view = render(<MediaPoster content={PHOTO} />);
    const image = view.UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({ uri: PHOTO.previewUri });
    expect(image.props.cachePolicy).toBe('memory-disk');
  });

  it('falls back to the image when no separate preview exists', () => {
    const view = render(<MediaPoster content={{ uri: PHOTO.uri }} />);
    expect(view.UNSAFE_getByType(Image).props.source).toEqual({ uri: PHOTO.uri });
  });
});
