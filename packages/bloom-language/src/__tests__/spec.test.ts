import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BloomImageContentFit } from '@oxy.so/bloom/image';
import { tokens } from '@oxy.so/bloom/styles';
import { TYPE_SCALE } from '@oxy.so/bloom/typography';
import {
  EASING as BLOOM_EASING,
  MOTION as BLOOM_MOTION,
  SCALE as BLOOM_SCALE,
} from '@oxy.so/bloom/motion';
import {
  AVATAR_SIZE,
  BORDER_WIDTH,
  COLORS,
  CORNER,
  DURATION,
  EASING,
  ENVIRONMENT,
  ENVIRONMENT_DEFAULTS,
  FONT_SIZE,
  GLASS_OPACITY,
  HIT_SLOP,
  ICON_SIZE,
  LAYER_RANK,
  LEADING,
  LEADING_PX,
  MOTION,
  type NODE_MODIFIERS,
  OPACITY,
  ROTATION,
  SCALE,
  SHADOW,
  SPACE,
  TYPE_RAMP,
  TRACKING,
  TRACKING_PX,
  Z_INDEX,
} from '../generated/spec.generated';
import { SHADOW_BOX } from './support/bloom-design-tokens';
import { WEB_CLASS, WEB_SHEET } from '../generated/web-sheet.generated';
import type {
  ActionBarView,
  AppLayoutView,
  NavStackView,
  RouteView,
  TabNavigatorView,
  ActionGroupView,
  ActionView,
  AvatarGroupView,
  AvatarView,
  BadgeView,
  IconCircleView,
  LoadingView,
  SkeletonGroupView,
  SkeletonView,
  BottomBarView,
  ButtonGroupView,
  ButtonView,
  ShapeView,
  ComposedView,
  EmbedView,
  FabView,
  HeaderView,
  IconView,
  ImageView,
  MenuActionsView,
  MenuContentView,
  AspectRatioView,
  DividerView,
  FillView,
  GridView,
  MenuItemView,
  MenuSectionView,
  MenuSubmenuView,
  MenuView,
  LottieView,
  SpacerView,
  StackView,
  TabView,
  TextView,
} from '../node';
import type {
  DatePickerView,
  DateRangePickerView,
  CalendarView,
  RangeCalendarView,
  TimeFieldView,
} from '../controls/date-picker';
import type {
  RatingView,
  RatingInputView,
  RatingBarView,
  RatingSummaryView,
} from '../controls/rating';
import type { MeterView, MeterRingView, StatBarView } from '../controls/stat-bar';
import type {
  TableView,
  TableHeaderView,
  TableColumnView,
  TableBodyView,
  TableRowView,
  TableCellView,
} from '../controls/table';
import type {
  ListItemView,
  ListView,
  VirtualListView,
  ListSelectionBarView,
} from '../controls/list';
import type { CarouselView, CarouselItemView, CarouselDotsView } from '../controls/carousel';
import type { MarkdownView } from '../controls/markdown';
import type { SliderView, RangeSliderView } from '../controls/slider';
import type {
  AccordionView,
  AccordionItemView,
  AccordionTriggerView,
  AccordionContentView,
} from '../controls/accordion';
import type { CodeView, PreView, CodeLinesView, CodeBlockView } from '../controls/code';
import type { StepperView, StepperRowView } from '../controls/stepper';
import type { TooltipView } from '../controls/tooltip';
import type { BreadcrumbView, BreadcrumbItemView } from '../controls/breadcrumb';
import type { ActivityHeatmapView } from '../controls/activity-heatmap';
import type { TagFieldView } from '../controls/tag-field';
import type { FileUploadView } from '../controls/file-upload';
import type { VideoView } from '../controls/video-view';
import type { ColorSwatchPickerView } from '../controls/color-swatch-picker';
import type { InputOtpView } from '../controls/input-otp';
import type { ContentFit } from '../tokens';

const BLOOM_SRC = join(__dirname, '../../../../src');
const PACKAGE = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(BLOOM_SRC, path), 'utf8');

