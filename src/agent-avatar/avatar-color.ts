import type { AvatarConfig } from './model';

export function avatarHex(
  c: Pick<AvatarConfig, 'hue' | 'saturation' | 'lightness'>,
) {
  const light = (c.lightness ?? 76) / 100,
    a = (c.saturation / 100) * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + c.hue / 30) % 12;
    return Math.round(
      255 * (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
    )
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
