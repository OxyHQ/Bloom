/** @jest-environment jsdom */
/**
 * The baked web material (`surface/baked-material.ts`): the filter arithmetic,
 * the decision of what is behind a host, and the CSS that paints it. jsdom has
 * no layout or pseudo-element styles, so the pixels themselves are proven in
 * Chromium by `scripts/verify-surface-baked-material.mjs`; this pins the rules.
 */
import {
  backingOf,
  filterColor,
  flush,
  parseLook,
  registerBakedMaterial,
} from '../surface/baked-material';
import {
  BAKED_BODY_VAR,
  BAKED_MATERIAL_ATTRIBUTE,
  PAINT_LAYER_ATTRIBUTE,
  REDUCED_TRANSPARENCY_ATTRIBUTE,
  surfaceMaterialCss,
} from '../surface/web-material';
import { SURFACE_LOOKS, materialFilter } from '../surface/optics';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

describe('the filter on a flat colour', () => {
  it('reads the colour functions of the material filter in order, without the blur', () => {
    expect(parseLook(materialFilter(SURFACE_LOOKS.light))).toEqual([
      ['saturate', SURFACE_LOOKS.light.saturate],
      ['contrast', expect.any(Number)],
      ['brightness', expect.any(Number)],
    ]);
    expect(parseLook('blur(24px)')).toBeNull();
    expect(parseLook('blur(24px) hue-rotate(10deg)')).toBeNull();
  });

  it('flattens and brightens a grey by the measured slope and offset', () => {
    // contrast(slope / b) then brightness(b) is v · slope + 2 · offset / 255 · ½.
    for (const look of [SURFACE_LOOKS.light, SURFACE_LOOKS.dark]) {
      const steps = parseLook(materialFilter(look));
      if (!steps) throw new Error('no look');
      for (const v of [0, 0.2, 0.5, 0.96]) {
        const [r, g, b] = filterColor([v, v, v], steps);
        const expected = Math.min(1, v * look.slope + look.offset / 255);
        expect(r).toBeCloseTo(expected, 3);
        expect(g).toBeCloseTo(expected, 3);
        expect(b).toBeCloseTo(expected, 3);
      }
    }
  });

  it('saturates a colour away from its grey, clamped to the gamut', () => {
    const [r, g, b] = filterColor([0.6, 0.4, 0.4], [['saturate', 2]]);
    expect(r).toBeGreaterThan(0.6);
    expect(g).toBeLessThan(0.4);
    expect(b).toBeLessThan(0.4);
    expect(filterColor([1, 0, 0], [['saturate', 3]])[0]).toBe(1);
  });
});

