/**
 * Bloom colour engine — tonal palettes.
 *
 * Faithful port of Material Color Utilities' `TonalPalette` (Apache-2.0). A
 * palette holds a fixed hue + chroma and yields a colour for any tone (0–100).
 * Schemes build primary/secondary/tertiary/neutral palettes and read specific
 * tones per role.
 */
import { Hct } from './hct';

export class TonalPalette {
  private readonly cache = new Map<number, number>();

  private constructor(
    readonly hue: number,
    readonly chroma: number,
    readonly keyColor: Hct,
  ) {}

  static fromInt(argb: number): TonalPalette {
    return TonalPalette.fromHct(Hct.fromInt(argb));
  }

  static fromHct(hct: Hct): TonalPalette {
    return new TonalPalette(hct.hue, hct.chroma, hct);
  }

  static fromHueAndChroma(hue: number, chroma: number): TonalPalette {
    const keyColor = new KeyColor(hue, chroma).create();
    return new TonalPalette(hue, chroma, keyColor);
  }

  /** ARGB of this palette at the given tone. */
  tone(tone: number): number {
    let argb = this.cache.get(tone);
    if (argb === undefined) {
      argb = Hct.from(this.hue, this.chroma, tone).toInt();
      this.cache.set(tone, argb);
    }
    return argb;
  }

  /** HCT of this palette at the given tone. */
  getHct(tone: number): Hct {
    return Hct.fromInt(this.tone(tone));
  }
}

/** The colour that represents a palette's hue + chroma (first from T50). */
class KeyColor {
  private readonly chromaCache = new Map<number, number>();
  private readonly maxChromaValue = 200.0;

  constructor(
    private readonly hue: number,
    private readonly requestedChroma: number,
  ) {}

  create(): Hct {
    const pivotTone = 50;
    const toneStepSize = 1;
    const epsilon = 0.01;
    let lowerTone = 0;
    let upperTone = 100;
    while (lowerTone < upperTone) {
      const midTone = Math.floor((lowerTone + upperTone) / 2);
      const isAscending = this.maxChroma(midTone) < this.maxChroma(midTone + toneStepSize);
      const sufficientChroma = this.maxChroma(midTone) >= this.requestedChroma - epsilon;
      if (sufficientChroma) {
        if (Math.abs(lowerTone - pivotTone) < Math.abs(upperTone - pivotTone)) {
          upperTone = midTone;
        } else {
          if (lowerTone === midTone) {
            return Hct.from(this.hue, this.requestedChroma, lowerTone);
          }
          lowerTone = midTone;
        }
      } else if (isAscending) {
        lowerTone = midTone + toneStepSize;
      } else {
        upperTone = midTone;
      }
    }
    return Hct.from(this.hue, this.requestedChroma, lowerTone);
  }

  private maxChroma(tone: number): number {
    const cached = this.chromaCache.get(tone);
    if (cached !== undefined) return cached;
    const chroma = Hct.from(this.hue, this.maxChromaValue, tone).chroma;
    this.chromaCache.set(tone, chroma);
    return chroma;
  }
}
