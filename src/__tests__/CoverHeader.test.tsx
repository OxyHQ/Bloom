import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { CoverHeader } from '../cover-header';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';

function renderHeader(ui: React.ReactElement) {
  return render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
}

describe('CoverHeader', () => {
  it('takes the cover out of flow and starts the content `overlap` short of its bottom edge', () => {
    const { getByTestId } = renderHeader(
      <CoverHeader testID="hero" coverSource="https://example.com/cover.png" coverHeight={170} overlap={45}>
        <View testID="avatar" />
      </CoverHeader>,
    );
    const theme = buildTheme('teal', 'light');
    expect(resolvedStyle(getByTestId('hero-cover').props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 170,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundTertiary,
    });
    expect(resolvedStyle(getByTestId('hero-content').props.style)).toMatchObject({ paddingTop: 125 });
    expect(getByTestId('hero-cover-image', { includeHiddenElements: true })).toBeTruthy();
  });

  it('overlaps by layout alone: no negative margin, no transform, no zIndex', () => {
    const { getByTestId } = renderHeader(
      <CoverHeader testID="hero" coverSource="https://example.com/cover.png">
        <View testID="avatar" />
      </CoverHeader>,
    );
    for (const id of ['hero', 'hero-cover', 'hero-content']) {
      const style = resolvedStyle(getByTestId(id).props.style);
      expect(style.transform).toBeUndefined();
      expect(style.zIndex).toBeUndefined();
      expect(style.marginTop).toBeUndefined();
    }
  });

  it('paints the content over the cover because it is the later sibling', () => {
    const { getByTestId } = renderHeader(
      <CoverHeader testID="hero"><View testID="avatar" /></CoverHeader>,
    );
    const children = React.Children.toArray(getByTestId('hero').props.children) as React.ReactElement<{ testID?: string }>[];
    expect(children.map((child) => child.props.testID)).toEqual(['hero-cover', 'hero-content']);
  });

  it('defaults to a 170 band with a 45 rise, and the content paddingTop cannot be overridden', () => {
    const { getByTestId } = renderHeader(
      <CoverHeader testID="hero" contentStyle={{ paddingTop: 999, paddingHorizontal: 16 }}>
        <Text>Name</Text>
      </CoverHeader>,
    );
    expect(resolvedStyle(getByTestId('hero-cover').props.style)).toMatchObject({ height: 170 });
    expect(resolvedStyle(getByTestId('hero-content').props.style)).toMatchObject({ paddingTop: 125, paddingHorizontal: 16 });
  });

  it('clamps the overlap to the band', () => {
    const { getByTestId, rerender } = renderHeader(<CoverHeader testID="hero" coverHeight={100} overlap={300} />);
    expect(resolvedStyle(getByTestId('hero-content').props.style)).toMatchObject({ paddingTop: 0 });
    rerender(<BloomThemeProvider mode="light" colorPreset="teal"><CoverHeader testID="hero" coverHeight={100} overlap={-20} /></BloomThemeProvider>);
    expect(resolvedStyle(getByTestId('hero-content').props.style)).toMatchObject({ paddingTop: 100 });
  });

  it('draws no photo without a source, and `cover` replaces the photo', () => {
    const { queryByTestId, getByTestId, rerender } = renderHeader(<CoverHeader testID="hero" />);
    expect(queryByTestId('hero-cover-image', { includeHiddenElements: true })).toBeNull();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <CoverHeader testID="hero" coverSource="https://example.com/cover.png" cover={<View testID="custom" />} />
      </BloomThemeProvider>,
    );
    expect(getByTestId('custom')).toBeTruthy();
    expect(queryByTestId('hero-cover-image', { includeHiddenElements: true })).toBeNull();
  });
});
