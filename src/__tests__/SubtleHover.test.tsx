import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SubtleHover } from '../subtle-hover';

// Default test Platform.OS is 'ios' (see __mocks__/react-native.ts), so the
// web-only hover wash is suppressed unless the JS `active` mode opts in via
// `native`.
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

// The provider wraps the subject in ONE flex View, so `toJSON` is a single node;
// narrowing away the array/null branches lets `children` read the wash cleanly.
function renderWrapper(ui: React.ReactElement) {
  const tree = renderWithTheme(ui).toJSON();
  if (tree === null || Array.isArray(tree)) {
    throw new Error('expected a single wrapper node');
  }
  return tree;
}

describe('SubtleHover', () => {
  it('carries a displayName', () => {
    expect(SubtleHover.displayName).toBe('SubtleHover');
  });

  it('renders nothing on native in the CSS group-hover mode', () => {
    expect(renderWrapper(<SubtleHover />).children).toBeNull();
  });

  it('renders nothing on native in the JS active mode by default', () => {
    expect(renderWrapper(<SubtleHover active />).children).toBeNull();
  });

  it('renders the wash on native in the JS active mode when opted in', () => {
    expect(renderWrapper(<SubtleHover active native />).children).not.toBeNull();
  });

  it('accepts a style override in the native active mode', () => {
    expect(
      renderWrapper(<SubtleHover active native style={{ borderRadius: 12 }} />).children,
    ).not.toBeNull();
  });
});
