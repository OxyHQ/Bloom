import React from 'react';
import { Image, Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { LinkPreviewCard } from '../link-preview';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('LinkPreviewCard', () => {
  it('renders the site name, title and description', () => {
    const { getByText } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com/article"
        siteName="Example"
        title="A great article"
        description="The summary of the article."
      />,
    );
    expect(getByText('Example')).toBeTruthy();
    expect(getByText('A great article')).toBeTruthy();
    expect(getByText('The summary of the article.')).toBeTruthy();
  });

  it('falls back to the URL hostname for the title and site name', () => {
    const { getAllByText } = renderWithTheme(
      <LinkPreviewCard url="https://www.example.com/path" />,
    );
    // `www.` is stripped; the bare hostname is used for both the site name line
    // and the title fallback.
    expect(getAllByText('example.com').length).toBe(2);
  });

  it('calls the supplied onPress handler', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <LinkPreviewCard url="https://example.com" title="Pressable" onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('opens the URL via Linking when no onPress is supplied', () => {
    const openURL = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);
    const { getByLabelText } = renderWithTheme(
      <LinkPreviewCard url="https://example.com/open" title="Open me" />,
    );
    fireEvent.press(getByLabelText('Open me'));
    expect(openURL).toHaveBeenCalledWith('https://example.com/open');
    openURL.mockRestore();
  });

  it('gives the cover image a fixed height by default (coverFill omitted)', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com"
        title="Fixed"
        image="https://cdn.example.com/og.png"
      />,
    );
    // Flattened: the cover goes through `styled()`, so its `style` arrives as
    // an array with the class descriptor merged in rather than one object.
    const imageStyle = resolvedStyle(UNSAFE_getByType(Image).props.style);
    expect(imageStyle.height).toBe(160);
    expect(imageStyle.flex).toBeUndefined();
  });

  it('flexes the cover image (no fixed height) when coverFill is true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com"
        title="Fill"
        image="https://cdn.example.com/og.png"
        coverFill
        style={{ height: 180 }}
      />,
    );
    // Flattened: the cover goes through `styled()`, so its `style` arrives as
    // an array with the class descriptor merged in rather than one object.
    const imageStyle = resolvedStyle(UNSAFE_getByType(Image).props.style);
    expect(imageStyle.flex).toBe(1);
    expect(imageStyle.height).toBeUndefined();
  });
});
