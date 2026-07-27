/**
 * Regression guard for the `motion` web fork.
 *
 * The bug: `motion.ts`'s custom worklet builders are INERT on web. Reanimated's
 * web layout-animation manager resolves an animation by preset name, a custom
 * builder has none, and `startWebLayoutAnimation` falls through to
 * `makeElementVisible` — the element appears at its final frame with one
 * `[Reanimated] Couldn't load entering/exiting animation` warning apiece.
 *
 * The trap: rebuilding all three as `Keyframe`s fixes the exits and makes the
 * ENTER worse. Reanimated's `entering` path calls `setElementAnimation` with
 * `shouldSavePosition` TRUE, and any animation name absent from its built-in
 * `Animations` map — which every custom `Keyframe` is, since they mint a fresh
 * `REA-ENTERING-n` rule — also gets a `scheduleAnimationCleanup` that pins the
 * element with `position: absolute` and a frozen box at `duration x 5`. That is
 * failure mode (C) in `~/Oxy/AGENTS.md`.
 *
 * So the invariant is asymmetric, and BOTH halves are load-bearing:
 *   entering -> a PREDEFINED builder (its `presetName` is in `Animations`, so no
 *               cleanup is ever scheduled), never a `Keyframe`.
 *   exiting  -> a `Keyframe` is safe (the cleanup only reaps the throwaway clone)
 *               and is the only mechanism that can express the full shape.
 *
 * The actual motion is verified in a real browser — jest cannot run reanimated's
 * web layout-animation manager.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Keyframe } from 'react-native-reanimated';

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
  ShrinkAndPop,
} from '../motion/motion.web';

const SRC = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/**
 * Upstream's `ReanimatedKeyframe` type hides the instance state that the web
 * layout manager actually reads (`createCustomKeyFrameAnimation` takes
 * `config.definitions` raw, `getDurationFromConfig` takes `config.durationV`), so
 * the test narrows to it with a runtime-checked predicate rather than a cast.
 */
type KeyframeState = {
  definitions: Record<string, Record<string, unknown>>;
  durationV: number | undefined;
};

const isKeyframeState = (value: unknown): value is KeyframeState =>
  value instanceof Keyframe && 'definitions' in value;

const stateOf = (preset: unknown): KeyframeState => {
  if (!isKeyframeState(preset)) {
    throw new Error('expected a Keyframe');
  }
  return preset;
};

describe('motion web fork', () => {
  it('never hands a Keyframe to `entering`', () => {
    // The whole reason the enter and the exits use different mechanisms.
    expect(ScaleAndFadeIn instanceof Keyframe).toBe(false);
    expect(typeof ScaleAndFadeIn).toBe('object');
  });

  it('uses a predefined reanimated builder for the enter', () => {
    const web = read('motion/motion.web.ts');
    expect(web).toMatch(/export const ScaleAndFadeIn[^=]*=\s*FadeIn;/);
    expect(web).toMatch(/import \{[\s\S]*\bFadeIn\b[\s\S]*\} from 'react-native-reanimated'/);
  });

  it('uses a Keyframe for both exits', () => {
    expect(ScaleAndFadeOut instanceof Keyframe).toBe(true);
    expect(ShrinkAndPop instanceof Keyframe).toBe(true);
  });

  it('keeps the full scale + opacity shape on ScaleAndFadeOut', () => {
    expect(stateOf(ScaleAndFadeOut).definitions).toEqual({
      from: { opacity: 1, transform: [{ scale: 1 }] },
      to: { opacity: 0, transform: [{ scale: 0.7 }] },
    });
  });

  /**
   * Every stop declares every animated property, so the CSS the web parser emits
   * does not depend on cross-stop interpolation, and the intermediate values are
   * the native timeline sampled at those instants (250ms total: scale 1 -> 0.7 by
   * 75ms, -> 1.1 by 225ms; opacity held to 125ms, then to 0 by 250ms).
   */
  it('samples the native ShrinkAndPop timeline at every stop', () => {
    const stops = stateOf(ShrinkAndPop).definitions;
    expect(Object.keys(stops)).toEqual(['0', '30', '50', '90', '100']);
    for (const [percent, style] of Object.entries(stops)) {
      expect({ percent, keys: Object.keys(style).sort() }).toEqual({
        percent,
        keys: ['opacity', 'transform'],
      });
    }
    expect(stops['0']).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
    expect(stops['30']).toEqual({ opacity: 1, transform: [{ scale: 0.7 }] });
    expect(stops['90']).toEqual({ opacity: 0.2, transform: [{ scale: 1.1 }] });
    expect(stops['100']).toEqual({ opacity: 0, transform: [{ scale: 1.1 }] });
  });

  it('matches the native durations', () => {
    // `withTiming`'s default for the pair the native file animates, and
    // 75 + 150 for the pop's two sequenced scale legs.
    expect(stateOf(ScaleAndFadeOut).durationV).toBe(300);
    expect(stateOf(ShrinkAndPop).durationV).toBe(250);
  });

  it('leaves the native file on its custom worklet builders', () => {
    const native = read('motion/motion.ts');
    expect(native).toMatch(/'worklet';/);
    expect(native).not.toMatch(/\bKeyframe\b/);
    expect(native).not.toMatch(/\bFadeIn\b/);
  });

  it('is wired as a web-forked subpath', () => {
    const script = readFileSync(
      join(SRC, '..', 'scripts', 'generate-platform-exports.mjs'),
      'utf8',
    );
    // Between the WEB_FORKED_SUBPATHS opener and its closing bracket.
    const forked = script.slice(
      script.indexOf('const WEB_FORKED_SUBPATHS'),
      script.indexOf(']);', script.indexOf('const WEB_FORKED_SUBPATHS')),
    );
    expect(forked).toContain("'./motion'");

    const pkg: { exports: Record<string, { browser?: { import?: string } }> } =
      JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8'));
    expect(pkg.exports['./motion']?.browser?.import).toBe(
      './lib/module/motion/index.web.js',
    );
  });
});
