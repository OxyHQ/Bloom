/**
 * Bloom colour engine — tone-delta pair.
 *
 * Faithful port of Material Color Utilities' `ToneDeltaPair` (Apache-2.0).
 * Constrains two related roles to keep a minimum tonal distance in a given
 * direction (e.g. a fixed colour must stay lighter than its dim variant), so
 * paired roles never collapse into each other.
 */
import type { ColorRole } from './color-role';

export type TonePolarity = 'darker' | 'lighter' | 'nearer' | 'farther';

export class ToneDeltaPair {
  constructor(
    readonly roleA: ColorRole,
    readonly roleB: ColorRole,
    readonly delta: number,
    readonly polarity: TonePolarity,
    readonly stayTogether: boolean,
  ) {}
}