/** A numeric token: an exact value carried over from apps (`'44'`, `'28px'`, `'-0.02em'`), not a design rung. */
const NUMERIC = /^-?\d+(\.\d+)?(px|em)?$/;
/** A scale's named rungs: the design scale, which Bloom owns. */
const named = (scale: Record<string, number>) =>
  Object.fromEntries(Object.entries(scale).filter(([name]) => !NUMERIC.test(name)));

/** `_2xl` → `2xl`: Bloom's JS keys spell a leading digit with an underscore. */
const unprefixed = (table: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(table).map(([key, value]) => [key.replace(/^_/, ''), value]));

describe('the spec is Bloom’s scales, rung for rung', () => {
  it('space, corner, size, leading and hit slop equal Bloom’s tokens', () => {
    expect(named(SPACE)).toEqual({ none: 0, ...unprefixed(tokens.space) });
    expect(named(CORNER)).toEqual(unprefixed(tokens.borderRadius));
    expect(named(FONT_SIZE)).toEqual(unprefixed(tokens.fontSize));
    expect(LEADING).toEqual(tokens.lineHeight);
    expect(HIT_SLOP).toEqual(tokens.hitSlop);
    // The language names Bloom's one disabled fade neutrally: it is any half opacity, not only a disabled control's.
    expect(OPACITY.half).toBe(tokens.DISABLED_OPACITY);
    expect(DURATION).toEqual(tokens.animation.duration);
  });

  it('a numeric token is its own value, in its scale’s unit: an exact value carried over from apps', () => {
    const scales: [Record<string, number>, string, number][] = [
      [SPACE, '', 1],
      [CORNER, '', 1],
      [FONT_SIZE, '', 1],
      [LEADING_PX, 'px', 1],
      [TRACKING, 'em', 1],
      [TRACKING_PX, 'px', 1],
      [OPACITY, '', 100],
      [Z_INDEX, '', 1],
      [SCALE, '', 100],
      [BORDER_WIDTH as unknown as Record<string, number>, '', 1],
      [ROTATION, '', 1],
    ];
    let checked = 0;
    for (const [scale, unit, factor] of scales) {
      for (const [name, value] of Object.entries(scale)) {
        if (!NUMERIC.test(name)) continue;
        expect(name).toBe(`${Number((value * factor).toFixed(6))}${unit}`);
        checked += 1;
      }
    }
    // Vacuity floor: a spec with no numeric tokens checks nothing.
    expect(checked).toBeGreaterThanOrEqual(50);
    // Every px line height and tracking is numeric; the named ones are ratios and em.
    expect(Object.keys(LEADING_PX).every((name) => NUMERIC.test(name))).toBe(true);
    expect(Object.keys(LEADING).some((name) => NUMERIC.test(name))).toBe(false);
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
    // and the canonical variable the web reads are one pair. A fixed colour
    // (`white: '#ffffff'`) is the same literal on both sides.
    const theme = read('theme/build-theme.ts');
    for (const { paint, web } of Object.values(COLORS)) {
      const variable = /^var\(--([\w-]+)\)$/.exec(web)?.[1];
      expect(theme).toMatch(
        new RegExp(`\\n\\s+${paint}: ${variable ? `g\\('${variable}'\\)` : `'${web}'`},`),
      );
    }
  });

  it('a text with no font measures its leading and tracking from Bloom Text’s own size', () => {
    expect(read('typography/Typography.tsx')).toMatch(
      new RegExp(
        `DEFAULT_TEXT_TYPOGRAPHY: TextStyle = \\{\\n\\s+fontSize: ${ENVIRONMENT_DEFAULTS.fontSize},`,
      ),
    );
  });

  it('shadows are Bloom’s elevation roles; stacking levels are Bloom’s Z_INDEX', () => {
    // A shadow that is no role is Tailwind's own, named by its exact box-shadow.
    const roles = Object.fromEntries(
      Object.entries(SHADOW).filter(([name, value]) => name !== value),
    );
    expect(roles).toEqual(SHADOW_BOX);
    expect(Object.keys(SHADOW).length - Object.keys(roles).length).toBe(7);
    const levels = read('styles/z-index.ts');
    for (const [name, level] of Object.entries(named(Z_INDEX))) {
      expect(levels).toMatch(new RegExp(`\\n\\s+${name}: ${level},`));
    }
  });

  it('scale factors are Bloom’s own: a press, the engagement pop’s dip and swell', () => {
    // Bloom's PressableScale and engagement pop play these through its motion
    // engine (`SCALE` in @oxy.so/bloom/motion), which the motion table test holds equal.
    expect(named(SCALE)).toEqual({ dip: 0.7, pressed: 0.98, full: 1, swell: 1.2 });
  });

  it('the strongest glass tint is the opacity Surface already gives an opaque fill on the web', () => {
    expect(read('surface/shared.ts')).toMatch(
      new RegExp(`SURFACE_TINT_OPACITY = ${GLASS_OPACITY.strong};`),
    );
  });
});

