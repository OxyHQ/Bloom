import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BloomImageContentFit } from '@oxy.so/bloom/image';
import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import {
  AVATAR_SIZE,
  COLORS,
  CORNER,
  DURATION,
  EASING,
  ENVIRONMENT,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LAYER_RANK,
  LEADING,
  MOTION,
  type NODE_MODIFIERS,
  OPACITY,
  SCALE,
  SPACE,
  TYPE_RAMP,
} from '../generated/spec.generated';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import type {
  ActionBarView,
  ActionGroupView,
  ActionView,
  AvatarView,
  ButtonView,
  ComposedView,
  EmbedView,
  IconView,
  ImageView,
  SpacerView,
  StackView,
  TextView,
} from '../node';
import type { ContentFit } from '../tokens';

const BLOOM_SRC = join(__dirname, '../../../../src');
const PACKAGE = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(BLOOM_SRC, path), 'utf8');

/** `_2xl` → `2xl`: Bloom's JS keys spell a leading digit with an underscore. */
const unprefixed = (table: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(table).map(([key, value]) => [key.replace(/^_/, ''), value]));

describe('the spec is Bloom’s scales, rung for rung', () => {
  it('space, corner, size, leading and hit slop equal Bloom’s tokens', () => {
    expect(SPACE).toEqual({ none: 0, ...unprefixed(tokens.space) });
    expect(CORNER).toEqual(unprefixed(tokens.borderRadius));
    expect(FONT_SIZE).toEqual(unprefixed(tokens.fontSize));
    expect(LEADING).toEqual(tokens.lineHeight);
    expect(HIT_SLOP).toEqual(tokens.hitSlop);
    expect(OPACITY.disabled).toBe(tokens.DISABLED_OPACITY);
    expect(DURATION).toEqual(tokens.animation.duration);
  });

  it('an image’s content fits are BloomImage’s', () => {
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    // A type error here means spec/language.json and BloomImage's contentFit disagree.
    const same: Same<ContentFit, BloomImageContentFit> = true;
    expect(same).toBe(true);
  });

  it('the type ramp is Bloom’s TYPE_SCALE, entry for entry', () => {
    expect(Object.keys(TYPE_RAMP).sort()).toEqual(Object.keys(TYPE_SCALE).sort());
    for (const [variant, step] of Object.entries(TYPE_SCALE)) {
      expect(TYPE_RAMP[variant as keyof typeof TYPE_RAMP]).toEqual([
        step.fontSize,
        step.lineHeight,
        step.letterSpacing,
        step.fontWeight,
      ]);
    }
  });

  it('icon and avatar rungs match Bloom’s own tables', () => {
    // Both modules pull the theme provider at import, so their text is read.
    const icons = read('icons/shared.tsx');
    for (const [name, size] of Object.entries(ICON_SIZE)) {
      expect(icons).toMatch(new RegExp(`\\n\\s+'?${name}'?: ${size},`));
    }
    const avatars = read('avatar/initials.ts');
    for (const [name, size] of Object.entries(AVATAR_SIZE)) {
      expect(avatars).toMatch(new RegExp(`\\n\\s+${name}: ${size},`));
    }
  });

  it('each colour role names the theme colour Bloom builds from its CSS variable', () => {
    // build-theme.ts: `textSecondary: g('muted-foreground')`: the ThemeColors key
    // and the canonical variable the web reads are one pair.
    const theme = read('theme/build-theme.ts');
    for (const { paint, css } of Object.values(COLORS)) {
      expect(theme).toMatch(new RegExp(`\\n\\s+${paint}: g\\('${css}'\\),`));
    }
  });

  it('the strongest glass tint is the opacity Surface already gives an opaque fill on the web', () => {
    expect(read('surface/shared.ts')).toMatch(
      new RegExp(`SURFACE_TINT_OPACITY = ${GLASS_OPACITY.strong};`),
    );
  });
});