describe('what is behind a host', () => {
  const unregister: (() => void)[] = [];
  afterEach(() => {
    for (const remove of unregister.splice(0)) remove();
    jest.restoreAllMocks();
  });
  const page = () => {
    document.body.innerHTML = '';
    document.body.style.backgroundColor = '';
    const root = document.createElement('div');
    document.body.append(root);
    return root;
  };
  const host = (parent: HTMLElement) => {
    const el = document.createElement('div');
    el.className = 'bloom-surface--material';
    parent.append(el);
    return el;
  };
  // The selector registry only knows hosts whose CSS was built.
  surfaceMaterialCss('.bloom-surface--material', 'var(--bloom-surface-fill)');
  const bake = (el: HTMLElement, lighting: string) => {
    const computedStyle = window.getComputedStyle.bind(window);
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((node, pseudo) =>
        pseudo === '::before'
          ? ({ backgroundColor: 'rgba(0, 0, 0, 0)' } as CSSStyleDeclaration)
          : computedStyle(node),
      );
    el.style.setProperty('--bloom-surface-filter', 'brightness(1)');
    el.style.setProperty('--bloom-surface-lighting', lighting);
    unregister.push(registerBakedMaterial(el));
    flush();
    expect(el.getAttribute(BAKED_MATERIAL_ATTRIBUTE)).toBe('baked');
  };

  it('bakes on the first opaque, flat background up the tree', () => {
    const root = page();
    root.style.backgroundColor = 'rgb(240, 240, 244)';
    const wrapper = document.createElement('div');
    root.append(wrapper);
    expect(backingOf(host(wrapper), new WeakMap())).toEqual([240 / 255, 240 / 255, 244 / 255]);
  });

  it('stays live over an image, a translucent fill, or a floating ancestor', () => {
    for (const style of [
      'background-image: linear-gradient(red, blue); background-color: white',
      'background-color: rgba(255, 255, 255, 0.5)',
      'position: absolute',
    ]) {
      const root = page();
      document.body.style.backgroundColor = 'white';
      root.setAttribute('style', style);
      expect(backingOf(host(root), new WeakMap())).toBeNull();
    }
  });

  it('stays live when the host itself floats', () => {
    const root = page();
    root.style.backgroundColor = 'white';
    const el = host(root);
    el.style.position = 'fixed';
    expect(backingOf(el, new WeakMap())).toBeNull();
  });

  it('stays live on a material host that is not baked, and never reads through it', () => {
    const root = page();
    root.style.backgroundColor = 'white';
    const outer = host(root);
    expect(backingOf(host(outer), new WeakMap())).toBeNull();
  });

  it.each(['', 'inset 0 0 0 1px white', 'inset 2px 14px 24px -10px white'])(
    'stays live on a baked parent with lighting %j, which the flat body cache cannot represent',
    (lighting) => {
      const root = page();
      root.style.backgroundColor = 'white';
      const outer = host(root);
      bake(outer, lighting);
      expect(backingOf(host(outer), new WeakMap())).toBeNull();
    },
  );

  it('can use a baked parent only when both lighting groups are explicitly disabled', () => {
    const root = page();
    root.style.backgroundColor = 'white';
    const outer = host(root);
    bake(outer, 'none');
    expect(backingOf(host(outer), new WeakMap())).toEqual([1, 1, 1]);
  });

  it('does not cache a parent whose lighting opt-out comes from responsive CSS', () => {
    const root = page();
    root.style.backgroundColor = 'white';
    const style = document.createElement('style');
    style.textContent = '.responsive-panel { --bloom-surface-lighting: none; }';
    root.append(style);
    const outer = host(root);
    outer.classList.add('responsive-panel');
    bake(outer, '');
    expect(getComputedStyle(outer).getPropertyValue('--bloom-surface-lighting')).toBe('none');
    expect(backingOf(host(outer), new WeakMap())).toBeNull();
  });

  it('can bake inside an opaque flat owner nested on a lit material', () => {
    const root = page();
    root.style.backgroundColor = 'white';
    const outer = host(root);
    bake(outer, 'inset 0 0 0 1px white');
    const owner = document.createElement('div');
    owner.style.backgroundColor = 'rgb(10, 20, 30)';
    outer.append(owner);
    expect(backingOf(host(owner), new WeakMap())).toEqual([10 / 255, 20 / 255, 30 / 255]);
  });

  it('starts a SurfacePaint layer from the host it covers, and stops at a sibling layer', () => {
    const root = page();
    root.style.backgroundColor = 'rgb(10, 20, 30)';
    const card = document.createElement('div');
    root.append(card);
    const layer = document.createElement('div');
    layer.setAttribute(PAINT_LAYER_ATTRIBUTE, '');
    layer.className = 'bloom-surface-paint';
    layer.style.position = 'absolute';
    card.append(layer);
    // The layer is absolute by construction: its host is what sits in the page.
    expect(backingOf(layer, new WeakMap())).toEqual([10 / 255, 20 / 255, 30 / 255]);
    // Content of the card sits on the card's layer, which is not baked here.
    const content = document.createElement('div');
    card.append(content);
    expect(backingOf(host(content), new WeakMap())).toBeNull();
  });

  it.each(['none', 'inset 0 0 0 1px white'])(
    'applies the same flat-parent rule to a SurfacePaint layer with lighting %j',
    (lighting) => {
      const root = page();
      root.style.backgroundColor = 'white';
      const card = document.createElement('div');
      root.append(card);
      const layer = document.createElement('div');
      layer.setAttribute(PAINT_LAYER_ATTRIBUTE, '');
      layer.style.position = 'absolute';
      card.append(layer);
      bake(layer, lighting);
      const child = host(card);
      expect(backingOf(child, new WeakMap())).toEqual(lighting === 'none' ? [1, 1, 1] : null);
    },
  );
});

describe('the CSS', () => {
  const css = surfaceMaterialCss('.host', 'var(--fill)');
  const baked = `.host:where([${BAKED_MATERIAL_ATTRIBUTE}="baked"])`;

  it('bakes only the body and keeps the same independent lighting in both paths', () => {
    const before = css.slice(css.indexOf(`${baked}::before {`));
    expect(before).toMatch(/^[^}]*backdrop-filter: none;/);
    expect(before).toMatch(new RegExp(`^[^}]*background-color: var\\(${BAKED_BODY_VAR}\\);`));
    expect(css).not.toContain(`${baked}::after`);
    const lighting = css
      .split('.host::after {')
      .find((rule) => rule.includes('z-index: -1'))
      ?.split('}')[0];
    expect(lighting).toContain('box-shadow: var(--bloom-surface-lighting,');
    expect(lighting).not.toMatch(/(?:backdrop-)?filter:\s*(?:var|blur|brightness)/);
    // One colour, never a gradient layer: a gradient is dithered.
    expect(css.slice(css.indexOf(baked))).not.toMatch(/^[^@]*linear-gradient\(var\(--fill\)/);
  });

  it('keeps the live specificity, so reduced transparency and contrast still win after it', () => {
    expect(css.indexOf(baked)).toBeGreaterThan(-1);
    expect(css.indexOf(baked)).toBeLessThan(css.indexOf(`:root[${REDUCED_TRANSPARENCY_ATTRIBUTE}`));
    expect(css.indexOf(baked)).toBeLessThan(css.indexOf('@media (prefers-reduced-transparency'));
    // The reduced rules undo what the baked ones set.
    const reduced = css.slice(css.indexOf(`:root[${REDUCED_TRANSPARENCY_ATTRIBUTE}`));
    expect(reduced).toMatch(/::after \{[^}]*box-shadow: none;/);
  });
});
