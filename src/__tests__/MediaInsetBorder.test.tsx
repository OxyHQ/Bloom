import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { MediaInsetBorder } from '../media-inset-border';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('MediaInsetBorder', () => {
  it('carries a displayName', () => {
    expect(MediaInsetBorder.displayName).toBe('MediaInsetBorder');
  });

  it('renders the softened border by default', () => {
    const { UNSAFE_root } = renderWithTheme(<MediaInsetBorder />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders the opaque variant', () => {
    const { UNSAFE_root } = renderWithTheme(<MediaInsetBorder opaque />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it('accepts a style override for borderRadius', () => {
    const { UNSAFE_root } = renderWithTheme(
      <MediaInsetBorder style={{ borderRadius: 999 }} />,
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
