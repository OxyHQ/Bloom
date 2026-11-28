// Slice 2 (contrast, the contrast curve, tone-delta pairs, colour roles, variants, the dynamic
// scheme, the dislike analyzer, generateRoleColors) of the colour engine written in Bloom, compiled
// to TypeScript by bloomc, held to the role goldens and to the TypeScript engine itself.
import { describe, expect, test } from 'bun:test';
import { generateRoleColors as tsGenerateRoleColors } from '../../../src/theme/color-engine/generate-role-colors';
import type { SchemeVariant as TsSchemeVariant } from '../../../src/theme/color-engine/scheme-variants';
import { generateRoleColors } from '../Sources/ColorEngine/GenerateRoleColors.bloom';
import { PRESET_SEEDS, materialGolden, rgbToHex, roleGolden } from './roles';

type Options = Parameters<typeof generateRoleColors>[0];

describe('the colour engine in Bloom, slice 2, on the TypeScript backend', () => {
  const { names, lines } = roleGolden();

  test('every role of the role golden', () => {
    let checked = 0;
    const differences: string[] = [];
    for (const line of lines) {
      const options = {
        seed: line.seed,
        variant: line.variant,
        isDark: line.isDark,
        contrastLevel: line.contrastLevel,
        ...(line.secondarySeed ? { secondarySeed: line.secondarySeed } : {}),
        ...(line.tertiarySeed ? { tertiarySeed: line.tertiarySeed } : {}),
      } as Options;
      const roles = generateRoleColors(options);
      names.forEach((name, i) => {
        checked++;
        const got = rgbToHex(roles[name] as string);
        if (got !== line.colours[i]) {
          differences.push(
            `${line.seed} ${line.variant} ${line.isDark} ${line.contrastLevel} ${name}: golden ${line.colours[i]}, Bloom ${got}`,
          );
        }
      });
      // The TypeScript engine's own strings, in the same order.
      const ts = tsGenerateRoleColors({ ...options, variant: line.variant as TsSchemeVariant });
      expect(Object.keys(roles)).toEqual(Object.keys(ts));
      expect(Object.values(roles)).toEqual(Object.values(ts));
    }
    console.log(
      `slice 2 (TS backend): ${lines.length} schemes, ${checked - differences.length} of ${checked} role colours identical to the golden`,
    );
    expect(differences).toEqual([]);
    expect(checked).toBe(lines.length * 42);
  });

  test("Material Color Utilities' frozen reference (color-engine-golden.json)", () => {
    let checked = 0;
    const differences: string[] = [];
    for (const [combo, roles] of Object.entries(materialGolden())) {
      const [seed, variant, mode] = combo.split('|') as [string, string, string];
      const got = generateRoleColors({
        seed: PRESET_SEEDS[seed] as string,
        variant,
        isDark: mode === 'dark',
      } as Options);
      for (const [role, want] of Object.entries(roles)) {
        checked++;
        if (rgbToHex(got[role] as string) !== want)
          differences.push(`${combo} ${role}: golden ${want}, Bloom ${got[role]}`);
      }
    }
    console.log(
      `slice 2 (TS backend): ${checked - differences.length} of ${checked} colours of color-engine-golden.json identical`,
    );
    expect(differences).toEqual([]);
  });
});
