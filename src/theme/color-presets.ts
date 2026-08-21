import type { SchemeVariant } from './color-engine';

/** Why a preset is not offered to every user. Absent means it is free. */
export type ColorPresetGate =
  /** Reserved for the account whose brand it is — not purchasable. */
  | 'handle'
  /** Sold with a subscription. */
  | 'premium';

/** Stable picker/playground categories, ordered from specific to general. */
const COLOR_PRESET_FAMILY_SOURCES = [
  { name: 'brand', displayName: 'Brand', description: 'Reserved ecosystem identities.' },
  { name: 'botanical', displayName: 'Botanical', description: 'Greens, jade and living hues.' },
  { name: 'ocean', displayName: 'Ocean', description: 'Blue, cyan and aquatic identities.' },
  { name: 'sunset', displayName: 'Sunset', description: 'Red, orange and golden identities.' },
  { name: 'earth', displayName: 'Earth', description: 'Warm mineral and grounded identities.' },
  { name: 'jewel', displayName: 'Jewel', description: 'Purple, rose and saturated gem hues.' },
  { name: 'neutral', displayName: 'Neutral', description: 'Slate, graphite and monochrome.' },
] as const;

export type ColorPresetFamily = (typeof COLOR_PRESET_FAMILY_SOURCES)[number]['name'];

export interface ColorPresetFamilyDefinition {
  name: ColorPresetFamily;
  displayName: string;
  description: string;
}

export const COLOR_PRESET_FAMILY_REGISTRY: readonly ColorPresetFamilyDefinition[] =
  COLOR_PRESET_FAMILY_SOURCES;

export const COLOR_PRESET_FAMILIES: readonly ColorPresetFamily[] =
  COLOR_PRESET_FAMILY_REGISTRY.map(({ name }) => name);
export type ColorPresetPairing = 'derived' | 'curated';

interface ColorPresetSource {
  name: string;
  /** Human-readable label; consumers must not rebuild one from the identifier. */
  displayName: string;
  family: ColorPresetFamily;
  description: string;
  /** The identity seed, `#rrggbb`. */
  hex: string;
  variant: SchemeVariant;
  secondaryHex?: string;
  /** The standout action seed. `tertiary` owns FABs and compose actions. */
  tertiaryHex?: string;
  pairing: ColorPresetPairing;
  /** Included in Bloom's permanent Mention-shaped colour playground. */
  featured?: boolean;
  /** Force a white primary label even when preserving the seed would choose black. */
  label?: 'white';
  gate?: ColorPresetGate;
}

/**
 * The ONE authored preset source.
 *
 * Everything public below — the name union, ordered registry, lookup record,
 * hex lookup, gate lists, family groups and playground list — is derived from
 * this tuple. A preset is a seed recipe, never a frozen light/dark token table;
 * Bloom's colour policy resolves both modes at runtime.
 */
