/**
 * The cases the native theme ports (Swift `BloomTheme`, Kotlin `bloom-ui`) must reproduce byte for
 * byte, computed by the TypeScript theme itself. `scripts/generate-theme-native-golden.ts`
 * bundles this file and runs it under node, so every double is V8's.
 *
 * Each fixture is JSON Lines: `{"id":…,"input":{…},"output":…}`, `output` last and written by
 * `JSON.stringify`, so a port compares the text after `,"output":` with its own serialisation.
 * The `kind` of an input names the TypeScript function it exercises.
 *
 * Alongside these, the ports reproduce the two existing goldens unchanged:
 * `fixtures/color-engine-golden.json` and `__fixtures__/golden-resolved-tokens.json`.
 */
import { buildPresetPalette, buildTheme } from '../../src/theme/build-theme';
import { buildThemeFromSeed } from '../../src/theme/build-theme-from-seed';
import { createChartColors, resolveThemeChartColors } from '../../src/theme/chart-colors';
import {
  argbFromHex,
  hexFromArgb,
  quantizeImage,
  seedsFromImagePixels,
  seedsFromRgbBytes,
} from '../../src/theme/color-engine';
import { Hct } from '../../src/theme/color-engine/hct';
import { TonalPalette } from '../../src/theme/color-engine/tonal-palette';
import { deriveAccentHues, isColourlessSeed, policyBackground } from '../../src/theme/color-policy';
import {
  APP_COLOR_NAMES,
  APP_COLOR_PRESETS,
  resolveProfileColor,
} from '../../src/theme/color-presets';
import { applyScopeTokens } from '../../src/theme/color-scope/resolve-scope';
import { buildSeedScopeVars } from '../../src/theme/color-scope/seed-scope';
import { buildScopeVars } from '../../src/theme/color-scope/style-builder';
import { oklchToRgbString, oklchToSrgb, srgbToOklch } from '../../src/theme/color-space';
import { parseRgba, withAlpha } from '../../src/theme/color-utils';
import { resolveAccentColors } from '../../src/theme/accent-colors';
import { getPresetBackground } from '../../src/theme/preset-vars';
import { pressedSurface } from '../../src/theme/press-colors';
import { getResolvedTokens, hslToSrgb } from '../../src/theme/token-registry';
import type { ThemeColors } from '../../src/theme/types';
import { labelAlpha } from './source-constants';

type Line = { id: string; input: Record<string, unknown>; output: unknown };

const MODES = ['light', 'dark'] as const;
const CONTRASTS = [-1, -0.5, 0, 0.5, 1] as const;
const VARIANTS = ['vibrant', 'expressive', 'tonalSpot', 'neutral', 'monochrome'] as const;

/**
 * Seeds at the edges of what the engine handles: greys (the monochrome switch at chroma 6),
 * near-black and near-white, the sRGB primaries and secondaries, the yellow-greens the dislike
 * analyzer moves, uppercase hex, and a three-digit hex (`argbFromHex` reads it as 0x00000abc).
 */
export const EDGE_SEEDS = [
  '#808080',
  '#000000',
  '#ffffff',
  '#010101',
  '#fefefe',
  '#0a0a0a',
  '#f5f5f5',
  '#7f7f80',
  '#3a3a3c',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#00ffff',
  '#ff00ff',
  '#123456',
  '#ABCDEF',
  '#C46EDE',
  '#556b2f',
  '#b5a642',
  '#8b4513',
  '#fdf6e3',
  '#9FFB50',
  '#abc',
] as const;

const without = (vars: Record<string, string>) =>
  Object.fromEntries(Object.entries(vars).filter(([key]) => !key.startsWith('--color-')));

