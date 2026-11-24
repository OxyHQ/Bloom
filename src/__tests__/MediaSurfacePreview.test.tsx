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
  // The thumbnail is its own layer UNDER the full image, not expo-image's
  // `placeholder`: a placeholder reports nothing when it paints, and a viewer
  // flying out of that thumbnail waits for exactly that moment.
  const layers = (view: ReturnType<typeof render>) => {
    const [preview, full] = view.UNSAFE_getAllByType(Image);
    if (!preview || !full) throw new Error('Expected a preview layer under the full image');
    return { preview, full };
  };

  it('starts the full image eagerly over the cached thumbnail until it is ready', () => {
    const view = render(<MediaSurface content={PHOTO} contentFit="contain" />);
    const { preview, full } = layers(view);
    expect(preview.props).toMatchObject({
      source: { uri: PHOTO.previewUri },
      contentFit: 'contain',
      cachePolicy: 'memory-disk',
      transition: 0,
    });
    expect(full.props).toMatchObject({
      source: { uri: PHOTO.uri },
      contentFit: 'contain',
      recyclingKey: PHOTO.uri,
      cachePolicy: 'memory-disk',
      priority: 'high',
      loading: 'eager',
      transition: 120,
    });
    expect(full.props.placeholder).toBeUndefined();
  });

  it('reports a picture when the thumbnail paints, when the image paints, and when the thumbnail fails', () => {
    const onPicture = jest.fn();
    const view = render(<MediaSurface content={PHOTO} onPicture={onPicture} />);
    const { preview, full } = layers(view);
    preview.props.onDisplay();
    expect(onPicture).toHaveBeenCalledTimes(1);
    preview.props.onError();
    expect(onPicture).toHaveBeenCalledTimes(2);
    full.props.onDisplay();
    expect(onPicture).toHaveBeenCalledTimes(3);
  });

  it('isolates a new source from the previous image and its pending callbacks', () => {
    const view = render(<MediaSurface content={PHOTO} />);
    const previous = layers(view).full;
    const next = {
      uri: 'https://images.test/next.jpg',
      previewUri: 'https://images.test/next-thumb.jpg',
    };
    view.rerender(<MediaSurface content={next} />);
    const { preview, full } = layers(view);
    expect(full).not.toBe(previous);
    expect(full.props.source).toEqual({ uri: next.uri });
    expect(preview.props.source).toEqual({ uri: next.previewUri });
    expect(full.props.recyclingKey).toBe(next.uri);
  });

  it('does not restart a same-source render', () => {
    const view = render(<MediaSurface content={PHOTO} />);
    const previous = layers(view);
    view.rerender(<MediaSurface content={{ ...PHOTO }} contentFit="cover" />);
    expect(layers(view).full).toBe(previous.full);
    expect(layers(view).preview).toBe(previous.preview);
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
