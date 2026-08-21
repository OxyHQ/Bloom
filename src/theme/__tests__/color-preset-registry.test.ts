import {
  APP_COLOR_NAMES,
  APP_COLOR_PRESETS,
  COLOR_PLAYGROUND_NAMES,
  COLOR_PRESET_FAMILIES,
  COLOR_PRESET_GROUPS,
  COLOR_PRESET_REGISTRY,
  HEX_TO_APP_COLOR,
  type AppColorPreset,
} from '../color-presets';
import { argbFromHex, argbFromRgb } from '../color-engine';
import { Hct } from '../color-engine/hct';
import { getResolvedTokens } from '../token-registry';

const ORIGINAL_NAMES = [
  'teal',
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'pink',
  'sky',
  'orange',
  'mint',
  'oxy',
  'faircoin',
  'pumpkin',
  'gray',
  'brown',
  'peach',
  'rose',
  'mono',
] as const;

/** Patch-release oracle: existing recipe seeds and access rules cannot drift. */
const ORIGINAL_RECIPES = {
  teal: { hex: '#005c67', variant: 'vivid' },
  blue: { hex: '#1d9bf0', variant: 'vivid' },
  green: { hex: '#10b981', variant: 'vivid' },
  yellow: { hex: '#ffd400', variant: 'vivid', label: 'white' },
  red: { hex: '#ef4444', variant: 'vivid' },
  purple: { hex: '#b866ff', variant: 'vivid' },
  pink: { hex: '#f91880', variant: 'vivid' },
  sky: { hex: '#03a9f4', variant: 'vivid' },
  orange: { hex: '#ff7a00', variant: 'vivid' },
  mint: { hex: '#14b8a6', variant: 'vivid' },
  oxy: { hex: '#c46ede', variant: 'vivid', gate: 'handle' },
  faircoin: { hex: '#9ffb50', variant: 'vivid', gate: 'handle' },
  pumpkin: { hex: '#ff9800', variant: 'vivid' },
  gray: { hex: '#607d8b', variant: 'vivid' },
  brown: { hex: '#813519', variant: 'vivid' },
  peach: { hex: '#ffb28d', variant: 'vivid' },
  rose: { hex: '#fcaffe', variant: 'vivid' },
  mono: { hex: '#000000', variant: 'monochrome', gate: 'premium' },
} as const;

function hctOf(value: string): Hct {
  const match = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(value);
  if (match === null) throw new Error(`expected rgb(r g b), received ${value}`);
  return Hct.fromInt(argbFromRgb(Number(match[1]), Number(match[2]), Number(match[3])));
}

function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return Math.min(distance, 360 - distance);
}