function seedLines(): Line[] {
  const lines: Line[] = [];
  const add = (input: Record<string, unknown>, withColors: boolean) => {
    const options = {
      seed: input.seed as string,
      mode: input.mode as 'light' | 'dark',
      variant: input.variant as never,
      contrastLevel: input.contrastLevel as number | undefined,
      secondarySeed: input.secondarySeed as string | undefined,
      tertiarySeed: input.tertiarySeed as string | undefined,
    };
    const output: Record<string, unknown> = { tokens: without(buildSeedScopeVars(options)) };
    if (withColors) {
      const theme = buildThemeFromSeed(
        options.seed,
        options.mode,
        options.variant,
        options.contrastLevel,
        {
          secondarySeed: options.secondarySeed,
          tertiarySeed: options.tertiarySeed,
        },
      );
      output.colors = theme.colors;
      output.chartColors = theme.chartColors;
    }
    lines.push({
      id: `seed/${lines.length}`,
      input: { kind: 'buildSeedScopeVars', ...input },
      output,
    });
  };
  // Every preset's own recipe at the far ends of the contrast curve (0 is the preset path,
  // which the frozen oracle already holds; the seed-scope parity suite ties the two).
  // High contrast for every preset; low contrast for every fourth.
  for (const [index, name] of APP_COLOR_NAMES.entries()) {
    const p = APP_COLOR_PRESETS[name];
    for (const mode of MODES) {
      for (const contrastLevel of index % 4 === 0 ? [-1, 1] : [1]) {
        add(
          {
            seed: p.hex,
            mode,
            variant: p.variant,
            contrastLevel,
            secondarySeed: p.secondaryHex,
            tertiarySeed: p.tertiaryHex,
          },
          false,
        );
      }
    }
  }
  for (const [index, seed] of EDGE_SEEDS.entries()) {
    for (const mode of MODES) {
      for (const contrastLevel of CONTRASTS)
        add({ seed, mode, contrastLevel }, contrastLevel === 0);
      // Every variant for every other edge seed.
      if (index % 2 === 0) for (const variant of VARIANTS) add({ seed, mode, variant }, false);
    }
  }
  // Pinned accents, the artwork path: a seed with its second and third colours.
  const pins: Array<[string, string | undefined, string | undefined]> = [
    ['#1d9bf0', '#ffd400', undefined],
    ['#1d9bf0', undefined, '#ef4444'],
    ['#10b981', '#b866ff', '#ff8800'],
    ['#808080', '#ff0000', '#00aaff'],
    ['#000000', undefined, '#9ffb50'],
    ['#ffd400', '#005c67', '#f91880'],
  ];
  for (const [seed, secondarySeed, tertiarySeed] of pins) {
    for (const mode of MODES) {
      for (const contrastLevel of [0, 1])
        add({ seed, mode, contrastLevel, secondarySeed, tertiarySeed }, true);
    }
  }
  return lines;
}

function presetLines(): Line[] {
  const lines: Line[] = [];
  // Every preset's JS theme (the tokens themselves are the frozen oracle).
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of MODES) {
      const theme = buildTheme(preset, mode);
      lines.push({
        id: `buildTheme/${preset}/${mode}`,
        input: { kind: 'buildTheme', preset, mode },
        output: { colors: theme.colors, chartColors: theme.chartColors },
      });
    }
  }
  // App-wide accent pins and neutral surfaces on a sample of presets.
  const accentSets: Array<Record<string, string>> = [
    { secondaryHex: '#ff8800' },
    { tertiaryHex: '#00aa55' },
    { secondaryHex: '#ffd400', tertiaryHex: '#1d9bf0' },
    { surfaces: 'neutral' },
    { secondaryHex: '#b866ff', tertiaryHex: '#ef4444', surfaces: 'neutral' },
  ];
  for (const preset of ['oxy', 'yellow', 'mono', 'indigo-ember', 'gemies'] as const) {
    for (const mode of MODES) {
      for (const accents of accentSets) {
        const theme = buildTheme(preset, mode, false, accents as never);
        lines.push({
          id: `accents/${preset}/${mode}/${lines.length}`,
          input: { kind: 'buildTheme', preset, mode, accents },
          output: {
            tokens: getResolvedTokens(preset, mode, accents as never),
            colors: theme.colors,
            chartColors: theme.chartColors,
          },
        });
      }
    }
  }
  // The alias layer a scope publishes, in full.
  for (const preset of ['oxy', 'blue', 'mono', 'pumpkin'] as const) {
    for (const mode of MODES) {
      lines.push({
        id: `buildScopeVars/${preset}/${mode}`,
        input: { kind: 'buildScopeVars', preset, mode },
        output: buildScopeVars(preset, mode),
      });
    }
  }
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of MODES) {
      lines.push({
        id: `getPresetBackground/${preset}/${mode}`,
        input: { kind: 'getPresetBackground', preset, mode },
        output: getPresetBackground(preset, mode),
      });
    }
  }
  // Exact scope tokens over a preset palette (`applyScopeTokens`).
  const overrides: Array<Record<string, string>> = [
    { primary: 'rgb(10 20 30)' },
    { 'muted-foreground': '#123456' },
    { 'muted-foreground': 'rgb(1 2 3)', 'faint-foreground': 'rgb(4 5 6)' },
    { 'chart-3': 'rgb(200 100 50)', background: 'rgba(0, 0, 0, 0.5)' },
    { error: '#ff0000', card: 'rgb(255 255 255)', border: 'rgba(0, 0, 0, 0.2)' },
  ];
  for (const preset of ['teal', 'oxy'] as const) {
    for (const mode of MODES) {
      for (const tokens of overrides) {
        const palette = applyScopeTokens(buildPresetPalette(preset, mode), tokens as never);
        lines.push({
          id: `applyScopeTokens/${preset}/${mode}/${lines.length}`,
          input: { kind: 'applyScopeTokens', preset, mode, tokens },
          output: {
            vars: palette.vars,
            colors: palette.theme.colors,
            chartColors: palette.theme.chartColors,
          },
        });
      }
    }
  }
  return lines;
}

