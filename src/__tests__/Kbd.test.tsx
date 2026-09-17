import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Kbd } from '../kbd';

/** Deep-merge a style prop (jest's react-native mock does not flatten). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flat(style: any): Record<string, any> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style ?? {};
}

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('Kbd', () => {
  it('renders the key label', () => {
    const { getByText } = renderWithTheme(<Kbd>K</Kbd>);
    expect(getByText('K')).toBeTruthy();
  });

  it('renders both sizes', () => {
    const sm = renderWithTheme(<Kbd size="sm">Esc</Kbd>);
    expect(sm.getByText('Esc')).toBeTruthy();
    const md = renderWithTheme(<Kbd size="md">⌘</Kbd>);
    expect(md.getByText('⌘')).toBeTruthy();
  });
});

describe('Kbd — geometry', () => {
  it('is a full pill with 4 × 2 padding and caption-1-semibold at md', () => {
    const { getByTestId, getByText } = renderWithTheme(<Kbd testID="k">K</Kbd>);
    const box = flat(getByTestId('k').props.style);
    expect(box).toMatchObject({ paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2, borderRadius: 9999 });
    expect(box.borderWidth).toBeUndefined();
    expect(flat(getByText('K').props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      letterSpacing: 0,
    });
  });

  it('steps down to caption-2 with 1px vertical padding at sm', () => {
    const { getByTestId, getByText } = renderWithTheme(<Kbd testID="k" size="sm">Esc</Kbd>);
    expect(flat(getByTestId('k').props.style)).toMatchObject({ paddingTop: 1, paddingBottom: 1 });
    expect(flat(getByText('Esc').props.style)).toMatchObject({ fontSize: 11, lineHeight: 15 });
  });
});
