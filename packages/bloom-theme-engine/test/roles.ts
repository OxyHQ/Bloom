// The role goldens: src/theme/__tests__/fixtures/color-roles-golden.txt
// (scripts/generate-color-roles-golden.ts: seed × variant × contrast × light and dark, and pinned
// accents) and the frozen Material reference, fixtures/color-engine-golden.json (5 presets × 4
// variants × light and dark). Both are colours, held exactly.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(__dirname, '..', '..', '..', 'src', 'theme', '__tests__', 'fixtures');

export interface RoleGoldenLine {
  seed: string;
  variant: string;
  isDark: boolean;
  contrastLevel: number;
  secondarySeed?: string;
  tertiarySeed?: string;
  colours: string[];
}

export function roleGolden(): { names: string[]; lines: RoleGoldenLine[] } {
  const [header, ...rest] = readFileSync(join(FIXTURES, 'color-roles-golden.txt'), 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '');
  const names = (header as string).replace(/^# /, '').split(' ');
  const lines = rest.map((line) => {
    const [seed, variant, mode, contrast, secondary, tertiary, ...colours] = line.split(' ');
    return {
      seed: seed as string,
      variant: variant as string,
      isDark: mode === 'dark',
      contrastLevel: Number(contrast),
      secondarySeed: secondary === '-' ? undefined : secondary,
      tertiarySeed: tertiary === '-' ? undefined : tertiary,
      colours,
    };
  });
  return { names, lines };
}

export const PRESET_SEEDS: Record<string, string> = {
  oxy: '#C46EDE',
  blue: '#1D9BF0',
  green: '#10B981',
  pink: '#EC4899',
  faircoin: '#9FFB50',
};

export function materialGolden(): Record<string, Record<string, string>> {
  return JSON.parse(readFileSync(join(FIXTURES, 'color-engine-golden.json'), 'utf8'));
}

/** `rgb(r g b)` (the engine's output) as `#rrggbb` (the goldens'). */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+) (\d+) (\d+)\)/);
  if (!match) throw new Error(`expected rgb(r g b), got ${rgb}`);
  return `#${[1, 2, 3].map((i) => Number(match[i]).toString(16).padStart(2, '0')).join('')}`;
}
