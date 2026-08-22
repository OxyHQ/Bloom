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
import { Cam16 } from '../color-engine/cam16';
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

const EXISTING_CURATED_NAMES = [
  'grove',
  'ember',
  'merlot',
  'cobalt',
  'jade',
  'pine',
  'olive',
  'lagoon',
  'navy',
  'azure',
  'violet',
  'lavender',
  'plum',
  'cherry',
  'chocolate',
  'graphite',
] as const;

const NEW_COMBINATION_NAMES = [
  'forest-fire',
  'malachite-rush',
  'moss-voltage',
  'viridian-orbit',
  'acid-canopy',
  'pacific-flare',
  'reef-pulse',
  'electric-tide',
  'arctic-signal',
  'ultramarine-gold',
  'midnight-citrus',
  'persimmon-wave',
  'solar-flux',
  'paprika-current',
  'crimson-spark',
  'flamenco-sun',
  'saffron-depth',
  'clay-current',
  'bronze-neon',
  'copper-field',
  'umber-signal',
  'amethyst-current',
  'ruby-current',
  'orchid-flare',
  'garnet-acid',
  'indigo-ember',
  'raspberry-gold',
  'ink-orange',
  'charcoal-lime',
  'pewter-current',
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

/** Release oracle: the sixteen recipes shipped in 1.0.1 stay byte-for-byte configured. */
const EXISTING_CURATED_RECIPES = {
  grove: { hex: '#087a3e', variant: 'vivid', tertiaryHex: '#ffb000' },
  ember: { hex: '#b52f0c', variant: 'vivid', tertiaryHex: '#ffb000' },
  merlot: { hex: '#a5003c', variant: 'vivid', tertiaryHex: '#ff542e' },
  cobalt: { hex: '#154fd7', variant: 'vivid', tertiaryHex: '#ffd000' },
  jade: { hex: '#007a4b', variant: 'vivid', tertiaryHex: '#ff5e00' },
  pine: { hex: '#135c2d', variant: 'vivid', tertiaryHex: '#f0005a' },
  olive: { hex: '#5f6400', variant: 'vivid', tertiaryHex: '#7c25e8' },
  lagoon: { hex: '#00706d', variant: 'vivid', tertiaryHex: '#ff4935' },
  navy: { hex: '#0b2c72', variant: 'vivid', tertiaryHex: '#ff6b20' },
  azure: { hex: '#006a94', variant: 'vivid', tertiaryHex: '#e82e12' },
  violet: { hex: '#7227c4', variant: 'vivid', tertiaryHex: '#78c900' },
  lavender: { hex: '#5c3db5', variant: 'vivid', tertiaryHex: '#d98900' },
  plum: { hex: '#8d075f', variant: 'vivid', tertiaryHex: '#00aeb8' },
  cherry: { hex: '#b00038', variant: 'vivid', tertiaryHex: '#2979e8' },
  chocolate: { hex: '#7a2a00', variant: 'vivid', tertiaryHex: '#00aabe' },
  graphite: { hex: '#272b28', variant: 'vivid', tertiaryHex: '#78c900' },
} as const;

function hctOf(value: string): Hct {
  const match = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(value);
  if (match === null) throw new Error(`expected rgb(r g b), received ${value}`);
  return Hct.fromInt(argbFromRgb(Number(match[1]), Number(match[2]), Number(match[3])));
}

function camOf(value: string): Cam16 {
  const match = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(value);
  if (match === null) throw new Error(`expected rgb(r g b), received ${value}`);
  return Cam16.fromInt(argbFromRgb(Number(match[1]), Number(match[2]), Number(match[3])));
}

function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return Math.min(distance, 360 - distance);
}

