/** Saved template defaults. Editing materializes these values; creation templates are separate. */
export const CHARACTER_PRESET_DEFAULTS: Record<
  string,
  {
    shape: string;
    eyes: string;
    eyewear: string;
    accessory: string;
    color?: string;
    bodyColor?: string;
  }
> = {
  blue_beret: {
    shape: 'six_lobed_flower',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'felipe_beret',
    color: 'blue',
  },
  alfred: {
    shape: 'rounded_triangle',
    eyes: 'sleepy_lids',
    eyewear: 'tall_oval_frames',
    accessory: 'bow',
    color: 'yellow',
  },
  purple_heart: {
    shape: 'heart',
    eyes: 'oval',
    eyewear: 'round_sunglasses',
    accessory: 'none',
    color: 'orchid',
  },
  lime_frog: {
    shape: 'rounded_head_two_ears',
    eyes: 'todd',
    eyewear: 'none',
    accessory: 'bow',
    color: 'lime',
  },
  coral_monocle: {
    shape: 'twelve_scalloped_rosette',
    eyes: 'double_highlights',
    eyewear: 'monocle',
    accessory: 'none',
    color: 'coral',
  },
  gus: {
    shape: 'rounded_diamond',
    eyes: 'oval',
    eyewear: 'classic_sunglasses',
    accessory: 'orb',
    bodyColor: '#ffd838',
  },
  blue_spectacles: {
    shape: 'rounded_cube',
    eyes: 'crescent_inset',
    eyewear: 'tall_oval_frames',
    accessory: 'three_lobe',
    color: 'cyan',
  },
  lime_headphones: {
    shape: 'circle_two_ears',
    eyes: 'swept_lids',
    eyewear: 'none',
    accessory: 'headphones',
    color: 'pink',
  },
  clippo: {
    shape: 'clippo',
    eyes: 'clippo',
    eyewear: 'none',
    accessory: 'none',
    bodyColor: '#999b9d',
  },
  legacy: {
    shape: 'circle',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'none',
    color: 'blue',
  },
};
