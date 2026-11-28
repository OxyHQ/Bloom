// Slice 1 (HCT, CAM16, the solver, tonal palettes) of the colour engine written in Bloom, compiled
// to TypeScript by bloomc, held to the TypeScript engine's golden and to the TypeScript engine
// itself, value for value. Run: bun run test (packages/bloom-theme-engine).
import { describe, expect, test } from 'bun:test';
import { Cam16 as TsCam16 } from '../../../src/theme/color-engine/cam16';
import {
  hexFromArgb as tsHex,
  lstarFromArgb as tsLstar,
} from '../../../src/theme/color-engine/color-utils';
import { Hct as TsHct } from '../../../src/theme/color-engine/hct';
import { TonalPalette as TsTonalPalette } from '../../../src/theme/color-engine/tonal-palette';
import { cam16FromInt } from '../Sources/ColorEngine/Cam16.bloom';
import { argbFromHex, hexFromArgb, lstarFromArgb } from '../Sources/ColorEngine/ColorUtils.bloom';
import { hctFrom } from '../Sources/ColorEngine/Hct.bloom';
import {
  TonalPalette$getHct,
  TonalPalette$keyColor,
  TonalPalette$tone,
  tonalPaletteFromHueAndChroma,
  tonalPaletteFromInt,
} from '../Sources/ColorEngine/TonalPalette.bloom';
import { GOLDEN_TONES, goldenLines, sameField } from './golden';

/** A golden line computed by the Bloom engine. */
function bloomLine(seed: number): string[] {
  const cam = cam16FromInt(seed);
  const palette = tonalPaletteFromInt(seed);
  const tones = GOLDEN_TONES.map((t) => hexFromArgb(TonalPalette$tone(palette, t)));
  const key = TonalPalette$keyColor(tonalPaletteFromHueAndChroma(cam.hue, 48));
  const vivid = [30, 50, 80].map((t) => hexFromArgb(hctFrom(cam.hue, 200, t).argb));
  return [
    hexFromArgb(seed),
    String(cam.hue),
    String(cam.chroma),
    String(lstarFromArgb(seed)),
    ...tones,
    hexFromArgb(key.argb),
    ...vivid,
  ];
}

/** The same line computed by the TypeScript engine in this process. */
function typescriptLine(seed: number): string[] {
  const cam = TsCam16.fromInt(seed);
  const palette = TsTonalPalette.fromInt(seed);
  const tones = GOLDEN_TONES.map((t) => tsHex(palette.tone(t)));
  const key = TsTonalPalette.fromHueAndChroma(cam.hue, 48).keyColor;
  const vivid = [30, 50, 80].map((t) => tsHex(TsHct.from(cam.hue, 200, t).toInt()));
  return [
    tsHex(seed),
    String(cam.hue),
    String(cam.chroma),
    String(tsLstar(seed)),
    ...tones,
    tsHex(key.toInt()),
    ...vivid,
  ];
}

describe('the colour engine in Bloom, slice 1, on the TypeScript backend', () => {
  const lines = goldenLines();

  test('every value of the golden', () => {
    let checked = 0;
    const differences: string[] = [];
    for (const want of lines) {
      const got = bloomLine(argbFromHex(want[0] as string));
      want.forEach((w, i) => {
        checked++;
        if (!sameField(i, got[i] as string, w))
          differences.push(`${want[0]} field ${i}: golden ${w}, Bloom ${got[i]}`);
      });
    }
    console.log(
      `slice 1 (TS backend): ${lines.length} seeds, ${checked} values, ${differences.length} differences from the golden`,
    );
    expect(differences).toEqual([]);
    expect(checked).toBe(lines.length * 36);
  });

  test('bit for bit what the TypeScript engine computes', () => {
    let identical = 0;
    let checked = 0;
    const differences: string[] = [];
    for (const want of lines) {
      const seed = argbFromHex(want[0] as string);
      const bloom = bloomLine(seed);
      const ts = typescriptLine(seed);
      ts.forEach((t, i) => {
        checked++;
        if (bloom[i] === t) identical++;
        else differences.push(`${want[0]} field ${i}: TypeScript ${t}, Bloom ${bloom[i]}`);
      });
    }
    console.log(
      `slice 1 (TS backend): ${identical} of ${checked} values identical to the TypeScript engine`,
    );
    expect(differences).toEqual([]);
  });

  test('a palette reads the HCT of a tone it solved', () => {
    const palette = tonalPaletteFromInt(0xff6750a4);
    expect(TonalPalette$getHct(palette, 40).argb).toBe(TonalPalette$tone(palette, 40));
  });
});