/** A deterministic test image: `width × height` RGB bytes from an LCG and a few shapes. */
function syntheticImage(
  seed: number,
  width: number,
  height: number,
  palette: number[][],
): Uint8Array {
  let s = seed;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  const bytes = new Uint8Array(width * height * 3);
  const blobs = palette.map((rgb) => ({
    rgb,
    x: rnd() * width,
    y: rnd() * height,
    r: 4 + rnd() * width * 0.4,
  }));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rgb = palette[0] as number[];
      for (const blob of blobs)
        if ((x - blob.x) ** 2 + (y - blob.y) ** 2 < blob.r ** 2) rgb = blob.rgb;
      const i = (y * width + x) * 3;
      for (let c = 0; c < 3; c++) {
        const noise = Math.floor(rnd() * 25) - 12;
        bytes[i + c] = Math.min(255, Math.max(0, (rgb[c] as number) + noise));
      }
    }
  }
  return bytes;
}

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

function ambientLines(): Line[] {
  const lines: Line[] = [];
  const images: Array<[string, number, number[][]]> = [
    [
      'sunset',
      7,
      [
        [250, 120, 40],
        [120, 40, 140],
        [255, 210, 90],
        [30, 20, 60],
      ],
    ],
    [
      'forest',
      11,
      [
        [20, 60, 30],
        [90, 140, 60],
        [200, 220, 170],
        [60, 40, 20],
      ],
    ],
    [
      'ocean',
      23,
      [
        [10, 40, 90],
        [30, 140, 200],
        [230, 240, 250],
        [0, 90, 110],
      ],
    ],
    [
      'greys',
      31,
      [
        [128, 128, 128],
        [40, 40, 40],
        [220, 220, 220],
      ],
    ],
    [
      'neon',
      43,
      [
        [255, 0, 128],
        [0, 255, 200],
        [20, 0, 40],
        [255, 240, 0],
      ],
    ],
    [
      'skin',
      59,
      [
        [230, 190, 160],
        [120, 80, 60],
        [250, 235, 220],
        [70, 50, 40],
      ],
    ],
  ];
  for (const [name, seed, palette] of images) {
    const bytes = syntheticImage(seed, 32, 32, palette);
    const seeds = seedsFromRgbBytes(bytes, 3).map(hexFromArgb);
    const pixels: number[] = [];
    for (let i = 0; i + 3 <= bytes.length; i += 3) {
      pixels.push(
        ((255 << 24) |
          ((bytes[i] as number) << 16) |
          ((bytes[i + 1] as number) << 8) |
          (bytes[i + 2] as number)) >>>
          0,
      );
    }
    const quantized = [...quantizeImage(pixels).entries()].map(([argb, population]) => [
      hexFromArgb(argb),
      population,
    ]);
    const output: Record<string, unknown> = { quantized, seeds };
    const [top, second, third] = seeds;
    if (top !== undefined) {
      for (const mode of MODES) {
        const theme = buildThemeFromSeed(top, mode, undefined, undefined, {
          secondarySeed: second,
          tertiarySeed: third,
        });
        output[mode] = {
          tokens: without(
            buildSeedScopeVars({ seed: top, mode, secondarySeed: second, tertiarySeed: third }),
          ),
          colors: theme.colors,
          chartColors: theme.chartColors,
        };
      }
    }
    lines.push({
      id: `ambient/${name}`,
      input: { kind: 'ambientFromImage', channels: 3, rgb: hex(bytes) },
      output,
    });
  }
  // RGBA bytes (the alpha channel is skipped), and ARGB pixels with transparent ones dropped.
  const rgba = syntheticImage(71, 16, 16, [
    [200, 30, 30],
    [30, 30, 200],
    [240, 240, 240],
  ]);
  const four = new Uint8Array((rgba.length / 3) * 4);
  for (let i = 0, j = 0; i < rgba.length; i += 3, j += 4) {
    four.set(
      [
        rgba[i] as number,
        rgba[i + 1] as number,
        rgba[i + 2] as number,
        (i / 3) % 2 === 0 ? 255 : 0,
      ],
      j,
    );
  }
  lines.push({
    id: 'seedsFromRgbBytes/rgba',
    input: { kind: 'seedsFromRgbBytes', channels: 4, rgb: hex(four) },
    output: seedsFromRgbBytes(four, 4).map(hexFromArgb),
  });
  const argb: number[] = [];
  for (let i = 0; i < rgba.length; i += 3) {
    const alpha = (i / 3) % 5 === 0 ? 0x80 : 0xff;
    argb.push(
      ((alpha << 24) |
        ((rgba[i] as number) << 16) |
        ((rgba[i + 1] as number) << 8) |
        (rgba[i + 2] as number)) >>>
        0,
    );
  }
  lines.push({
    id: 'seedsFromImagePixels/argb',
    input: {
      kind: 'seedsFromImagePixels',
      pixels: argb.map((p) => p.toString(16).padStart(8, '0')).join(''),
    },
    output: {
      seeds: seedsFromImagePixels(argb).map(hexFromArgb),
      desired1: seedsFromImagePixels(argb, { desired: 1 }).map(hexFromArgb),
      unfiltered: seedsFromImagePixels(argb, { filter: false, desired: 6 }).map(hexFromArgb),
    },
  });
  lines.push({
    id: 'seedsFromImagePixels/empty',
    input: { kind: 'seedsFromImagePixels', pixels: '' },
    output: {
      seeds: seedsFromImagePixels([]).map(hexFromArgb),
      desired1: seedsFromImagePixels([], { desired: 1 }).map(hexFromArgb),
      unfiltered: seedsFromImagePixels([], { filter: false, desired: 6 }).map(hexFromArgb),
    },
  });
  return lines;
}

