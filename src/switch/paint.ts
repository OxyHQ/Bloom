import { contrastRatio, quietText } from '../styles/color-contrast';

/** WCAG 1.4.11: a control's boundary must reach 3:1 against what it sits on. */
export const SWITCH_OFF_TRACK_MIN_CONTRAST = 3;

/**
 * The OFF track and thumb. The track used to be the theme's hairline `border`
 * colour, which on both the light and the dark page is a barely-there step from
 * the surface, with a text-coloured thumb that read as a filled, ON or disabled
 * control. The track is now the quietest blend of the text colour over the
 * surface the switch actually sits on that still clears 3:1, so it is a clear
 * grey in light and dark alike; the thumb contrasts with it, never matching the
 * ON thumb's accent.
 */
export function resolveSwitchOffPaint(input: { surface: string; text: string; isDark: boolean }): {
  track: string;
  thumb: string;
  trackContrast: number;
} {
  const track = quietText(input.surface, input.text, SWITCH_OFF_TRACK_MIN_CONTRAST);
  // Light: a white thumb on the grey track. Dark: the light text colour.
  const thumb = input.isDark ? input.text : input.surface;
  return { track, thumb, trackContrast: contrastRatio(track, input.surface) };
}