describe('motion tokens are Bloom’s motion table', () => {
  it('each motion, curve and scale is Bloom’s own, by name (Bloom’s animations play these)', () => {
    expect(MOTION).toEqual(BLOOM_MOTION);
    expect(EASING).toEqual(BLOOM_EASING);
    // The scale's named rungs; its numeric ones are factors carried over from apps.
    expect(named(SCALE)).toEqual(BLOOM_SCALE);
  });
});

describe('the spec drives the rules', () => {
  it('layering and the environment are the spec’s', () => {
    expect(LAYER_RANK.padding).toBeLessThan(LAYER_RANK.background);
    expect(LAYER_RANK.glass).toBe(LAYER_RANK.background);
    expect(ENVIRONMENT).toEqual(['foreground', 'font', 'weight', 'leading', 'tracking']);
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
      Same<MethodsOf<AvatarGroupView>, Of<'avatarGroup'>>,
      Same<MethodsOf<BadgeView>, Of<'badge'>>,
      Same<MethodsOf<IconCircleView>, Of<'iconCircle'>>,
      Same<MethodsOf<LoadingView>, Of<'loading'>>,
      Same<MethodsOf<SkeletonView>, Of<'skeleton'>>,
      Same<MethodsOf<SkeletonGroupView>, Of<'skeletonGroup'>>,
      Same<MethodsOf<ImageView>, Of<'image'>>,
      Same<MethodsOf<ButtonView>, Of<'button'>>,
      Same<MethodsOf<ButtonGroupView>, Of<'buttonGroup'>>,
      Same<MethodsOf<ShapeView>, Of<'shape'>>,
      Same<MethodsOf<ActionView>, Of<'action'>>,
      Same<MethodsOf<ActionBarView>, Of<'actionBar'>>,
      Same<MethodsOf<ActionGroupView>, Of<'actionGroup'>>,
      Same<MethodsOf<EmbedView>, Of<'embed'>>,
      Same<MethodsOf<LottieView>, Of<'lottie'>>,
      Same<MethodsOf<ComposedView>, Of<'view'>>,
      Same<MethodsOf<FabView>, Of<'fab'>>,
      Same<MethodsOf<MenuView>, Of<'menu'>>,
      Same<MethodsOf<MenuItemView>, Of<'menuItem'>>,
      Same<MethodsOf<MenuSubmenuView>, Of<'menuSubmenu'>>,
      Same<MethodsOf<MenuSectionView>, Of<'menuSection'>>,
      Same<MethodsOf<DividerView>, Of<'divider'>>,
      Same<MethodsOf<FillView>, Of<'fill'>>,
      Same<MethodsOf<AspectRatioView>, Of<'ratio'>>,
      Same<MethodsOf<GridView>, Of<'grid'>>,
      Same<MethodsOf<MenuContentView>, Of<'menuContent'>>,
      Same<MethodsOf<MenuActionsView>, Of<'menuActions'>>,
      Same<MethodsOf<HeaderView>, Of<'header'>>,
      Same<MethodsOf<BottomBarView>, Of<'bottomBar'>>,
      Same<MethodsOf<TabView>, Of<'tab'>>,
      Same<MethodsOf<AppLayoutView>, Of<'appLayout'>>,
      Same<MethodsOf<NavStackView>, Of<'navStack'>>,
      Same<MethodsOf<RouteView>, Of<'route'>>,
      Same<MethodsOf<TabNavigatorView>, Of<'tabView'>>,
      Same<MethodsOf<DatePickerView>, Of<'datePicker'>>,
      Same<MethodsOf<DateRangePickerView>, Of<'dateRangePicker'>>,
      Same<MethodsOf<CalendarView>, Of<'calendar'>>,
      Same<MethodsOf<RangeCalendarView>, Of<'rangeCalendar'>>,
      Same<MethodsOf<TimeFieldView>, Of<'timeField'>>,
      Same<MethodsOf<RatingView>, Of<'rating'>>,
      Same<MethodsOf<RatingInputView>, Of<'ratingInput'>>,
      Same<MethodsOf<RatingBarView>, Of<'ratingBar'>>,
      Same<MethodsOf<RatingSummaryView>, Of<'ratingSummary'>>,
      Same<MethodsOf<MeterView>, Of<'meter'>>,
      Same<MethodsOf<MeterRingView>, Of<'meterRing'>>,
      Same<MethodsOf<StatBarView>, Of<'statBar'>>,
      Same<MethodsOf<TableView>, Of<'table'>>,
      Same<MethodsOf<TableHeaderView>, Of<'tableHeader'>>,
      Same<MethodsOf<TableColumnView>, Of<'tableColumn'>>,
      Same<MethodsOf<TableBodyView>, Of<'tableBody'>>,
      Same<MethodsOf<TableRowView>, Of<'tableRow'>>,
      Same<MethodsOf<TableCellView>, Of<'tableCell'>>,
      Same<MethodsOf<ListItemView>, Of<'listItem'>>,
      Same<MethodsOf<ListView>, Of<'list'>>,
      Same<MethodsOf<VirtualListView>, Of<'virtualList'>>,
      Same<MethodsOf<ListSelectionBarView>, Of<'listSelectionBar'>>,
      Same<MethodsOf<CarouselView>, Of<'carousel'>>,
      Same<MethodsOf<CarouselItemView>, Of<'carouselItem'>>,
      Same<MethodsOf<CarouselDotsView>, Of<'carouselDots'>>,
      Same<MethodsOf<MarkdownView>, Of<'markdown'>>,
      Same<MethodsOf<SliderView>, Of<'slider'>>,
      Same<MethodsOf<RangeSliderView>, Of<'rangeSlider'>>,
      Same<MethodsOf<AccordionView>, Of<'accordion'>>,
      Same<MethodsOf<AccordionItemView>, Of<'accordionItem'>>,
      Same<MethodsOf<AccordionTriggerView>, Of<'accordionTrigger'>>,
      Same<MethodsOf<AccordionContentView>, Of<'accordionContent'>>,
      Same<MethodsOf<CodeView>, Of<'code'>>,
      Same<MethodsOf<PreView>, Of<'pre'>>,
      Same<MethodsOf<CodeLinesView>, Of<'codeLines'>>,
      Same<MethodsOf<CodeBlockView>, Of<'codeBlock'>>,
      Same<MethodsOf<StepperView>, Of<'stepper'>>,
      Same<MethodsOf<StepperRowView>, Of<'stepperRow'>>,
      Same<MethodsOf<TooltipView>, Of<'tooltip'>>,
      Same<MethodsOf<BreadcrumbView>, Of<'breadcrumb'>>,
      Same<MethodsOf<BreadcrumbItemView>, Of<'breadcrumbItem'>>,
      Same<MethodsOf<ActivityHeatmapView>, Of<'activityHeatmap'>>,
      Same<MethodsOf<TagFieldView>, Of<'tagField'>>,
      Same<MethodsOf<FileUploadView>, Of<'fileUpload'>>,
      Same<MethodsOf<VideoView>, Of<'video'>>,
      Same<MethodsOf<ColorSwatchPickerView>, Of<'colorSwatchPicker'>>,
      Same<MethodsOf<InputOtpView>, Of<'inputOtp'>>,
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

  it('the className table is current with the spec and the apps’ usage', () => {
    const script = join(PACKAGE, 'scripts/generate-classnames.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('the generated outputs are current with the spec', () => {
    const script = join(PACKAGE, 'scripts/generate.mjs');
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
