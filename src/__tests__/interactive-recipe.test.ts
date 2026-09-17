/**
 * The gate on the interactive recipe (`styles/interactive-web-css.ts`) and on
 * the two conventions it now owns: ONE focus-ring mechanism and ONE disabled
 * opacity.
 *
 * Both failures are silent in a browser and invisible to a prop-level test. A
 * ring gap hardcoded to `#FFFFFF` renders a perfectly ordinary 2px white halo —
 * correct on a white page, and a bright ring of nothing on a dark one; three
 * different disabled opacities render three perfectly ordinary faded controls.
 * Only a source scan catches either, so that is what the second half of this
 * file is.
 *
 * The scans are EXCLUSION LISTS, not thresholds: every exception is written
 * down with its reason, so adding one is a decision someone has to make in a
 * diff rather than a number quietly moving.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

import {
  focusRingShadow,
  interactiveWebCss,
  NOT_DISABLED,
  RING_OFFSET_FALLBACK,
  RING_OFFSET_VAR,
} from '../styles/interactive-web-css';
import { DISABLED_OPACITY } from '../styles/tokens';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === '__tests__' || entry === 'node_modules' ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) && !/\.(test|spec|stories)\.tsx?$/.test(entry) ? [full] : [];
  });
}

const FILES = sourceFiles().map((path) => ({
  path: path.slice(SRC.length + 1),
  text: readFileSync(path, 'utf8'),
}));

describe('interactiveWebCss builds what its callers actually needed', () => {
  const base = {
    selector: '.x',
    varPrefix: 'bloom-x',
    transition: 'background-color 150ms ease',
  } as const;

  it('emits the canonical outline ring by default', () => {
    const css = interactiveWebCss({ ...base, hover: { declarations: 'color: red;' }, outlineOffset: 2 });
    expect(css).toContain('.x:focus-visible {\n  outline: 2px solid var(--bloom-x-ring, currentColor);');
    expect(css).toContain('outline-offset: 2px;');
    // `:focus-visible`, never `:focus` — a mouse press must not leave a ring.
    expect(css).not.toMatch(/\.x:focus\s*\{/);
  });

  it('emits the two-step ring whose GAP is the surface variable', () => {
    const css = interactiveWebCss({ ...base, focus: { mode: 'ring' } });
    expect(css).toContain(`box-shadow: ${focusRingShadow('--bloom-x-ring')};`);
    expect(css).toContain(`var(${RING_OFFSET_VAR}, ${RING_OFFSET_FALLBACK})`);
  });

  it('defaults the disabled block to the one opacity, and lets a recolouring family opt out', () => {
    expect(interactiveWebCss({ ...base })).toContain(`opacity: ${DISABLED_OPACITY};`);
    expect(interactiveWebCss({ ...base, disabled: { opacity: null } })).not.toContain('opacity:');
    expect(interactiveWebCss({ ...base, disabled: { declarations: 'color: grey;' } })).toContain('color: grey;');
  });

  it('drops the <button> reset and the press scale for a react-native-web caller', () => {
    const rnw = interactiveWebCss({ ...base, reset: 'none' });
    // `display: inline-flex` from a stylesheet changes how an RNW `View` lays out.
    expect(rnw).not.toContain('inline-flex');
    expect(rnw).not.toContain('press-scale');
    expect(interactiveWebCss({ ...base })).toContain('press-scale');
  });

  it('keeps every interactive rule behind the disabled filter', () => {
    const css = interactiveWebCss({ ...base, hover: { declarations: 'color: red;' } });
    for (const line of css.split('\n')) {
      if (/:hover|:active/.test(line)) expect(line).toContain(NOT_DISABLED);
    }
  });
});

describe('one focus-ring mechanism', () => {
  /**
   * Families that name their OWN ring-offset variable instead of
   * {@link RING_OFFSET_VAR}. Each is already surface-derived — the point of the
   * rule — and each knows its surface exactly (a sidebar panel, a select
   * trigger's own token, a settings row's fill), which is better information
   * than the ambient level. An equality, so a FOURTH one has to be argued for.
   */
  const OWN_OFFSET_VARS = [
    '--bloom-sidebar-ring-offset',
    '--bloom-select-ring-offset',
    '--bloom-settings-ring-offset',
    // Not a colour at all: `booking` uses this one as an `outline-offset`
    // LENGTH. It shares the suffix and nothing else.
    '--bloom-booking-ring-offset',
  ] as const;

  it('never hardcodes the gap colour', () => {
    const offenders: string[] = [];
    for (const { path, text } of FILES) {
      for (const line of text.split('\n')) {
        if (!/box-shadow:\s*0 0 0/.test(line)) continue;
        // The gap is the FIRST shadow of a ring. It must be a variable.
        if (/0 0 0 \d+px\s*(#|rgb|white|currentColor)/i.test(line)) offenders.push(`${path}: ${line.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('spells the gap variable one way, with a written list of the families that do not', () => {
    const found = new Set<string>();
    for (const { text } of FILES) {
      for (const match of text.matchAll(/--bloom-[a-z-]*ring-offset/g)) {
        if (match[0] !== RING_OFFSET_VAR) found.add(match[0]);
      }
    }
    expect([...found].sort()).toEqual([...OWN_OFFSET_VARS].sort());
  });

  it('keeps the deprecated literal as a fallback only', () => {
    // `checkbox/shared`'s `FOCUS_RING_OFFSET_COLOR` was the bug's home. It may
    // still exist as an alias of the fallback; it may not be a literal again.
    const checkbox = FILES.find((f) => f.path === 'checkbox/shared.tsx');
    expect(checkbox?.text).toContain('export const FOCUS_RING_OFFSET_COLOR = RING_OFFSET_FALLBACK;');
  });
});

describe('one disabled opacity', () => {
  /**
   * `opacity: <literal>` guarded by a disabled-ish condition. The convention is
   * in `styles/tokens.ts` `DISABLED_OPACITY`: recolour if you can, and if you
   * fade, fade by that.
   */
  it('has no family-local disabled fade', () => {
    const offenders: string[] = [];
    for (const { path, text } of FILES) {
      for (const [index, line] of text.split('\n').entries()) {
        const match = line.match(/opacity:\s*disabled\s*\?\s*(0\.\d+|DISABLED_OPACITY)\s*[:?]/);
        if (match && match[1] !== 'DISABLED_OPACITY' && match[1] !== String(DISABLED_OPACITY)) {
          offenders.push(`${path}:${index + 1} ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('is the value the builder emits', () => {
    expect(DISABLED_OPACITY).toBe(0.5);
    expect(interactiveWebCss({ selector: '.x', varPrefix: 'x', transition: 'none' })).toContain(
      `opacity: ${DISABLED_OPACITY};`,
    );
  });
});

describe('the builder is used, not just its adopter hook', () => {
  /**
   * The point of item 6: `interactiveWebCss` existed and nobody called it, so
   * every family hand-wrote its sheet. This counts the callers, as a FLOOR that
   * moves up — a migration away from the builder has to change this number.
   */
  it('has at least the families migrated to it', () => {
    const callers = FILES.filter((f) => /\binteractiveWebCss\(/.test(f.text)).map((f) => f.path);
    expect(callers).toEqual(expect.arrayContaining([
      // `FilterChip` and `FilterTextButton` folded into `Chip` and `Button`
      // after this list was written; the recipe now reaches those call sites
      // through the two base families instead.
      'chip/Chip.tsx',
      'button/Button.web.tsx',
      'stay-filters/PropertyTypeTiles.tsx',
      'stepper/Stepper.tsx',
    ]));
    expect(callers.length).toBeGreaterThanOrEqual(10);
  });
});
