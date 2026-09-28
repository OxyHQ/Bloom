import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { NamedShapeName } from './paths';
import { shapeNames } from './message-helpers';

export type CookieShape = '4-sided-cookie' | '6-sided-cookie' | '7-sided-cookie' | '9-sided-cookie' | '12-sided-cookie';
export type CloverShape = '4-leaf-clover' | '8-leaf-clover';

/** Localized names for the shared shape picker. */
export interface ShapeMessages {
  shapes: Record<NamedShapeName, string>;
}

export const SHAPE_MESSAGES: MessageCatalog<ShapeMessages> = defineMessages<ShapeMessages>('SHAPE_MESSAGES', {
  shapes: shapeNames(
    {
      square: 'Square',
      slanted: 'Slanted',
      arch: 'Arch',
      semicircle: 'Semicircle',
      oval: 'Oval',
      pill: 'Pill',
      triangle: 'Triangle',
      arrow: 'Arrow',
      fan: 'Fan',
      diamond: 'Diamond',
      clamshell: 'Clamshell',
      pentagon: 'Pentagon',
      gem: 'Gem',
      'very-sunny': 'Very Sunny',
      sunny: 'Sunny',
      burst: 'Burst',
      'soft-burst': 'Soft Burst',
      boom: 'Boom',
      'soft-boom': 'Soft Boom',
      flower: 'Flower',
      puffy: 'Puffy',
      'puffy-diamond': 'Puffy Diamond',
      'ghost-ish': 'Ghost-ish',
      'pixel-circle': 'Pixel Circle',
      'pixel-triangle': 'Pixel Triangle',
      bun: 'Bun',
      heart: 'Heart',
    },
    (n) => `${n}-Sided Cookie`,
    (n) => `${n}-Leaf Clover`,
  ),
});
