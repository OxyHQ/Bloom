/**
 * The colour engine's role golden: what the TypeScript engine (src/theme/color-engine) resolves
 * every colour role to, for seed × variant × contrast level × light and dark, plus pinned
 * secondary and tertiary accents. Every port of the engine must reproduce it exactly (the Bloom
 * engine, packages/bloom-theme-engine, on each backend). One line per scheme:
 *
 *   <seed> <variant> <light|dark> <contrast> <secondary seed|-> <tertiary seed|-> <42 role colours>
 *
 * with the roles in `Roles` order (ROLE_NAMES) and each colour as `#rrggbb`, from
 * `generateRoleColors`. Rewritten on purpose only, after an approved change to the engine.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Roles, type RoleName } from '../src/theme/color-engine/color-roles';
import { generateRoleColors } from '../src/theme/color-engine/generate-role-colors';
import type { SchemeVariant } from '../src/theme/color-engine/scheme-variants';

export const ROLE_NAMES = Object.keys(Roles) as RoleName[];

/** The presets' seeds, then primaries, greys and Material's baseline purple. */
export const ROLE_SEEDS = [
  '#c46ede',
  '#1d9bf0',
  '#10b981',
  '#ec4899',
  '#9ffb50',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#808080',
  '#6750a4',
];

export const ROLE_VARIANTS: SchemeVariant[] = [
  'vivid',
  'vibrant',
  'expressive',
  'tonalSpot',
  'neutral',
  'monochrome',
];

/** Every segment of a contrast curve: low, low–normal, normal, normal–medium, medium, medium–high, high. */
export const ROLE_CONTRASTS = [-1, -0.5, 0, 0.25, 0.5, 0.75, 1];

/** Pinned accents: each preset with the next two presets as its secondary and tertiary seeds. */
export const ACCENT_VARIANTS: SchemeVariant[] = ['vivid', 'tonalSpot', 'expressive'];

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+) (\d+) (\d+)\)/);
  if (!match) throw new Error(`expected rgb(r g b), got ${rgb}`);
  return `#${[1, 2, 3].map((i) => Number(match[i]).toString(16).padStart(2, '0')).join('')}`;
}

export interface RoleCase {
  seed: string;
  variant: SchemeVariant;
  isDark: boolean;
  contrastLevel: number;
  secondarySeed?: string;
  tertiarySeed?: string;
}

export function roleCases(): RoleCase[] {
  const cases: RoleCase[] = [];
  for (const seed of ROLE_SEEDS) {
    for (const variant of ROLE_VARIANTS) {
      for (const contrastLevel of ROLE_CONTRASTS) {
        for (const isDark of [false, true]) cases.push({ seed, variant, isDark, contrastLevel });
      }
    }
  }
  const presets = ROLE_SEEDS.slice(0, 5);
  presets.forEach((seed, i) => {
    const secondarySeed = presets[(i + 1) % presets.length];
    const tertiarySeed = presets[(i + 2) % presets.length];
    for (const variant of ACCENT_VARIANTS) {
      for (const isDark of [false, true]) {
        cases.push({ seed, variant, isDark, contrastLevel: 0, secondarySeed, tertiarySeed });
      }
    }
  });
  return cases;
}

export function roleLine(c: RoleCase): string {
  const roles = generateRoleColors(c);
  return [
    c.seed,
    c.variant,
    c.isDark ? 'dark' : 'light',
    String(c.contrastLevel),
    c.secondarySeed ?? '-',
    c.tertiarySeed ?? '-',
    ...ROLE_NAMES.map((name) => rgbToHex(roles[name])),
  ].join(' ');
}

if (import.meta.main) {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(here, '..', 'src', 'theme', '__tests__', 'fixtures', 'color-roles-golden.txt');
  const text = `# ${ROLE_NAMES.join(' ')}\n${roleCases().map(roleLine).join('\n')}\n`;
  writeFileSync(out, text);
  console.log(
    `[generate-color-roles-golden] wrote ${relative(join(here, '..'), out)} (${text.length} bytes)`,
  );
}
