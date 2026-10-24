import React from 'react';
import { render } from '@testing-library/react-native';

import { Chip, resolveChipHueColors, type ChipHue } from '../chip';
import { ACCENT_TABLE, DANGER_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { purpleChip } from '../chart-cards/ai-profile-hues';
import { reanchored, toneColor } from '../stat-cards/tones';
import { buildTheme } from '../theme/build-theme';
import { srgbToOklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import { AA_TEXT } from '../styles/surface-levels';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { resolvedStyle } from './support/rendered-style';
import { paintedFill } from './support/material-fill';
import { contrastRatio, mixColors } from '../styles/color-contrast';

const HUES: ChipHue[] = [
  'lime',
  'rose',
  'yellow',
  'cyan',
  'blue',
  'purple',
  'orange',
  'brown',
  'pink',
  'neutral',
  'gray',
  'soft',
];

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
      expect(resolveChipHueColors(theme, 'lime')).toEqual({
        background: toneColor(theme, 'lime', 200),
        foreground: toneColor(theme, 'lime', 800),
      });
      expect(resolveChipHueColors(theme, 'rose')).toEqual({
        background: toneColor(theme, 'rose', 200),
        foreground: toneColor(theme, 'rose', 800),
      });
      expect(resolveChipHueColors(theme, 'yellow')).toEqual({
        background: toneColor(theme, 'amber', 200),
        foreground: toneColor(theme, 'amber', 800),
      });
      expect(resolveChipHueColors(theme, 'cyan')).toEqual({
        background: toneColor(theme, 'sky', 200),
        foreground: toneColor(theme, 'sky', 800),
      });
      expect(resolveChipHueColors(theme, 'blue')).toEqual({
        background: accent[200],
        foreground: accent[800],
      });
    });
  });

  it('mixes the dark fills over the surface: 950 at 60% (purple 900 at 50%), with the per-hue text stop', () => {
    withTheme('dark', (theme) => {
      const { accent, neutral: n } = resolveButtonRamps(theme);
      const page = theme.colors.background;
      expect(resolveChipHueColors(theme, 'lime')).toEqual({
        background: mixColors(page, toneColor(theme, 'lime', 950), 0.6),
        foreground: toneColor(theme, 'lime', 500),
      });
      expect(resolveChipHueColors(theme, 'cyan').foreground).toBe(toneColor(theme, 'sky', 400));
      expect(resolveChipHueColors(theme, 'blue').foreground).toBe(accent[300]);
      expect(resolveChipHueColors(theme, 'purple')).toEqual(purpleChip(theme, page));
      // A named surface changes only the translucent fill.
      const onCard = resolveChipHueColors(theme, 'rose', n[800]);
      expect(onCard.background).toBe(mixColors(n[800], toneColor(theme, 'rose', 950), 0.6));
      expect(onCard.background).not.toBe(resolveChipHueColors(theme, 'rose').background);
    });
  });

  it('paints the three neutral chips from the neutral ramp and the text colour', () => {
    for (const mode of ['light', 'dark'] as const) {
      withTheme(mode, (theme) => {
        const { neutral: n } = resolveButtonRamps(theme);
        const dark = mode === 'dark';
        expect(resolveChipHueColors(theme, 'neutral')).toEqual({
          background: theme.colors.backgroundTertiary,
          foreground: theme.colors.textSecondary,
        });
        expect(resolveChipHueColors(theme, 'gray')).toEqual({
          background: theme.colors.backgroundSecondary,
          foreground: theme.colors.text,
        });
        expect(resolveChipHueColors(theme, 'soft')).toEqual({
          background: theme.colors.backgroundSecondary,
          foreground: theme.colors.textSecondary,
        });
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

describe('the select-option hues: orange, brown, pink', () => {
  const AMBER_500 = { l: 0.769, c: 0.188, h: 70.08 };
  const ORANGE_500 = { l: 0.705, c: 0.213, h: 47.604 };
  const RED_500 = { l: 0.637, c: 0.237, h: 25.331 };
  const PINK_500 = { l: 0.656, c: 0.241, h: 354.308 };
  const ramps = (theme: Theme) => ({
    orange: colorRamp(reanchored(theme.colors.warning, AMBER_500, ORANGE_500), ACCENT_TABLE),
    brown: colorRamp(
      reanchored(theme.colors.warning, AMBER_500, { ...ORANGE_500, c: ORANGE_500.c * 0.4 }),
      ACCENT_TABLE,
    ),
    pink: colorRamp(reanchored(theme.colors.negative, RED_500, PINK_500), DANGER_TABLE),
  });

  it('paints light 200 / 800 from the warning (orange, brown) and negative (pink) ramps', () => {
    withTheme('light', (theme) => {
      const r = ramps(theme);
      for (const hue of ['orange', 'brown', 'pink'] as const)
        expect(resolveChipHueColors(theme, hue)).toEqual({
          background: r[hue][200],
          foreground: r[hue][800],
        });
    });
  });

  it('mixes dark 950 at 60% over the surface, labelled 300 (orange, brown) and 500 (pink)', () => {
    withTheme('dark', (theme) => {
      const r = ramps(theme);
      const page = theme.colors.background;
      expect(resolveChipHueColors(theme, 'orange')).toEqual({
        background: mixColors(page, r.orange[950], 0.6),
        foreground: r.orange[300],
      });
      expect(resolveChipHueColors(theme, 'brown')).toEqual({
        background: mixColors(page, r.brown[950], 0.6),
        foreground: r.brown[300],
      });
      expect(resolveChipHueColors(theme, 'pink')).toEqual({
        background: mixColors(page, r.pink[950], 0.6),
        foreground: r.pink[500],
      });
    });
  });

  // OKLab distance between two pairs, fill plus label. 0.02 is about one
  // just-noticeable difference; a select option's colour must be told apart
  // from its neighbour at a glance, not under a loupe.
  const oklab = (color: string) => {
    const { l, c, h } = srgbToOklch(parseRgba(color)!);
    const rad = (h * Math.PI) / 180;
    return [l, c * Math.cos(rad), c * Math.sin(rad)] as const;
  };
  const distance = (a: string, b: string) => {
    const [x, y] = [oklab(a), oklab(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };
  const pairDistance = (
    a: { background: string; foreground: string },
    b: { background: string; foreground: string },
  ) => distance(a.background, b.background) + distance(a.foreground, b.foreground);

  it('reads at AA and stays apart from its neighbours on every preset, in both modes', () => {
    // `blue` is left out on purpose: it is the BRAND ramp, so on an orange or a
    // pink preset it is that colour by design.
    const others: ChipHue[] = HUES.filter((hue) => hue !== 'blue');
    for (const preset of ['blue', 'teal', 'orange', 'pink', 'brown', 'red', 'mono'] as const) {
      for (const mode of ['light', 'dark'] as const) {
        const theme = buildTheme(preset, mode);
        for (const hue of ['orange', 'brown', 'pink'] as const) {
          const pair = resolveChipHueColors(theme, hue);
          expect(contrastRatio(pair.background, pair.foreground)).toBeGreaterThanOrEqual(AA_TEXT);
          for (const other of others) {
            if (other === hue) continue;
            const label = `${preset} ${mode} ${hue} vs ${other}`;
            expect([label, pairDistance(pair, resolveChipHueColors(theme, other)) > 0.04]).toEqual([
              label,
              true,
            ]);
          }
        }
      }
    }
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
    const { getByTestId, getByText, theme } = renderChip({
      hue: 'purple',
      tone: 'danger',
      appearance: 'outline',
      children: 'Design',
    });
    const expected = resolveChipHueColors(theme, 'purple');
    const box = resolvedStyle(getByTestId('chip').props.style);
    expect(paintedFill(getByTestId('chip'))).toBe(expected.background);
    expect(box.borderWidth).toBe(0);
    expect(resolvedStyle(getByText('Design').props.style).color).toBe(expected.foreground);
  });

  it('pre-mixes a dark fill over `surface`', () => {
    const { getByTestId, theme } = renderChip(
      { hue: 'lime', surface: 'rgb(10, 20, 30)', children: 'Shipped' },
      'dark',
    );
    expect(paintedFill(getByTestId('chip'))).toBe(
      resolveChipHueColors(theme, 'lime', 'rgb(10, 20, 30)').background,
    );
  });

  it('still lets `selected` promote a pressable chip to the brand tone', () => {
    const plain = renderChip({ hue: 'lime', children: 'Music', onPress: () => {} });
    const selected = renderChip({
      hue: 'lime',
      children: 'Music',
      onPress: () => {},
      checked: true,
    });
    const plainBg = paintedFill(plain.getByTestId('chip'));
    const selectedBg = paintedFill(selected.getByTestId('chip'));
    expect(plainBg).toBe(resolveChipHueColors(plain.theme, 'lime').background);
    expect(selectedBg).not.toBe(plainBg);
  });

  it('leaves a chip without `hue` on the accent recipe', () => {
    const { getByTestId, theme } = renderChip({
      tone: 'success',
      appearance: 'subtle',
      children: 'Live',
    });
    expect(resolvedStyle(getByTestId('chip').props.style).backgroundColor).not.toBe(
      resolveChipHueColors(theme, 'lime').background,
    );
  });
});