const COLOR_PRESET_SOURCES = [
  {
    name: 'teal',
    displayName: 'Teal',
    family: 'ocean',
    description: 'Deep teal identity with dynamically derived split-complementary accents.',
    hex: '#005c67',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'blue',
    displayName: 'Blue',
    family: 'ocean',
    description: 'Clear social blue with vivid generated supporting colours.',
    hex: '#1d9bf0',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'green',
    displayName: 'Green',
    family: 'botanical',
    description: 'Fresh green identity with dynamically generated contrast accents.',
    hex: '#10b981',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'yellow',
    displayName: 'Yellow',
    family: 'sunset',
    description: 'A signal-yellow identity deliberately brought deep enough for a white label.',
    hex: '#ffd400',
    variant: 'vivid',
    pairing: 'derived',
    label: 'white',
  },
  {
    name: 'red',
    displayName: 'Red',
    family: 'sunset',
    description: 'Direct red identity with contrasting generated accent arms.',
    hex: '#ef4444',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'purple',
    displayName: 'Purple',
    family: 'jewel',
    description: 'Bright purple identity with dynamically derived action colours.',
    hex: '#b866ff',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'pink',
    displayName: 'Pink',
    family: 'jewel',
    description: 'Hot pink identity with a vivid generated complement.',
    hex: '#f91880',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'sky',
    displayName: 'Sky',
    family: 'ocean',
    description: 'Open sky blue with dynamically generated supporting accents.',
    hex: '#03a9f4',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'orange',
    displayName: 'Orange',
    family: 'sunset',
    description: 'A gamut-aware orange that stays orange at white-label fill tones.',
    hex: '#ff7a00',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'mint',
    displayName: 'Mint',
    family: 'botanical',
    description: 'Cool mint identity with vivid generated supporting hues.',
    hex: '#14b8a6',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'oxy',
    displayName: 'Oxy',
    family: 'brand',
    description: 'Oxy purple, reserved for the Oxy account identity.',
    hex: '#c46ede',
    variant: 'vivid',
    pairing: 'derived',
    gate: 'handle',
  },
  {
    name: 'faircoin',
    displayName: 'FairCoin',
    family: 'brand',
    description: 'FairCoin lime, reserved for the FairCoin account identity.',
    hex: '#9ffb50',
    variant: 'vivid',
    pairing: 'derived',
    gate: 'handle',
  },
  {
    name: 'pumpkin',
    displayName: 'Pumpkin',
    family: 'sunset',
    description: 'Golden pumpkin orange with a generated split complement.',
    hex: '#ff9800',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'gray',
    displayName: 'Slate',
    family: 'neutral',
    description: 'Cool slate identity with restrained chroma and generated accents.',
    hex: '#607d8b',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'brown',
    displayName: 'Brown',
    family: 'earth',
    description: 'Deep earthen brown with a contrasting generated action colour.',
    hex: '#813519',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'peach',
    displayName: 'Peach',
    family: 'earth',
    description: 'Warm peach identity with dynamically derived contrast accents.',
    hex: '#ffb28d',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'rose',
    displayName: 'Rose',
    family: 'jewel',
    description: 'Light rose identity with generated vivid supporting hues.',
    hex: '#fcaffe',
    variant: 'vivid',
    pairing: 'derived',
  },
  {
    name: 'mono',
    displayName: 'Monochrome',
    family: 'neutral',
    description: 'Colourless identity and surfaces, derived as a true greyscale theme.',
    hex: '#000000',
    variant: 'monochrome',
    pairing: 'derived',
    gate: 'premium',
  },
  {
    name: 'grove',
    displayName: 'Grove + Marigold',
    family: 'botanical',
    description: 'Green identity with warm marigold reserved for the action that must win.',
    hex: '#087a3e',
    tertiaryHex: '#ffb000',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'ember',
    displayName: 'Terracotta + Saffron',
    family: 'earth',
    description: 'Terracotta identity with a high-energy saffron action.',
    hex: '#b52f0c',
    tertiaryHex: '#ffb000',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'merlot',
    displayName: 'Oxblood + Coral',
    family: 'jewel',
    description: 'Deep wine identity with coral action, expressive without reading destructive.',
    hex: '#a5003c',
    tertiaryHex: '#ff542e',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'cobalt',
    displayName: 'Cobalt + Signal Yellow',
    family: 'ocean',
    description: 'Cobalt structure cut by a saturated signal-yellow action.',
    hex: '#154fd7',
    tertiaryHex: '#ffd000',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'jade',
    displayName: 'Jade + Tangerine',
    family: 'botanical',
    description: 'Clean jade identity with a direct tangerine action.',
    hex: '#007a4b',
    tertiaryHex: '#ff5e00',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'pine',
    displayName: 'Pine + Rose',
    family: 'botanical',
    description: 'Sober pine identity with a vivid rose action.',
    hex: '#135c2d',
    tertiaryHex: '#f0005a',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'olive',
    displayName: 'Olive + Lilac',
    family: 'earth',
    description: 'Editorial olive identity with an unexpected clear lilac action.',
    hex: '#5f6400',
    tertiaryHex: '#7c25e8',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'lagoon',
    displayName: 'Teal + Coral',
    family: 'ocean',
    description: 'Aquatic teal identity with a warm coral action.',
    hex: '#00706d',
    tertiaryHex: '#ff4935',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'navy',
    displayName: 'Navy + Apricot',
    family: 'ocean',
    description: 'Serious navy identity softened by a human apricot action.',
    hex: '#0b2c72',
    tertiaryHex: '#ff6b20',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'azure',
    displayName: 'Sky + Vermilion',
    family: 'ocean',
    description: 'Airy sky identity with a decisive vermilion action.',
    hex: '#006a94',
    tertiaryHex: '#e82e12',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'violet',
    displayName: 'Violet + Lime',
    family: 'jewel',
    description: 'Deep violet identity with an electric lime action.',
    hex: '#7227c4',
    tertiaryHex: '#78c900',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'lavender',
    displayName: 'Lavender + Brass',
    family: 'jewel',
    description: 'Calm lavender identity with a warmer, more editorial brass action.',
    hex: '#5c3db5',
    tertiaryHex: '#d98900',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'plum',
    displayName: 'Plum + Aqua',
    family: 'jewel',
    description: 'Nocturnal plum identity with a bright aqua action.',
    hex: '#8d075f',
    tertiaryHex: '#00aeb8',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'cherry',
    displayName: 'Cherry + Powder Blue',
    family: 'jewel',
    description: 'Cherry identity with a cool powder-blue counterpoint.',
    hex: '#b00038',
    tertiaryHex: '#2979e8',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'chocolate',
    displayName: 'Chocolate + Cyan',
    family: 'earth',
    description: 'Material chocolate identity with a crisp technological cyan action.',
    hex: '#7a2a00',
    tertiaryHex: '#00aabe',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
  {
    name: 'graphite',
    displayName: 'Graphite + Acid',
    family: 'neutral',
    description: 'Near-neutral identity that gives the stage to an acid-green action.',
    hex: '#272b28',
    tertiaryHex: '#78c900',
    variant: 'vivid',
    pairing: 'curated',
    featured: true,
  },
] as const satisfies readonly ColorPresetSource[];

/** Preset identifiers are inferred from the authored registry, never repeated. */
export type AppColorName = (typeof COLOR_PRESET_SOURCES)[number]['name'];

/**
 * Backwards-compatible named-preset contract. Rich picker metadata lives on
 * {@link ColorPresetRecipe} so existing consumers constructing this type do not
 * acquire new required fields in a patch release.
 */
export interface AppColorPreset {
  name: AppColorName;
  hex: string;
  variant: SchemeVariant;
  secondaryHex?: string;
  tertiaryHex?: string;
  label?: 'white';
  gate?: ColorPresetGate;
}

/** Enriched registry entry for a picker or colour playground. */
export interface ColorPresetRecipe extends AppColorPreset {
  displayName: string;
  family: ColorPresetFamily;
  description: string;
  pairing: ColorPresetPairing;
  featured: boolean;
}

/** Stable ordered entries for pickers, filters and the Storybook playground. */
export const COLOR_PRESET_REGISTRY: readonly ColorPresetRecipe[] = COLOR_PRESET_SOURCES.map(
  (source) => ({ featured: false, ...source }),
);

export const APP_COLOR_NAMES: readonly AppColorName[] = COLOR_PRESET_REGISTRY.map(
  ({ name }) => name,
);

export const APP_COLOR_PRESETS: Record<AppColorName, AppColorPreset> =
  COLOR_PRESET_REGISTRY.reduce<Record<AppColorName, AppColorPreset>>((presets, preset) => {
    // Preserve the historical runtime shape as well as its TypeScript type.
    // Picker metadata belongs to COLOR_PRESET_REGISTRY; adding it invisibly to
    // this older record would change Object.keys()/serialization in consumers.
    presets[preset.name] = {
      name: preset.name,
      hex: preset.hex,
      variant: preset.variant,
      ...(preset.secondaryHex !== undefined ? { secondaryHex: preset.secondaryHex } : {}),
      ...(preset.tertiaryHex !== undefined ? { tertiaryHex: preset.tertiaryHex } : {}),
      ...(preset.label !== undefined ? { label: preset.label } : {}),
      ...(preset.gate !== undefined ? { gate: preset.gate } : {}),
    };
    return presets;
  }, {} as Record<AppColorName, AppColorPreset>);

export const HEX_TO_APP_COLOR: Record<string, AppColorName> =
  COLOR_PRESET_REGISTRY.reduce<Record<string, AppColorName>>((names, preset) => {
    names[preset.hex.toLowerCase()] = preset.name;
    return names;
  }, {});

export function hexToAppColorName(hex: string): AppColorName {
  return HEX_TO_APP_COLOR[hex.toLowerCase()] ?? 'teal';
}

/** The sixteen approved paired directions in the permanent Mention playground. */
export const COLOR_PLAYGROUND_NAMES: readonly AppColorName[] = COLOR_PRESET_REGISTRY
  .filter(({ featured }) => featured)
  .map(({ name }) => name);

export interface ColorPresetGroup extends ColorPresetFamilyDefinition {
  presets: readonly ColorPresetRecipe[];
}

/** Ordered family metadata and entries for consumer pickers. */
export const COLOR_PRESET_GROUPS: Readonly<Record<ColorPresetFamily, ColorPresetGroup>> =
  COLOR_PRESET_FAMILY_REGISTRY.reduce<Record<ColorPresetFamily, ColorPresetGroup>>(
    (groups, family) => {
      groups[family.name] = {
        ...family,
        presets: COLOR_PRESET_REGISTRY.filter((preset) => preset.family === family.name),
      };
      return groups;
    },
    {} as Record<ColorPresetFamily, ColorPresetGroup>,
  );

/**
 * Historically each preset carried a full light/dark map of raw HSL triples.
 * The engine now derives every role from the registry's seeds.
 */
export type PresetTokens = Record<string, string>;

const namesGatedBy = (gate: ColorPresetGate | undefined): readonly AppColorName[] =>
  COLOR_PRESET_REGISTRY.filter((preset) => preset.gate === gate).map(({ name }) => name);

/** Available to every user, signed in or not. */
export const FREE_COLOR_NAMES: readonly AppColorName[] = namesGatedBy(undefined);

/** Reserved for the account whose brand it is (`oxy`, `faircoin`) — not for sale. */
export const HANDLE_COLOR_NAMES: readonly AppColorName[] = namesGatedBy('handle');

/** Sold with a subscription. */
export const PREMIUM_COLOR_NAMES: readonly AppColorName[] = namesGatedBy('premium');
