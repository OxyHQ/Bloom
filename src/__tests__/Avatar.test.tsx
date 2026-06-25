import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar } from '../avatar';
import { ImageResolverProvider, type ImageResolver } from '../image-resolver';

function renderWithProviders(
  ui: React.ReactElement,
  resolver: ImageResolver,
) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ImageResolverProvider value={resolver}>{ui}</ImageResolverProvider>
    </BloomThemeProvider>,
  );
}

describe('Avatar variant resolution', () => {
  it('passes the variant to the ImageResolver for a bare file ID source', () => {
    const resolver = jest.fn<ReturnType<ImageResolver>, Parameters<ImageResolver>>(
      (id, variant) => `https://cloud.oxy.so/${id}?variant=${variant ?? ''}`,
    );

    renderWithProviders(
      <Avatar source="file_123" variant="thumb" size={32} />,
      resolver,
    );

    expect(resolver).toHaveBeenCalledWith('file_123', 'thumb');
  });

  it('calls the resolver with undefined variant when none is supplied', () => {
    const resolver = jest.fn<ReturnType<ImageResolver>, Parameters<ImageResolver>>(
      (id) => `https://cloud.oxy.so/${id}`,
    );

    renderWithProviders(<Avatar source="file_456" size={40} />, resolver);

    expect(resolver).toHaveBeenCalledWith('file_456', undefined);
  });

  it('does NOT invoke the resolver when source is already a full URL', () => {
    const resolver = jest.fn<ReturnType<ImageResolver>, Parameters<ImageResolver>>(
      (id) => `https://cloud.oxy.so/${id}`,
    );

    renderWithProviders(
      <Avatar source="https://example.com/a.png" variant="thumb" size={40} />,
      resolver,
    );

    expect(resolver).not.toHaveBeenCalled();
  });

  it('renders the resolved variant URL as the image uri', () => {
    const resolver: ImageResolver = (id, variant) =>
      `https://cloud.oxy.so/${id}?variant=${variant ?? 'full'}`;

    const { UNSAFE_getByType } = renderWithProviders(
      <Avatar source="file_789" variant="thumb" size={32} />,
      resolver,
    );

    // The rendered RN Image (mocked) carries the resolved uri.
    const { Image } = require('react-native');
    const image = UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({
      uri: 'https://cloud.oxy.so/file_789?variant=thumb',
    });
  });
});