describe('each motion token is the motion its Bloom owner plays', () => {
  const bezier = (name: keyof typeof EASING) => `Easing.bezier(${EASING[name].join(', ')})`;
  const timing = (name: keyof typeof MOTION) => MOTION[name] as { duration: number };

  it('press scale: PressableScale’s timing (Reanimated’s default curve) and target scale', () => {
    const press = read('pressable-scale/PressableScale.tsx');
    expect(press).toMatch(`const DURATION = ${timing('press').duration};`);
    expect(press).toMatch('scale.value = withTiming(targetScale, { duration: DURATION });');
    expect(press).toMatch(`targetScale = ${SCALE.pressed}`);
    expect(MOTION.press.easing).toEqual(EASING.inOutQuad);
  });

  it('the like pop and the count roll: the engagement bar’s constants', () => {
    const engagement = read('engagement-bar/constants.ts');
    expect(engagement).toMatch(`POP_MS = ${timing('pop').duration};`);
    expect(engagement).toMatch(`ROLL_MS = ${timing('roll').duration};`);
    expect(engagement).toMatch(`EASE_OUT = ${bezier('outExpo')};`);
    expect(MOTION.pop.easing).toEqual(EASING.outExpo);
    expect(MOTION.roll.easing).toEqual(EASING.outExpo);
    const pop = read('engagement-bar/EngagementPop.tsx');
    expect(pop).toMatch(`withTiming(${SCALE.dip}, QUICK)`);
    expect(pop).toMatch(`withTiming(${SCALE.swell}, SWELL)`);
  });

  it('the tab indicator: the underline’s slide and the highlight’s fade', () => {
    const tabs = read('tabs/Tabs.tsx');
    expect(tabs).toMatch(
      `UNDERLINE_TIMING = { duration: ${timing('slide').duration}, easing: ${bezier('ease')} };`,
    );
    expect(tabs).toMatch(`HIGHLIGHT_FADE = { duration: ${timing('fade').duration} };`);
    expect(MOTION.fade.easing).toEqual(EASING.inOutQuad);
  });

  it('the toast: its enter, exit and restack', () => {
    const constants = read('toast/constants.ts');
    expect(constants).toMatch(`ENTERING_ANIMATION_DURATION = ${timing('enter').duration};`);
    expect(constants).toMatch(`STACKING_ANIMATION_DURATION = ${timing('restack').duration};`);
    const animations = read('toast/animations.ts');
    expect(animations).toMatch(`EASE_OUT_QUART = ${bezier('outQuart')};`);
    expect(animations).toMatch(`EXIT_DURATION = ${timing('exit').duration};`);
    expect(MOTION.enter.easing).toEqual(EASING.outQuart);
    expect(MOTION.restack.easing).toEqual(EASING.outQuart);
    // A Keyframe's segments are linear unless a keyframe names a curve.
    expect(MOTION.exit.easing).toEqual(EASING.linear);
  });

  it('present and dismiss: MOTION_RECIPES (withTiming, its default curve)', () => {
    const recipes = read('motion/recipes.ts');
    expect(recipes).toMatch(`present: { duration: ${timing('present').duration}, reduceMotion`);
    expect(recipes).toMatch(`dismiss: { duration: ${timing('dismiss').duration}, reduceMotion`);
    expect(MOTION.present.easing).toEqual(EASING.inOutQuad);
    expect(MOTION.dismiss.easing).toEqual(EASING.inOutQuad);
  });

  it('CSS ease-out is RollingText’s whole-text curve', () => {
    expect(read('motion/RollingText.tsx')).toMatch(`const WHOLE_EASING = ${bezier('easeOut')};`);
  });
});

describe('the spec drives the rules', () => {
  it('layering and the environment are the spec’s', () => {
    expect(LAYER_RANK.padding).toBeLessThan(LAYER_RANK.background);
    expect(LAYER_RANK.glass).toBe(LAYER_RANK.background);
    expect(ENVIRONMENT).toEqual(['foreground', 'font', 'weight', 'leading']);
  });

  it('each node type exposes exactly the modifiers the spec gives its kind', () => {
    type MethodsOf<T> = {
      [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
    }[keyof T];
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    type Of<K extends keyof typeof NODE_MODIFIERS> = (typeof NODE_MODIFIERS)[K][number];
    // A type error here means a node interface and spec/language.json disagree.
    const checks: [
      Same<MethodsOf<StackView>, Of<'stack'>>,
      Same<MethodsOf<SpacerView>, Of<'spacer'>>,
      Same<MethodsOf<TextView>, Of<'text'>>,
      Same<MethodsOf<IconView>, Of<'icon'>>,
      Same<MethodsOf<AvatarView>, Of<'avatar'>>,
      Same<MethodsOf<ImageView>, Of<'image'>>,
      Same<MethodsOf<ButtonView>, Of<'button'>>,
      Same<MethodsOf<ActionView>, Of<'action'>>,
      Same<MethodsOf<ActionBarView>, Of<'actionBar'>>,
      Same<MethodsOf<ActionGroupView>, Of<'actionGroup'>>,
      Same<MethodsOf<EmbedView>, Of<'embed'>>,
      Same<MethodsOf<ComposedView>, Of<'view'>>,
    ] = [true, true, true, true, true, true, true, true, true, true, true, true];
    expect(checks.every(Boolean)).toBe(true);
  });

  it('every generated class is in the sheet once', () => {
    const names = Object.values(WEB_CLASS);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(WEB_SHEET.split('\n').filter((rule) => rule.startsWith(`.${name}{`))).toHaveLength(1);
    }
  });

  it('the generated outputs are current with the spec', () => {
    const script = join(PACKAGE, 'scripts/generate.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
