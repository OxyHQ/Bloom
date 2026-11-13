/**
 * A character as an SVG document, with no React and no native module: for a server that needs a
 * picture of an avatar (a bot's profile photo, an image card). It is the frame
 * `VectorStaticPortrait` draws (`loadVectorPortrait`), through the same crop (`avatarViewBox`), so
 * a server's picture and an app's portrait are one drawing.
 *
 * Draws from Bloom's full catalog unless a `catalog` is passed: a server has no bundle to keep
 * small. Apps keep drawing with `AgentAvatar`; this entry is for code that cannot render React.
 */
import { argbFromHex, hexFromArgb } from '../theme/color-engine/color-utils';
import { darker, ratioOfTones } from '../theme/color-engine/contrast';
import { Hct } from '../theme/color-engine/hct';
import { TonalPalette } from '../theme/color-engine/tonal-palette';
import {
  avatarBodyHex,
  avatarCharacterInColor,
  resolveAvatarCharacter,
  type AvatarCharacter,
} from './character';
import { vectorAssetLoader } from './vector-assets';
import { loadVectorPortrait } from './vector-portrait';
import type { VectorAssetLoader, VectorFrame } from './vector-types';
import { avatarViewBox } from './vector-viewbox';

export interface AgentAvatarSvgOptions {
  /** The square's side, in pixels. Default 512. */
  size?: number;
  /** A colour behind the character (any CSS colour); transparent when absent. */
  background?: string;
  /**
   * Room around the character, as a fraction of the avatar crop on each side. Default 0: the crop
   * an app draws. A picture something crops into a circle wants some (`renderAgentAvatarPicture`).
   */
  margin?: number;
  /** The vector assets to draw from; Bloom's full catalog when absent. */
  catalog?: VectorAssetLoader;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const attr = (value: string | number) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

/** A vector frame as SVG markup, drawn as `VectorStaticPortrait` draws it. */
export function vectorFrameToSvg(frame: VectorFrame, options: AgentAvatarSvgOptions = {}): string {
  const size = options.size ?? 512;
  const [cx = 0, cy = 0, cw = 320, ch = 320] = avatarViewBox(frame.viewBox)
    .split(/\s+/)
    .map(Number);
  const margin = Math.max(0, options.margin ?? 0);
  const box = [
    cx - cw * margin,
    cy - ch * margin,
    cw * (1 + 2 * margin),
    ch * (1 + 2 * margin),
  ].map((n) => Math.round(n * 100) / 100);
  const viewBox = box.join(' ');
  const clips = frame.paths
    .flatMap((path) =>
      path.clip === undefined
        ? []
        : [
            `<clipPath id="c-${attr(path.id)}" clipPathUnits="userSpaceOnUse"><path d="${attr(path.clip)}"/></clipPath>`,
          ],
    )
    .join('');
  const background = options.background
    ? `<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="${attr(options.background)}"/>`
    : '';
  const paths = frame.paths
    .map((path) => {
      const parts = [
        `d="${attr(path.d)}"`,
        `fill="${attr(path.fill)}"`,
        `opacity="${attr(path.opacity)}"`,
        `fill-opacity="${attr(path.fillOpacity)}"`,
        'fill-rule="nonzero"',
      ];
      if (path.stroke) {
        parts.push(
          `stroke="${attr(path.stroke)}"`,
          `stroke-width="${attr(path.strokeWidth ?? 1.5)}"`,
        );
      }
      if (path.clip !== undefined) parts.push(`clip-path="url(#c-${attr(path.id)})"`);
      return `<path ${parts.join(' ')}/>`;
    })
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${attr(viewBox)}">` +
    `${clips ? `<defs>${clips}</defs>` : ''}${background}${paths}</svg>`
  );
}

/** The character, at rest, as an SVG document. */
export async function renderAgentAvatarSvg(
  character: AvatarCharacter,
  options: AgentAvatarSvgOptions = {},
): Promise<string> {
  const frame = await loadVectorPortrait(character, options.catalog ?? vectorAssetLoader);
  return vectorFrameToSvg(frame, options);
}

/** How light the background is: a much, much lighter tint of the body's own colour. */
const PICTURE_LIGHT_TONE = 97;
/**
 * The least contrast with the body at which that light tint still shows the character (a lime or
 * a pure green on its own pale tint reads clearly; a pale yellow or a white would vanish).
 */
const PICTURE_MIN_CONTRAST = 1.25;
/** The contrast a body too light for the tint gets instead, from a darker tint of its hue. */
const PICTURE_FALLBACK_CONTRAST = 1.6;
/** The tint keeps the body's hue, softened so it reads as a background and not a second colour. */
const PICTURE_MAX_CHROMA = 20;

/**
 * The background a character's picture stands on: its body colour's own hue in a much, much
 * lighter tint (tone 97 of a softened tonal palette, as Bloom's themes derive their surfaces),
 * for every colour that still shows against it, light ones included. Only a body nearly as light
 * as that (a pale yellow, a white) gets a darker tint of its hue instead, so the character is
 * never the same as what it stands on.
 */
export function avatarPictureBackground(bodyHex: string): string {
  const body = Hct.fromInt(argbFromHex(bodyHex));
  const palette = TonalPalette.fromHueAndChroma(
    body.hue,
    Math.min(body.chroma, PICTURE_MAX_CHROMA),
  );
  if (ratioOfTones(body.tone, PICTURE_LIGHT_TONE) >= PICTURE_MIN_CONTRAST) {
    return hexFromArgb(palette.tone(PICTURE_LIGHT_TONE));
  }
  const dark = darker(body.tone, PICTURE_FALLBACK_CONTRAST);
  return hexFromArgb(palette.tone(dark < 0 ? 0 : dark));
}

/** Room around a picture's character, so a circular crop (a profile photo) never cuts it. */
const PICTURE_MARGIN = 0.12;

/**
 * A gemie's or a person's profile picture: the character painted in `color` (a Bloom preset key or
 * a hex; the character's own paint when it is not one), centred with room for a circular crop, on
 * a much lighter tint of that colour (`avatarPictureBackground`). One drawing for every place a
 * character leaves an app as an image.
 */
export async function renderAgentAvatarPicture(
  character: AvatarCharacter,
  color: string | null | undefined,
  options: Pick<AgentAvatarSvgOptions, 'size' | 'catalog'> = {},
): Promise<string> {
  const painted = avatarCharacterInColor(character, color);
  const background = avatarPictureBackground(avatarBodyHex(resolveAvatarCharacter(painted)));
  return renderAgentAvatarSvg(painted, { ...options, background, margin: PICTURE_MARGIN });
}
