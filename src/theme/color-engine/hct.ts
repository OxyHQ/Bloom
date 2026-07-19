/**
 * Bloom colour engine — HCT (Hue · Chroma · Tone).
 *
 * Faithful port of Material Color Utilities' `Hct` (Apache-2.0) into Bloom's own
 * code. HCT pairs CAM16 hue + chroma with L* as "tone", giving a perceptually
 * even lightness axis: a tone difference of 40 guarantees a ≥3:1 contrast ratio,
 * 50 guarantees ≥4.5:1. Every tonal palette and colour role is built on it.
 */
import { Cam16 } from './cam16';
import { lstarFromArgb } from './color-utils';
import { solveToInt } from './hct-solver';

export class Hct {
  private argb: number;
  private internalHue: number;
  private internalChroma: number;
  private internalTone: number;

  private constructor(argb: number) {
    this.argb = argb;
    const cam = Cam16.fromInt(argb);
    this.internalHue = cam.hue;
    this.internalChroma = cam.chroma;
    this.internalTone = lstarFromArgb(argb);
  }

  /** Build an HCT colour from hue (deg), chroma, and tone (L*, 0–100). */
  static from(hue: number, chroma: number, tone: number): Hct {
    return new Hct(solveToInt(hue, chroma, tone));
  }

  /** Wrap an existing ARGB colour as HCT. */
  static fromInt(argb: number): Hct {
    return new Hct(argb);
  }

  toInt(): number {
    return this.argb;
  }

  get hue(): number {
    return this.internalHue;
  }
  set hue(newHue: number) {
    this.setInternalState(solveToInt(newHue, this.internalChroma, this.internalTone));
  }

  get chroma(): number {
    return this.internalChroma;
  }
  set chroma(newChroma: number) {
    this.setInternalState(solveToInt(this.internalHue, newChroma, this.internalTone));
  }

  get tone(): number {
    return this.internalTone;
  }
  set tone(newTone: number) {
    this.setInternalState(solveToInt(this.internalHue, this.internalChroma, newTone));
  }

  private setInternalState(argb: number): void {
    const cam = Cam16.fromInt(argb);
    this.internalHue = cam.hue;
    this.internalChroma = cam.chroma;
    this.internalTone = lstarFromArgb(argb);
    this.argb = argb;
  }
}