describe('single declarative colour preset registry', () => {
  it('derives all public indexes from 34 unique ordered recipes', () => {
    expect(COLOR_PRESET_REGISTRY).toHaveLength(34);
    expect(APP_COLOR_NAMES).toEqual(COLOR_PRESET_REGISTRY.map(({ name }) => name));
    expect(new Set(APP_COLOR_NAMES).size).toBe(34);
    expect(new Set(COLOR_PRESET_REGISTRY.map(({ hex }) => hex)).size).toBe(34);
    expect(Object.keys(APP_COLOR_PRESETS)).toEqual(APP_COLOR_NAMES);
    expect(Object.keys(HEX_TO_APP_COLOR)).toEqual(
      COLOR_PRESET_REGISTRY.map(({ hex }) => hex),
    );
  });

  it('preserves every original identifier, seed, variant, label and gate', () => {
    for (const name of ORIGINAL_NAMES) {
      expect(APP_COLOR_NAMES).toContain(name);
      const preset = APP_COLOR_PRESETS[name];
      expect({
        hex: preset.hex,
        variant: preset.variant,
        ...(preset.label ? { label: preset.label } : {}),
        ...(preset.gate ? { gate: preset.gate } : {}),
      }).toEqual(ORIGINAL_RECIPES[name]);
      expect(preset.secondaryHex).toBeUndefined();
      expect(preset.tertiaryHex).toBeUndefined();
      expect(Object.keys(preset).sort()).toEqual(
        ['name', ...Object.keys(ORIGINAL_RECIPES[name])].sort(),
      );
    }
  });

  it('keeps rich metadata out of the historical runtime lookup', () => {
    expect(APP_COLOR_PRESETS.cobalt).toEqual({
      name: 'cobalt',
      hex: '#154fd7',
      variant: 'vivid',
      tertiaryHex: '#ffd000',
    });
    expect('displayName' in APP_COLOR_PRESETS.cobalt).toBe(false);
    expect(COLOR_PRESET_REGISTRY.find(({ name }) => name === 'cobalt')).toMatchObject({
      displayName: 'Cobalt + Signal Yellow',
      family: 'ocean',
      pairing: 'curated',
    });
  });

  it('keeps the historical AppColorPreset construction shape source-compatible', () => {
    const minimal: AppColorPreset = { name: 'teal', hex: '#005c67', variant: 'vivid' };
    expect(minimal).toEqual({ name: 'teal', hex: '#005c67', variant: 'vivid' });
  });

  it('validates identifiers, metadata and every authored seed', () => {
    for (const recipe of COLOR_PRESET_REGISTRY) {
      expect(recipe.name).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(recipe.displayName.trim().length).toBeGreaterThan(2);
      expect(recipe.description.trim().length).toBeGreaterThan(12);
      expect(recipe.hex).toMatch(/^#[0-9a-f]{6}$/);
      if (recipe.secondaryHex !== undefined) {
        expect(recipe.secondaryHex).toMatch(/^#[0-9a-f]{6}$/);
      }
      if (recipe.tertiaryHex !== undefined) {
        expect(recipe.tertiaryHex).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('groups every recipe exactly once with consumer-ready family metadata', () => {
    const grouped = COLOR_PRESET_FAMILIES.flatMap((family) => {
      const group = COLOR_PRESET_GROUPS[family];
      expect(group.name).toBe(family);
      expect(group.displayName.length).toBeGreaterThan(2);
      expect(group.description.length).toBeGreaterThan(8);
      expect(group.presets.length).toBeGreaterThan(0);
      return group.presets;
    });
    expect(grouped).toHaveLength(COLOR_PRESET_REGISTRY.length);
    expect(new Set(grouped.map(({ name }) => name)).size).toBe(COLOR_PRESET_REGISTRY.length);
  });

  it('features exactly the sixteen approved curated pairs', () => {
    const featured = COLOR_PRESET_REGISTRY.filter(({ featured }) => featured);
    expect(COLOR_PLAYGROUND_NAMES).toEqual(featured.map(({ name }) => name));
    expect(featured).toHaveLength(16);
    for (const recipe of featured) {
      expect(recipe.pairing).toBe('curated');
      expect(recipe.tertiaryHex).toBeDefined();
    }
    expect(COLOR_PRESET_REGISTRY.filter(({ pairing }) => pairing === 'derived')).toHaveLength(18);
  });

  it('makes each curated action seed govern the rendered tertiary CTA in both modes', () => {
    let measured = 0;
    for (const recipe of COLOR_PRESET_REGISTRY.filter(({ pairing }) => pairing === 'curated')) {
      const accentHex = recipe.tertiaryHex;
      if (accentHex === undefined) throw new Error(`${recipe.name} has no curated action seed`);
      const accentHue = Hct.fromInt(argbFromHex(accentHex)).hue;
      for (const mode of ['light', 'dark'] as const) {
        const action = getResolvedTokens(recipe.name, mode)['--tertiary'];
        if (action === undefined) throw new Error(`${recipe.name}/${mode} has no tertiary token`);
        expect(hueDistance(hctOf(action).hue, accentHue)).toBeLessThan(15);
        measured += 1;
      }
    }
    expect(measured).toBe(32);
  });

  it('keeps paired actions chromatic even when the identity is colourless', () => {
    for (const mode of ['light', 'dark'] as const) {
      const action = getResolvedTokens('graphite', mode)['--tertiary'];
      if (action === undefined) throw new Error(`graphite/${mode} has no tertiary token`);
      expect(hctOf(action).chroma).toBeGreaterThan(45);
    }
  });

  it('keeps large generated surfaces neutral rather than pastel', () => {
    const surfaceTokens = ['--background', '--surface', '--popover', '--muted'] as const;
    let measured = 0;
    for (const name of APP_COLOR_NAMES) {
      for (const mode of ['light', 'dark'] as const) {
        const tokens = getResolvedTokens(name, mode);
        for (const token of surfaceTokens) {
          const value = tokens[token];
          if (value === undefined) throw new Error(`${name}/${mode} has no ${token}`);
          expect(hctOf(value).chroma).toBeLessThanOrEqual(6);
          measured += 1;
        }
      }
    }
    expect(measured).toBe(APP_COLOR_NAMES.length * 2 * surfaceTokens.length);
  });
});
