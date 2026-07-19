/**
 * Bloom colour engine — a colour role.
 *
 * Faithful port of Material Color Utilities' `DynamicColor` (Apache-2.0),
 * renamed to Bloom's own `ColorRole`. A role is a *recipe*, not a fixed colour:
 * a palette + a base tone + (optionally) a background to contrast against and a
 * paired role to keep tonal distance from. `getArgb(scheme)` resolves the recipe
 * against a scheme's palettes, dark mode and contrast level into a concrete
 * colour — guaranteeing legibility. This is the heart of the system.
 */
import { darker, darkerUnsafe, lighter, lighterUnsafe, ratioOfTones } from './contrast';
import type { ContrastCurve } from './contrast-curve';
import type { DynamicScheme } from './dynamic-scheme';
import { Hct } from './hct';
import { clampDouble } from './math-utils';
import type { TonalPalette } from './tonal-palette';
import type { ToneDeltaPair } from './tone-delta-pair';

export interface ColorRoleArgs {
  name?: string;
  palette: (scheme: DynamicScheme) => TonalPalette;
  tone: (scheme: DynamicScheme) => number;
  isBackground?: boolean;
  background?: (scheme: DynamicScheme) => ColorRole | undefined;
  secondBackground?: (scheme: DynamicScheme) => ColorRole | undefined;
  contrastCurve?: ContrastCurve;
  toneDeltaPair?: (scheme: DynamicScheme) => ToneDeltaPair;
}

export class ColorRole {
  readonly name: string;
  readonly palette: (scheme: DynamicScheme) => TonalPalette;
  readonly tone: (scheme: DynamicScheme) => number;
  readonly isBackground: boolean;
  readonly background?: (scheme: DynamicScheme) => ColorRole | undefined;
  readonly secondBackground?: (scheme: DynamicScheme) => ColorRole | undefined;
  readonly contrastCurve?: ContrastCurve;
  readonly toneDeltaPair?: (scheme: DynamicScheme) => ToneDeltaPair;
  private readonly hctCache = new Map<DynamicScheme, Hct>();

  static fromPalette(args: ColorRoleArgs): ColorRole {
    return new ColorRole(args);
  }

  constructor(args: ColorRoleArgs) {
    this.name = args.name ?? '';
    this.palette = args.palette;
    this.tone = args.tone;
    this.isBackground = args.isBackground ?? false;
    this.background = args.background;
    this.secondBackground = args.secondBackground;
    this.contrastCurve = args.contrastCurve;
    this.toneDeltaPair = args.toneDeltaPair;
    if (!args.background && args.secondBackground) {
      throw new Error(`Color ${this.name} has secondBackground defined, but background is not.`);
    }
    if (!args.background && args.contrastCurve) {
      throw new Error(`Color ${this.name} has contrastCurve defined, but background is not.`);
    }
    if (args.background && !args.contrastCurve) {
      throw new Error(`Color ${this.name} has background defined, but contrastCurve is not.`);
    }
  }

  getArgb(scheme: DynamicScheme): number {
    return this.getHct(scheme).toInt();
  }

  getHct(scheme: DynamicScheme): Hct {
    const cached = this.hctCache.get(scheme);
    if (cached != null) return cached;
    const tone = this.getTone(scheme);
    const answer = this.palette(scheme).getHct(tone);
    if (this.hctCache.size > 4) this.hctCache.clear();
    this.hctCache.set(scheme, answer);
    return answer;
  }

