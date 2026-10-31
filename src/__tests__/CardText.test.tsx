import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Card, CardDescription, CardTitle } from '../card';

function renderInCard(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="dark" colorPreset="oxy">
      <Card tone="accent" appearance="solid">
        {ui}
      </Card>
    </BloomThemeProvider>,
  );
}

const styleOf = (view: ReturnType<typeof render>, text: string) =>
  StyleSheet.flatten(view.getByText(text).props.style) as Record<string, unknown>;

describe('CardTitle and CardDescription className', () => {
  it('font-display sets the text in BlomusModernus and keeps the colour paired with the card', () => {
    const plain = renderInCard(<CardTitle>Plain</CardTitle>);
    const plainStyle = styleOf(plain, 'Plain');
    plain.unmount();

    const display = renderInCard(<CardTitle className="font-display">Display</CardTitle>);
    const displayStyle = styleOf(display, 'Display');
    // A card title is 600, which draws BlomusModernus' Bold cut, as the web's font matching does.
    expect(displayStyle.fontFamily).toBe('BlomusModernus-Bold');
    expect(displayStyle.color).toBe(plainStyle.color);
    expect(displayStyle.fontSize).toBe(17);
  });

  it('a size utility replaces only the default size, never the paired colour', () => {
    const plain = renderInCard(<CardDescription>Plain</CardDescription>);
    const plainColor = styleOf(plain, 'Plain').color;
    plain.unmount();

    const sized = renderInCard(<CardDescription className="text-xl">Sized</CardDescription>);
    const sizedStyle = styleOf(sized, 'Sized');
    expect(sizedStyle.fontSize).not.toBe(14);
    expect(sizedStyle.color).toBe(plainColor);
  });
});