describe('single declarative colour preset registry', () => {
  it('derives all public indexes from exactly 64 unique ordered recipes', () => {
    expect(COLOR_PRESET_REGISTRY).toHaveLength(64);
    expect(APP_COLOR_NAMES).toEqual(COLOR_PRESET_REGISTRY.map(({ name }) => name));
    expect(new Set(APP_COLOR_NAMES).size).toBe(64);
    expect(new Set(COLOR_PRESET_REGISTRY.map(({ hex }) => hex)).size).toBe(64);
    expect(Object.keys(APP_COLOR_PRESETS)).toEqual(APP_COLOR_NAMES);
    expect(Object.keys(HEX_TO_APP_COLOR)).toEqual(
      COLOR_PRESET_REGISTRY.map(({ hex }) => hex),
    );
  });

  it('preserves the ordered identifiers and runtime configuration of all 34 shipped recipes', () => {
    expect(APP_COLOR_NAMES.slice(0, 34)).toEqual([...ORIGINAL_NAMES, ...EXISTING_CURATED_NAMES]);
    for (const name of EXISTING_CURATED_NAMES) {
      expect(APP_COLOR_PRESETS[name]).toEqual({
        name,
        ...EXISTING_CURATED_RECIPES[name],
      });
    }
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

  it('features exactly the 46 approved curated combinations', () => {
    const featured = COLOR_PRESET_REGISTRY.filter(({ featured }) => featured);
    expect(COLOR_PLAYGROUND_NAMES).toEqual(featured.map(({ name }) => name));
    expect(featured).toHaveLength(46);
    for (const recipe of featured) {
      expect(recipe.pairing).toBe('curated');
      expect(recipe.tertiaryHex).toBeDefined();
    }
    expect(COLOR_PRESET_REGISTRY.filter(({ pairing }) => pairing === 'derived')).toHaveLength(18);
  });

  it('adds exactly 30 ungated three-seed combinations after the stable catalog', () => {
    expect(APP_COLOR_NAMES.slice(34)).toEqual(NEW_COMBINATION_NAMES);
    for (const name of NEW_COMBINATION_NAMES) {
      const recipe = COLOR_PRESET_REGISTRY.find((candidate) => candidate.name === name);
      if (recipe === undefined) throw new Error(`${name} is absent from the registry`);
      expect(recipe).toMatchObject({
        pairing: 'curated',
        featured: true,
        variant: 'vivid',
      });
      expect(recipe.secondaryHex).toMatch(/^#[0-9a-f]{6}$/);
      expect(recipe.tertiaryHex).toMatch(/^#[0-9a-f]{6}$/);
      expect(recipe.gate).toBeUndefined();
    }
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
    expect(measured).toBe(92);
  });

  it('makes every new support seed govern the rendered secondary role in both modes', () => {
    let measured = 0;
    for (const name of NEW_COMBINATION_NAMES) {
      const recipe = COLOR_PRESET_REGISTRY.find((candidate) => candidate.name === name);
      if (recipe?.secondaryHex === undefined) throw new Error(`${name} has no support seed`);
      const supportHue = Hct.fromInt(argbFromHex(recipe.secondaryHex)).hue;
      for (const mode of ['light', 'dark'] as const) {
        const support = getResolvedTokens(name, mode)['--secondary'];
        if (support === undefined) throw new Error(`${name}/${mode} has no secondary token`);
        expect(hueDistance(hctOf(support).hue, supportHue)).toBeLessThan(15);
        measured += 1;
      }
    }
    expect(measured).toBe(60);
  });

  it('keeps every new support/action saturated and separates all three seeds', () => {
    const errorHue = Hct.fromInt(argbFromHex('#ef4444')).hue;
    for (const name of NEW_COMBINATION_NAMES) {
      const recipe = COLOR_PRESET_REGISTRY.find((candidate) => candidate.name === name);
      if (recipe?.secondaryHex === undefined || recipe.tertiaryHex === undefined) {
        throw new Error(`${name} has an incomplete three-seed combination`);
      }
      const identity = Hct.fromInt(argbFromHex(recipe.hex));
      const support = Hct.fromInt(argbFromHex(recipe.secondaryHex));
      const action = Hct.fromInt(argbFromHex(recipe.tertiaryHex));
      expect(support.chroma).toBeGreaterThan(35);
      expect(action.chroma).toBeGreaterThan(40);
      expect(hueDistance(identity.hue, support.hue)).toBeGreaterThanOrEqual(25);
      expect(hueDistance(support.hue, action.hue)).toBeGreaterThanOrEqual(25);
      expect(hueDistance(identity.hue, action.hue)).toBeGreaterThanOrEqual(25);
      expect(hueDistance(action.hue, errorHue)).toBeGreaterThan(10);
    }
  });

  it('keeps all 435 new combination signatures perceptually distinct', () => {
    const signatures = new Map(
      NEW_COMBINATION_NAMES.map((name) => [
        name,
        (['light', 'dark'] as const).flatMap((mode) => {
          const tokens = getResolvedTokens(name, mode);
          return ['--primary', '--secondary', '--tertiary'].map((token) => {
            const value = tokens[token];
            if (value === undefined) throw new Error(`${name}/${mode} has no ${token}`);
            return camOf(value);
          });
        }),
      ]),
    );
    const distance = (left: readonly Cam16[], right: readonly Cam16[]): number =>
      Math.sqrt(
        left.reduce((sum, color, index) => {
          const counterpart = right[index];
          if (counterpart === undefined) throw new Error('combination signature length drifted');
          return sum + color.distance(counterpart) ** 2;
        }, 0) / left.length,
      );
    const pairs: Array<{ names: readonly [string, string]; distance: number }> = [];
    for (let leftIndex = 0; leftIndex < NEW_COMBINATION_NAMES.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < NEW_COMBINATION_NAMES.length; rightIndex += 1) {
        const leftName = NEW_COMBINATION_NAMES[leftIndex];
        const rightName = NEW_COMBINATION_NAMES[rightIndex];
        if (leftName === undefined || rightName === undefined) {
          throw new Error('combination pair census drifted');
        }
        const left = signatures.get(leftName);
        const right = signatures.get(rightName);
        if (left === undefined || right === undefined) throw new Error('combination signature absent');
        pairs.push({ names: [leftName, rightName], distance: distance(left, right) });
      }
    }
    pairs.sort((left, right) => left.distance - right.distance);
    const nearest = pairs[0];
    expect(pairs).toHaveLength(435);
    expect(nearest?.names).toEqual(['amethyst-current', 'indigo-ember']);
    expect(nearest?.distance).toBeCloseTo(8.06, 1);
    expect(nearest?.distance).toBeGreaterThan(8);
    const control = signatures.get(NEW_COMBINATION_NAMES[0]);
    if (control === undefined) throw new Error('positive-control signature absent');
    expect(distance(control, control)).toBe(0);
  });

  it('allows only the two shipped exact action collisions in either mode', () => {
    const newCombinationNames = new Set<string>(NEW_COMBINATION_NAMES);
    for (const mode of ['light', 'dark'] as const) {
      const namesByAction = new Map<string, string[]>();
      for (const recipe of COLOR_PRESET_REGISTRY) {
        const action = getResolvedTokens(recipe.name, mode)['--tertiary'];
        if (action === undefined) throw new Error(`${recipe.name}/${mode} has no tertiary token`);
        namesByAction.set(action, [...(namesByAction.get(action) ?? []), recipe.name]);
      }
      const collisions = [...namesByAction.values()]
        .filter((names) => names.length > 1)
        .map((names) => names.sort())
        .sort((left, right) => left.join('/').localeCompare(right.join('/')));
      expect(collisions).toEqual([
        ['ember', 'grove'],
        ['graphite', 'violet'],
      ]);
      expect(collisions.flat().some((name) => newCombinationNames.has(name))).toBe(false);
    }
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