function miscLines(repoRoot: string): Line[] {
  const lines: Line[] = [];
  const alpha = labelAlpha(repoRoot);
  const add = (kind: string, input: Record<string, unknown>, output: unknown) =>
    lines.push({ id: `${kind}/${lines.length}`, input: { kind, ...input }, output });

  // The engine's own doubles, printed with `String(number)`: a last-bit difference shows here.
  const seeds = [
    ...new Set([...EDGE_SEEDS, ...APP_COLOR_NAMES.map((n) => APP_COLOR_PRESETS[n].hex)]),
  ];
  for (const seed of seeds) {
    const hct = Hct.fromInt(argbFromHex(seed));
    add(
      'hct',
      { seed },
      { hue: hct.hue, chroma: hct.chroma, tone: hct.tone, colourless: isColourlessSeed(seed) },
    );
  }
  const solved: string[] = [];
  for (let h = 0; h < 360; h += 7) {
    for (const c of [0, 10, 40, 80, 120, 200]) {
      for (const t of [0, 5, 25, 49.5, 50, 75, 95, 100])
        solved.push(hexFromArgb(Hct.from(h, c, t).toInt()));
    }
  }
  add(
    'hctSolve',
    {
      hues: 'h=0..359 step 7',
      chromas: [0, 10, 40, 80, 120, 200],
      tones: [0, 5, 25, 49.5, 50, 75, 95, 100],
    },
    solved,
  );
  const keys: number[] = [];
  for (let h = 0; h < 360; h += 15)
    for (const c of [4, 16, 36, 48, 84, 200])
      keys.push(TonalPalette.fromHueAndChroma(h, c).keyColor.tone);
  add('keyColorTone', { hues: 'h=0..345 step 15', chromas: [4, 16, 36, 48, 84, 200] }, keys);
  for (let hue = 0; hue < 360; hue += 1) add('deriveAccentHues', { hue }, deriveAccentHues(hue));
  for (const seed of seeds)
    add(
      'deriveAccentHues',
      { hue: Hct.fromInt(argbFromHex(seed)).hue },
      deriveAccentHues(Hct.fromInt(argbFromHex(seed)).hue),
    );
  for (const seed of EDGE_SEEDS) {
    for (const mode of MODES) {
      for (const neutral of [false, true])
        add(
          'policyBackground',
          { seed, isDark: mode === 'dark', neutral },
          policyBackground(seed, mode === 'dark', neutral),
        );
    }
  }
  for (const hue of [0, 33.3, 120, 275.5]) {
    for (const isDark of [false, true]) {
      for (const monochrome of [false, true])
        add(
          'createChartColors',
          { hue, isDark, monochrome },
          createChartColors(hue, isDark, monochrome),
        );
    }
  }

  for (const triple of [
    '0 0% 0%',
    '210 40% 98%',
    '222.2 84% 4.9%',
    '-30 50% 50%',
    '400deg 100% 50%',
    '120 100% 25% / 0.5',
    '0 0% 100% / 50%',
    '45 93.5% 47.5% / x',
    '1e1 10% 10%',
  ]) {
    add('hslToSrgb', { triple }, hslToSrgb(triple));
  }
  for (const color of [
    'rgb(1 2 3)',
    'rgb(1, 2, 3)',
    'rgba(10, 20, 30, 0.13)',
    'rgb(10 20 30 / 0.5)',
    'rgb(10 20 30 / 40%)',
    '#abc',
    '#AABBCC',
    '#12345',
    'transparent',
    ' rgb( 7 8 9 ) ',
    'RGB(1 2 3)',
    'rgb(1.5 2e1 .5)',
    'rgb(1 2)',
    'rgb(a b c)',
    'hsl(1 2 3)',
    '#zz0000',
  ]) {
    add('parseRgba', { color }, parseRgba(color));
    add('withAlpha', { color, alpha: 0.42 }, withAlpha(color, 0.42));
  }
  for (const [l, c, h] of [
    [0.5, 0.1, 30],
    [0.7, 0.3, 140],
    [0.2, 0.05, 260],
    [0.95, 0.2, 90],
    [0.6, 0.37, 330],
    [0, 0, 0],
    [1, 0, 0],
  ]) {
    const rgb = oklchToSrgb({ l: l as number, c: c as number, h: h as number });
    add(
      'oklch',
      { l, c, h },
      {
        rgb,
        back: srgbToOklch(rgb),
        string: oklchToRgbString({ l: l as number, c: c as number, h: h as number }),
      },
    );
  }
  for (const value of [
    'teal',
    ' Amber ',
    'MONO',
    '#ABCDEF',
    '#abc',
    '#abcd',
    'blue-ish',
    '',
    'forest-fire',
    '#1d9bf0',
  ]) {
    add('resolveProfileColor', { value }, resolveProfileColor(value) ?? null);
  }

  // Everything a component derives from a theme's colours, for every preset and mode.
  for (const preset of APP_COLOR_NAMES) {
    for (const mode of MODES) {
      const colors = buildTheme(preset, mode).colors as ThemeColors;
      const accents: Record<string, unknown> = {};
      for (const tone of [
        'default',
        'primary',
        'vivid',
        'secondary',
        'tertiary',
        'success',
        'warning',
        'error',
        'info',
      ] as const) {
        for (const fill of ['solid', 'subtle', 'outlined'] as const)
          accents[`${tone}/${fill}`] = resolveAccentColors(colors, tone, fill);
      }
      const ink = colors.text;
      // `resolveLabelColors` (label-colors.ts) is `withAlpha(ink, LABEL_ALPHA.x)`; the module also
      // defines a hook whose imports are the whole provider, so its alphas are read from source.
      const labels = {
        label: ink,
        secondary: withAlpha(ink, alpha.secondary),
        tertiary: withAlpha(ink, alpha.tertiary),
        quaternary: withAlpha(ink, alpha.quaternary),
      };
      const presses = [
        pressedSurface(colors, colors.primary, colors.primaryForeground),
        pressedSurface(colors, colors.card, colors.text),
        pressedSurface(colors, colors.successSubtle, colors.successSubtleForeground),
        pressedSurface(colors, 'transparent', colors.text),
        pressedSurface(colors, 'rgba(10, 20, 30, 0.37)', '#ffffff'),
        pressedSurface(colors, colors.primary, 'not-a-colour'),
      ];
      const chart = resolveThemeChartColors({
        ...buildTheme(preset, mode),
        chartColors: undefined,
      });
      add('derived', { preset, mode }, { accents, labels, presses, chart });
    }
  }
  return lines;
}

export function nativeGoldenFiles(repoRoot: string): Record<string, string> {
  const render = (lines: Line[]) =>
    `${lines.map((line) => `{"id":${JSON.stringify(line.id)},"input":${JSON.stringify(line.input)},"output":${JSON.stringify(line.output)}}`).join('\n')}\n`;
  return {
    'native-seed-golden.jsonl': render(seedLines()),
    'native-preset-golden.jsonl': render(presetLines()),
    'native-ambient-golden.jsonl': render(ambientLines()),
    'native-misc-golden.jsonl': render(miscLines(repoRoot)),
  };
}
