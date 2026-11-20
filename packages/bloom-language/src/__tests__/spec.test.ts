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
  ENVIRONMENT,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LAYER_RANK,
  LEADING,
  type NODE_MODIFIERS,
  OPACITY,
  SPACE,
  TYPE_RAMP,
} from '../generated/spec.generated';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import type {
  ActionBarView,
  AppLayoutView,
  NavStackView,
  RouteView,
  TabNavigatorView,
  ActionGroupView,
  ActionView,
  AvatarView,
  BottomBarView,
  ButtonView,
  ComposedView,
  EmbedView,
  FabView,
  HeaderView,
  IconView,
  ImageView,
  MenuContentView,
  MenuDividerView,
  MenuItemView,
  MenuSectionView,
  MenuSubmenuView,
  MenuView,
  SpacerView,
  StackView,
  TabView,
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
      Same<MethodsOf<FabView>, Of<'fab'>>,
      Same<MethodsOf<MenuView>, Of<'menu'>>,
      Same<MethodsOf<MenuItemView>, Of<'menuItem'>>,
      Same<MethodsOf<MenuSubmenuView>, Of<'menuSubmenu'>>,
      Same<MethodsOf<MenuSectionView>, Of<'menuSection'>>,
      Same<MethodsOf<MenuDividerView>, Of<'menuDivider'>>,
      Same<MethodsOf<MenuContentView>, Of<'menuContent'>>,
      Same<MethodsOf<HeaderView>, Of<'header'>>,
      Same<MethodsOf<BottomBarView>, Of<'bottomBar'>>,
      Same<MethodsOf<TabView>, Of<'tab'>>,
      Same<MethodsOf<AppLayoutView>, Of<'appLayout'>>,
      Same<MethodsOf<NavStackView>, Of<'navStack'>>,
      Same<MethodsOf<RouteView>, Of<'route'>>,
      Same<MethodsOf<TabNavigatorView>, Of<'tabView'>>,
    ] = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
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
