import { argbFromHex, hexFromArgb, lstarFromArgb } from '../theme/color-engine/color-utils';
import { Hct } from '../theme/color-engine/hct';

/** Perceptual L* floor for avatar skin, independent of hue and saturation. */
export const AVATAR_SKIN_MIN_TONE = 45;
const cache = new Map<string, string>();

/** Keep permitted RGB exact; lift only dark skin using the shared color engine. */
export function normalizeAvatarSkinColor(hex: string): string {
  const key = hex.toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(key)) throw new Error('Invalid avatar body color.');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const argb = argbFromHex(key);
  let result = key;
  if (lstarFromArgb(argb) < AVATAR_SKIN_MIN_TONE) {
    const color = Hct.fromInt(argb);
    // Rounding to 8-bit RGB must not land below the floor and drift on reload.
    let target = AVATAR_SKIN_MIN_TONE + 0.2;
    let lifted = Hct.from(color.hue, color.chroma, target);
    while (lifted.tone < AVATAR_SKIN_MIN_TONE && target < 100) {
      target += 0.2;
      lifted = Hct.from(color.hue, color.chroma, target);
    }
    result = hexFromArgb(lifted.toInt());
  }
  if (cache.size >= 256) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  return result;
}
