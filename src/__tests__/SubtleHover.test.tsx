import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SubtleHover } from '../subtle-hover';

// Default test Platform.OS is 'ios' (see __mocks__/react-native.ts), so the
// web-only overlay is suppressed unless `native` is opted in.
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('SubtleHover', () => {
  it('carries a displayName', () => {
    expect(SubtleHover.displayName).toBe('SubtleHover');
  });

  // `renderWithTheme` wraps the subject in the provider's flex View, so the
  // overlay's presence is read from that wrapper's `children` rather than the
  // root being null.
  it('renders nothing on native by default', () => {
    const tree = renderWithTheme(<SubtleHover hover />).toJSON();
    expect(tree).not.toBeNull();
    expect(tree?.children).toBeNull();
  });

  it('renders the overlay on native when opted in', () => {
    const tree = renderWithTheme(<SubtleHover hover native />).toJSON();
    expect(tree?.children).not.toBeNull();
  });

  it('accepts an opacity override and a style', () => {
    const tree = renderWithTheme(
      <SubtleHover hover native opacity={0.9} style={{ borderRadius: 12 }} />,
    ).toJSON();
    expect(tree?.children).not.toBeNull();
  });
});
