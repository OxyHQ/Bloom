/**
 * @jest-environment jsdom
 *
 * The small print, rendered through the REAL react-native-web so the
 * assertions read the emitted DOM: what is drawn, what is announced, what the
 * scale bar's geometry actually is, and which parts are a link.
 *
 * What this instrument CANNOT see is the thing the family exists for —
 * legibility over a tile Bloom does not own. The island's blur is an
 * `expo-blur` mock here and a real `backdrop-filter` in a browser, and a
 * translucent pane reports a plausible colour for a slot it is not using. That
 * half is a screenshot check over a pale map, a night map and a photograph.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  MAP_ATTRIBUTION_GEOMETRY,
  MapAttribution,
  MapScaleBar,
  describeScale,
  resolveMapAttributionPaint,
} from '../map-attribution';
import { AA_GRAPHICAL, AA_TEXT, AA_TEXT_STRONG } from '../styles/surface-levels';
import { contrastRatio } from '../styles/color-contrast';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import type { AppColorName } from '../theme/color-presets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function query(id: string): HTMLElement | null {
  return container.querySelector(`[data-testid="${id}"], [testid="${id}"]`);
}

function byTestId(id: string): HTMLElement {
  const el = query(id);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

const METRIC = [{ width: 88, label: '500 m' }];
const BOTH = [
  { width: 88, label: '500 m' },
  { width: 108, label: '2000 ft' },
];

// ---------------------------------------------------------------------------
//  The paint
// ---------------------------------------------------------------------------

describe('resolveMapAttributionPaint', () => {
  const PRESETS = ['teal', 'blue', 'mono', 'yellow'] as const satisfies readonly AppColorName[];

  it.each(['light', 'dark'] as const)('keeps every rung legible ON THE ISLAND (%s)', (mode) => {
    for (const preset of PRESETS) {
      const paint = resolveMapAttributionPaint(buildTheme(preset, mode));
      const where = `${preset} ${mode}`;
      // The credit is 11px and it is a licence requirement, so it takes the
      // SECONDARY rung rather than the quietest one.
      expect([where, contrastRatio(paint.textSecondary, paint.surface) >= AA_TEXT_STRONG]).toEqual([
        where,
        true,
      ]);
      expect([where, contrastRatio(paint.textTertiary, paint.surface) >= AA_TEXT]).toEqual([
        where,
        true,
      ]);
      // The rule is a LINE, not text.
      expect([where, contrastRatio(paint.rule, paint.surface) >= AA_GRAPHICAL]).toEqual([
        where,
        true,
      ]);
    }
  });

  it('keeps the rule quieter than the reading beside it', () => {
    const paint = resolveMapAttributionPaint(buildTheme('teal', 'light'));
    expect(contrastRatio(paint.rule, paint.surface)).toBeLessThan(
      contrastRatio(paint.textSecondary, paint.surface),
    );
  });
});

// ---------------------------------------------------------------------------
//  MapScaleBar
// ---------------------------------------------------------------------------

describe('MapScaleBar', () => {
  it('draws the bar at the width the APP measured', () => {
    mount(<MapScaleBar scales={METRIC} testID="s" />);
    const bar = byTestId('s-bar-0');
    expect(bar.firstElementChild!.getAttribute('style')).toContain('width: 88px');
    expect(bar.textContent).toBe('500 m');
  });

  it('marks BOTH ends, so the bar reads as a span rather than an underline', () => {
    mount(<MapScaleBar scales={METRIC} testID="s" />);
    const box = byTestId('s-bar-0').firstElementChild!;
    const layers = Array.from(box.children) as HTMLElement[];
    expect(layers).toHaveLength(3);
    const rule = byTestId('s-rule-0');
    expect(rule.style.height).toBe(`${MAP_ATTRIBUTION_GEOMETRY.rule}px`);
    const ticks = layers.filter((l) => l !== rule);
    expect(ticks.map((t) => t.style.height)).toEqual([
      `${MAP_ATTRIBUTION_GEOMETRY.tick}px`,
      `${MAP_ATTRIBUTION_GEOMETRY.tick}px`,
    ]);
    expect(ticks.map((t) => (t.style.left === '0px' ? 'left' : 'right'))).toEqual(['left', 'right']);
  });

  it('stacks two vocabularies of one measurement', () => {
    mount(<MapScaleBar scales={BOTH} testID="s" />);
    expect(byTestId('s-bar-0').textContent).toBe('500 m');
    expect(byTestId('s-bar-1').textContent).toBe('2000 ft');
    expect(byTestId('s-bar-1').firstElementChild!.getAttribute('style')).toContain('width: 108px');
  });

  it('says it is a SCALE — a bar and two ticks say nothing aloud', () => {
    mount(<MapScaleBar scales={BOTH} testID="s" />);
    const named = container.querySelector('[role="img"]')!;
    expect(named.getAttribute('aria-label')).toBe('Scale, 500 m, 2000 ft');
    expect(describeScale(METRIC, 'Escala')).toBe('Escala, 500 m');
    expect(describeScale([], 'Scale')).toBe('Scale');
  });

  it('converts nothing: a width of zero still draws, and nothing is rounded', () => {
    mount(<MapScaleBar scales={[{ width: -10, label: '0 m' }]} testID="s" />);
    expect(byTestId('s-bar-0').firstElementChild!.getAttribute('style')).toContain('width: 0px');
  });

  it('drops the island for the `inline` variant', () => {
    mount(<MapScaleBar scales={METRIC} testID="s" />);
    expect(query('s-material')).not.toBeNull();
    mount(<MapScaleBar scales={METRIC} variant="inline" testID="s" />);
    expect(query('s-material')).toBeNull();
    expect(byTestId('s').style.paddingTop).toBe('0px');
    expect(byTestId('s').style.paddingLeft).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
//  MapAttribution
// ---------------------------------------------------------------------------

describe('MapAttribution', () => {
  it('draws the credit exactly as the licence words it', () => {
    mount(<MapAttribution credit="Map data © Open Map Project contributors" testID="a" />);
    expect(byTestId('a-credit').textContent).toBe('Map data © Open Map Project contributors');
  });

  it('never truncates it — a clipped credit is a licence problem, not a layout one', () => {
    mount(<MapAttribution credit="A very long credit indeed" testID="a" />);
    const credit = byTestId('a-credit');
    expect(credit.style.getPropertyValue('-webkit-line-clamp')).toBe('');
    expect(credit.parentElement!.style.flexWrap).toBe('wrap');
  });

  it('makes the credit a real LINK when there is somewhere to go', () => {
    const onPressCredit = jest.fn();
    mount(<MapAttribution credit="© Open Map Project" onPressCredit={onPressCredit} testID="a" />);
    const credit = byTestId('a-credit');
    expect(credit.getAttribute('role')).toBe('button');
    expect(credit.getAttribute('aria-label')).toBe('© Open Map Project');
    act(() => {
      credit.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onPressCredit).toHaveBeenCalledTimes(1);
  });

  it('is plain text when it is not a link', () => {
    mount(<MapAttribution credit="© Open Map Project" testID="a" />);
    expect(byTestId('a-credit').getAttribute('role')).toBeNull();
    expect(byTestId('a-credit').tagName).not.toBe('BUTTON');
  });

  it('names the link when the credit is not a sentence', () => {
    mount(<MapAttribution credit="© OMP" creditLabel="About the map data" onPressCredit={() => {}} testID="a" />);
    expect(byTestId('a-credit').getAttribute('aria-label')).toBe('About the map data');
  });

  it('draws the scale and the date only when given one', () => {
    mount(<MapAttribution credit="©" testID="a" />);
    expect(query('a-scale')).toBeNull();
    expect(query('a-updated')).toBeNull();

    mount(<MapAttribution credit="©" scales={METRIC} updated="Updated 12 March" testID="a" />);
    expect(query('a-scale')).not.toBeNull();
    expect(byTestId('a-updated').textContent).toBe('Updated 12 March');
  });

  it('hides the separator from assistive technology', () => {
    mount(<MapAttribution credit="©" updated="Updated 12 March" testID="a" />);
    const dot = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find(
      (el) => el.textContent === '·',
    );
    expect(dot).toBeDefined();
  });

  it('puts the scale INSIDE the one pane rather than beside a second one', () => {
    mount(<MapAttribution credit="©" scales={METRIC} testID="a" />);
    expect(byTestId('a').contains(byTestId('a-scale'))).toBe(true);
    // One glass material for the whole strip.
    expect(container.querySelectorAll('[data-testid$="-material"]')).toHaveLength(1);
  });

  it('is a named group, so the strip is one landmark', () => {
    mount(<MapAttribution credit="©" scales={METRIC} updated="x" testID="a" />);
    expect(byTestId('a').getAttribute('role')).toBe('group');
    expect(byTestId('a').getAttribute('aria-label')).toBe('Map data');
  });

  it('drops the island for the `inline` variant', () => {
    mount(<MapAttribution credit="©" variant="inline" testID="a" />);
    expect(query('a-material')).toBeNull();
  });

  it('is the smallest rung of the ramp, in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      mount(<MapAttribution credit="©" scales={METRIC} updated="x" testID="a" />, mode);
      expect(byTestId('a-credit').style.fontSize).toBe('11px');
      expect(byTestId('a-updated').style.fontSize).toBe('11px');
    }
  });
});
