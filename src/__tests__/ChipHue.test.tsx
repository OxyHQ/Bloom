import React from 'react';
import { render } from '@testing-library/react-native';

import { Chip, resolveChipHueColors, type ChipHue } from '../chip';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { purpleChip } from '../chart-cards/ai-profile-hues';
import { toneColor } from '../stat-cards/tones';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';

const HUES: ChipHue[] = ['lime', 'rose', 'yellow', 'cyan', 'blue', 'purple', 'neutral', 'gray', 'soft'];

function withTheme(mode: 'light' | 'dark', read: (theme: Theme) => void) {
  function Probe() {
    read(useTheme());
    return null;
  }
  render(
    <BloomThemeProvider mode={mode} colorPreset="blue">
      <Probe />
    </BloomThemeProvider>,
  );
}

describe('resolveChipHueColors', () => {
  it("maps light status pairs to the 200 fill and 800 text of each hue's theme ramp", () => {
    withTheme('light', (theme) => {
      const { accent } = resolveButtonRamps(theme);
      expect(resolveChipHueColors(theme, 'lime')).toEqual({ background: toneColor(theme, 'lime', 200), foreground: toneColor(theme, 'lime', 800) });
      expect(resolveChipHueColors(theme, 'rose')).toEqual({ background: toneColor(theme, 'rose', 200), foreground: toneColor(theme, 'rose', 800) });
      expect(resolveChipHueColors(theme, 'yellow')).toEqual({ background: toneColor(theme, 'amber', 200), foreground: toneColor(theme, 'amber', 800) });
      expect(resolveChipHueColors(theme, 'cyan')).toEqual({ background: toneColor(theme, 'sky', 200), foreground: toneColor(theme, 'sky', 800) });
      expect(resolveChipHueColors(theme, 'blue')).toEqual({ background: accent[200], foreground: accent[800] });
    });
  });

  it('mixes the dark fills over the surface: 950 at 60% (purple 900 at 50%), with the per-hue text stop', () => {
    withTheme('dark', (theme) => {
      const { accent, neutral: n } = resolveButtonRamps(theme);
      const page = mixColor(n[900], n[950], 0.4);
      expect(resolveChipHueColors(theme, 'lime')).toEqual({
        background: mixColor(page, toneColor(theme, 'lime', 950), 0.6),
        foreground: toneColor(theme, 'lime', 500),
      });
      expect(resolveChipHueColors(theme, 'cyan').foreground).toBe(toneColor(theme, 'sky', 400));
      expect(resolveChipHueColors(theme, 'blue').foreground).toBe(accent[300]);
      expect(resolveChipHueColors(theme, 'purple')).toEqual(purpleChip(theme, page));
      // A named surface changes only the translucent fill.
      const onCard = resolveChipHueColors(theme, 'rose', n[800]);
      expect(onCard.background).toBe(mixColor(n[800], toneColor(theme, 'rose', 950), 0.6));
      expect(onCard.background).not.toBe(resolveChipHueColors(theme, 'rose').background);
    });
  });

  it('paints the three neutral chips from the neutral ramp and the text colour', () => {
    for (const mode of ['light', 'dark'] as const) {
      withTheme(mode, (theme) => {
        const { neutral: n } = resolveButtonRamps(theme);
        const dark = mode === 'dark';
        expect(resolveChipHueColors(theme, 'neutral')).toEqual({ background: dark ? n[800] : n[200], foreground: n[500] });
        expect(resolveChipHueColors(theme, 'gray')).toEqual({ background: dark ? n[900] : n[100], foreground: theme.colors.text });
        expect(resolveChipHueColors(theme, 'soft')).toEqual({ background: dark ? n[900] : n[100], foreground: n[500] });
      });
    }
  });

  it('gives every hue a distinct light pair', () => {
    withTheme('light', (theme) => {
      const pairs = HUES.map((hue) => JSON.stringify(resolveChipHueColors(theme, hue)));
      expect(new Set(pairs).size).toBe(HUES.length);
    });
  });
});

describe('Chip hue', () => {
  function renderChip(props: React.ComponentProps<typeof Chip>, mode: 'light' | 'dark' = 'light') {
    let theme!: Theme;
    function Probe() {
      theme = useTheme();
      return null;
    }
    const utils = render(
      <BloomThemeProvider mode={mode} colorPreset="blue">
        <Probe />
        <Chip testID="chip" {...props} />
      </BloomThemeProvider>,
    );
    return { ...utils, theme };
  }

  it('paints the fill and the label from the hue, over `color` and `variant`, with no border', () => {
    const { getByTestId, getByText, theme } = renderChip({ hue: 'purple', color: 'error', variant: 'outlined', children: 'Design' });
    const expected = resolveChipHueColors(theme, 'purple');
    const box = resolvedStyle(getByTestId('chip').props.style);
    expect(box.backgroundColor).toBe(expected.background);
    expect(box.borderWidth).toBe(0);
    expect(resolvedStyle(getByText('Design').props.style).color).toBe(expected.foreground);
  });

  it('pre-mixes a dark fill over `surface`', () => {
    const { getByTestId, theme } = renderChip({ hue: 'lime', surface: 'rgb(10, 20, 30)', children: 'Shipped' }, 'dark');
    expect(resolvedStyle(getByTestId('chip').props.style).backgroundColor).toBe(
      resolveChipHueColors(theme, 'lime', 'rgb(10, 20, 30)').background,
    );
  });

  it('still lets `selected` promote a pressable chip to the brand tone', () => {
    const plain = renderChip({ hue: 'lime', children: 'Music', onPress: () => {} });
    const selected = renderChip({ hue: 'lime', children: 'Music', onPress: () => {}, selected: true });
    const plainBg = resolvedStyle(plain.getByTestId('chip').props.style).backgroundColor;
    const selectedBg = resolvedStyle(selected.getByTestId('chip').props.style).backgroundColor;
    expect(plainBg).toBe(resolveChipHueColors(plain.theme, 'lime').background);
    expect(selectedBg).not.toBe(plainBg);
  });

  it('leaves a chip without `hue` on the accent recipe', () => {
    const { getByTestId, theme } = renderChip({ color: 'success', variant: 'subtle', children: 'Live' });
    expect(resolvedStyle(getByTestId('chip').props.style).backgroundColor).not.toBe(resolveChipHueColors(theme, 'lime').background);
  });
});