  getTone(scheme: DynamicScheme): number {
    const decreasingContrast = scheme.contrastLevel < 0;
    if (this.toneDeltaPair) {
      const pair = this.toneDeltaPair(scheme);
      const { roleA, roleB, delta, polarity, stayTogether } = pair;
      const bg = this.background!(scheme)!;
      const bgTone = bg.getTone(scheme);
      const aIsNearer =
        polarity === 'nearer' ||
        (polarity === 'lighter' && !scheme.isDark) ||
        (polarity === 'darker' && scheme.isDark);
      const nearer = aIsNearer ? roleA : roleB;
      const farther = aIsNearer ? roleB : roleA;
      const amNearer = this.name === nearer.name;
      const expansionDir = scheme.isDark ? 1 : -1;
      const nContrast = nearer.contrastCurve!.get(scheme.contrastLevel);
      const fContrast = farther.contrastCurve!.get(scheme.contrastLevel);
      const nInitialTone = nearer.tone(scheme);
      let nTone =
        ratioOfTones(bgTone, nInitialTone) >= nContrast
          ? nInitialTone
          : ColorRole.foregroundTone(bgTone, nContrast);
      const fInitialTone = farther.tone(scheme);
      let fTone =
        ratioOfTones(bgTone, fInitialTone) >= fContrast
          ? fInitialTone
          : ColorRole.foregroundTone(bgTone, fContrast);
      if (decreasingContrast) {
        nTone = ColorRole.foregroundTone(bgTone, nContrast);
        fTone = ColorRole.foregroundTone(bgTone, fContrast);
      }
      if ((fTone - nTone) * expansionDir >= delta) {
        // constraint already satisfied
      } else {
        fTone = clampDouble(0, 100, nTone + delta * expansionDir);
        if ((fTone - nTone) * expansionDir >= delta) {
          // satisfied after expanding farther
        } else {
          nTone = clampDouble(0, 100, fTone - delta * expansionDir);
        }
      }
      if (50 <= nTone && nTone < 60) {
        if (expansionDir > 0) {
          nTone = 60;
          fTone = Math.max(fTone, nTone + delta * expansionDir);
        } else {
          nTone = 49;
          fTone = Math.min(fTone, nTone + delta * expansionDir);
        }
      } else if (50 <= fTone && fTone < 60) {
        if (stayTogether) {
          if (expansionDir > 0) {
            nTone = 60;
            fTone = Math.max(fTone, nTone + delta * expansionDir);
          } else {
            nTone = 49;
            fTone = Math.min(fTone, nTone + delta * expansionDir);
          }
        } else if (expansionDir > 0) {
          fTone = 60;
        } else {
          fTone = 49;
        }
      }
      return amNearer ? nTone : fTone;
    }

    let answer = this.tone(scheme);
    if (this.background == null) return answer;
    const bgTone = this.background(scheme)!.getTone(scheme);
    const desiredRatio = this.contrastCurve!.get(scheme.contrastLevel);
    if (ratioOfTones(bgTone, answer) >= desiredRatio) {
      // already contrasts enough
    } else {
      answer = ColorRole.foregroundTone(bgTone, desiredRatio);
    }
    if (decreasingContrast) {
      answer = ColorRole.foregroundTone(bgTone, desiredRatio);
    }
    if (this.isBackground && 50 <= answer && answer < 60) {
      answer = ratioOfTones(49, bgTone) >= desiredRatio ? 49 : 60;
    }
    if (this.secondBackground) {
      const bg1 = this.background;
      const bg2 = this.secondBackground;
      const bgTone1 = bg1(scheme)!.getTone(scheme);
      const bgTone2 = bg2(scheme)!.getTone(scheme);
      const upper = Math.max(bgTone1, bgTone2);
      const lower = Math.min(bgTone1, bgTone2);
      if (ratioOfTones(upper, answer) >= desiredRatio && ratioOfTones(lower, answer) >= desiredRatio) {
        return answer;
      }
      const lightOption = lighter(upper, desiredRatio);
      const darkOption = darker(lower, desiredRatio);
      const availables: number[] = [];
      if (lightOption !== -1) availables.push(lightOption);
      if (darkOption !== -1) availables.push(darkOption);
      const prefersLight =
        ColorRole.tonePrefersLightForeground(bgTone1) ||
        ColorRole.tonePrefersLightForeground(bgTone2);
      if (prefersLight) return lightOption < 0 ? 100 : lightOption;
      const onlyAvailable = availables[0];
      if (availables.length === 1 && onlyAvailable !== undefined) return onlyAvailable;
      return darkOption < 0 ? 0 : darkOption;
    }
    return answer;
  }

  static foregroundTone(bgTone: number, ratio: number): number {
    const lighterTone = lighterUnsafe(bgTone, ratio);
    const darkerTone = darkerUnsafe(bgTone, ratio);
    const lighterRatio = ratioOfTones(lighterTone, bgTone);
    const darkerRatio = ratioOfTones(darkerTone, bgTone);
    const preferLighter = ColorRole.tonePrefersLightForeground(bgTone);
    if (preferLighter) {
      const negligibleDifference =
        Math.abs(lighterRatio - darkerRatio) < 0.1 && lighterRatio < ratio && darkerRatio < ratio;
      return lighterRatio >= ratio || lighterRatio >= darkerRatio || negligibleDifference
        ? lighterTone
        : darkerTone;
    }
    return darkerRatio >= ratio || darkerRatio >= lighterRatio ? darkerTone : lighterTone;
  }

  static tonePrefersLightForeground(tone: number): boolean {
    return Math.round(tone) < 60.0;
  }

  static toneAllowsLightForeground(tone: number): boolean {
    return Math.round(tone) <= 49.0;
  }

  static enableLightForeground(tone: number): number {
    if (ColorRole.tonePrefersLightForeground(tone) && !ColorRole.toneAllowsLightForeground(tone)) {
      return 49.0;
    }
    return tone;
  }
}
