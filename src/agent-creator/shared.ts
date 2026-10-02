import { FOLD_SHAPES, type AvatarConfig } from '../agent-avatar';
import {
  AGENT_LANGUAGES,
  AGENT_SPEECH_RATES,
  DEFAULT_AGENT_PREFERENCES,
} from './constants';
import type { AgentPreferences } from './types';

export function normalizeAgentPreferences(
  value: Partial<AgentPreferences> | null | undefined,
): AgentPreferences {
  return {
    voice:
      typeof value?.voice === 'string'
        ? value.voice.slice(0, 200)
        : DEFAULT_AGENT_PREFERENCES.voice,
    speed: AGENT_SPEECH_RATES.some((rate) => rate === value?.speed)
      ? value!.speed!
      : 1,
    language: AGENT_LANGUAGES.some(
      (language) => language.id === value?.language,
    )
      ? value!.language!
      : 'auto',
    notifications:
      typeof value?.notifications === 'boolean' ? value.notifications : true,
  };
}
export { avatarHex } from '../agent-avatar/avatar-color';
export function hexAppearance(hex: string): Partial<AvatarConfig> | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min,
    light = (max + min) / 2;
  let hue = 0;
  if (delta)
    hue =
      max === r
        ? ((g - b) / delta + 6) % 6
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
  return {
    hue: hue * 60,
    saturation: delta ? (delta / (1 - Math.abs(2 * light - 1))) * 100 : 0,
    lightness: light * 100,
    lightEyes: light < 0.35,
  };
}
export const wrapShape = (index: number) =>
  ((index % FOLD_SHAPES.length) + FOLD_SHAPES.length) % FOLD_SHAPES.length;
export function shapeArcPoint(distance: number) {
  const angle = distance * 0.34;
  return { x: Math.sin(angle) * 210, y: Math.cos(angle) * 210 - 176 };
}
export type Hsv = { h: number; s: number; v: number };
export function hexToHsv(hex: string): Hsv | null {
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match?.[1]) return null;
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(
    (i) => parseInt(match[1]!.slice(i, i + 2), 16) / 255,
  );
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  let h = 0;
  if (delta)
    h =
      max === r
        ? ((g - b) / delta + (g < b ? 6 : 0)) * 60
        : max === g
          ? ((b - r) / delta + 2) * 60
          : ((r - g) / delta + 4) * 60;
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}
export function hsvToHex({ h, s, v }: Hsv) {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}
