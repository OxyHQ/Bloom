import {
  AreaChartCard as BloomAreaChartCard,
  type AreaChartCardProps,
  BarListCard as BloomBarListCard,
  type BarListCardProps,
  ChartCardSurface as BloomChartCardSurface,
  type ChartCardSurfaceProps,
  ChartHeadline as BloomChartHeadline,
  type ChartHeadlineProps,
  type ChartStatTile,
  ChartStatTiles as BloomChartStatTiles,
  type ChartStatTilesProps,
  ContributionsCard as BloomContributionsCard,
  type ContributionsCardProps,
  HeatmapChartCard as BloomHeatmapChartCard,
  type HeatmapChartCardProps,
  LineChartCard as BloomLineChartCard,
  type LineChartCardProps,
  RadarChartCard as BloomRadarChartCard,
  type RadarChartCardProps,
  type SleepMetric,
  SleepScoreCard as BloomSleepScoreCard,
  type SleepScoreCardProps,
  Sparkline as BloomSparkline,
  type SparklineProps,
  StageBarsCard as BloomStageBarsCard,
  type StageBarsCardProps,
  StepsCard as BloomStepsCard,
  type StepsCardProps,
  type StepsPoint,
  TokensChartCard as BloomTokensChartCard,
  type TokensChartCardProps,
  type TokensPoint,
} from '@oxy.so/bloom/chart-cards';

import { type Child, Node, type ViewModifiers } from '../node';
import type {
  AreaVariant,
  ChartShape,
  ColorToken,
  RadarLegend,
  RadarVariant,
  SparklineTone,
  SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length, product } from './product';

/** Dashboard chart cards and the pieces they share. */
export type ChartCardKind =
  | 'areaChartCard'
  | 'barListCard'
  | 'chartCardSurface'
  | 'chartHeadline'
  | 'chartStatTiles'
  | 'contributionsCard'
  | 'heatmapChartCard'
  | 'lineChartCard'
  | 'radarChartCard'
  | 'sleepScoreCard'
  | 'sparkline'
  | 'stageBarsCard'
  | 'stepsCard'
  | 'tokensChartCard';

/** What every card leaves to the language: its box, its name and its test id. */
type Drawn = 'style' | 'testID' | 'accessibilityLabel';
/** A card's own colours, which are modifiers (roles). */
type Inks = 'color' | 'activeColor';

export type AreaChartCardOptions = Omit<AreaChartCardProps, Drawn | 'variant' | 'shape'>;
export type BarListCardOptions = Omit<BarListCardProps, Drawn | Inks | 'mono'>;
export type ChartCardSurfaceOptions = Omit<
  ChartCardSurfaceProps,
  Drawn | 'children' | 'gap' | 'height'
> & { readonly height?: SpaceToken | 'auto' };
export type ChartHeadlineOptions = Omit<ChartHeadlineProps, Drawn | 'label'>;
export type ChartStatTilesOptions = Omit<ChartStatTilesProps, Drawn | 'items'>;
export type ContributionsCardOptions = Omit<ContributionsCardProps, Drawn | Inks>;
export type HeatmapChartCardOptions = Omit<HeatmapChartCardProps, Drawn | Inks>;
export type LineChartCardOptions = Omit<LineChartCardProps, Drawn | Inks | 'shape'>;
export type RadarChartCardOptions = Omit<RadarChartCardProps, Drawn | 'variant' | 'legend'>;
export type SleepScoreCardOptions = Omit<SleepScoreCardProps, Drawn | 'metrics' | 'height'> & {
  readonly height?: SpaceToken;
};
export type SparklineOptions = Omit<
  SparklineProps,
  Drawn | Inks | 'data' | 'tone' | 'width' | 'height' | 'shape' | 'fill'
> & { readonly width?: SpaceToken; readonly height?: SpaceToken };
export type StageBarsCardOptions = Omit<StageBarsCardProps, Drawn | 'mono'>;
export type StepsCardOptions = Omit<StepsCardProps, Drawn | Inks | 'data'>;
export type TokensChartCardOptions = Omit<
  TokensChartCardProps,
  Drawn | Inks | 'data' | 'plotHeight'
> & { readonly plotHeight?: SpaceToken };

/** A card drawn in one colour role, and another while a point is active. */
interface Inked<Self> {
  /** The series' colour: a colour role (Bloom's chart colour by default). */
  tint(value: ColorToken): Self;
  /** The active point's colour. */
  activeTint(value: ColorToken): Self;
}

/** Bloom `AreaChartCard`: stacked, overlapping or percent areas over a range. */
export interface AreaChartCardView extends ViewModifiers<AreaChartCardView> {
  /** `stacked` (default), `overlap` or `percent`. */
  style(value: AreaVariant): AreaChartCardView;
  /** `curved` (default) or `sharp`. */
  shape(value: ChartShape): AreaChartCardView;
}
/** Bloom `BarListCard`: ranked bars with their values, in tabs. */
export interface BarListCardView extends ViewModifiers<BarListCardView> {
  tint(value: ColorToken): BarListCardView;
  /** One ink for every bar (mid grey on light, near-white on dark). */
  mono(value?: boolean): BarListCardView;
}
/** Bloom `ChartCardSurface`: the card every chart card is drawn on. */
export interface ChartCardSurfaceView extends ViewModifiers<ChartCardSurfaceView> {
  /** The space between its children (Bloom's 16 by default). */
  spacing(value: SpaceToken): ChartCardSurfaceView;
}
/** Bloom `ChartHeadline`: a chart's label, figure and change. */
export type ChartHeadlineView = ViewModifiers<ChartHeadlineView>;
/** Bloom `ChartStatTiles`: the readings under a chart. */
export type ChartStatTilesView = ViewModifiers<ChartStatTilesView>;
/** Bloom `ContributionsCard`: a year of activity as a grid of cells. */
export interface ContributionsCardView extends ViewModifiers<ContributionsCardView> {
  tint(value: ColorToken): ContributionsCardView;
}
/** Bloom `HeatmapChartCard`: values by row and column, in one colour's strengths. */
export interface HeatmapChartCardView
  extends ViewModifiers<HeatmapChartCardView>,
    Inked<HeatmapChartCardView> {}
/** Bloom `LineChartCard`: a line over a range. */
export interface LineChartCardView
  extends ViewModifiers<LineChartCardView>,
    Inked<LineChartCardView> {
  shape(value: ChartShape): LineChartCardView;
}
/** Bloom `RadarChartCard`: values around a polygon. */
export interface RadarChartCardView extends ViewModifiers<RadarChartCardView> {
  /** `filled` (default), `dots`, `lines` or `score`. */
  style(value: RadarVariant): RadarChartCardView;
  /** Its legend at the `bottom` (default), the `top`, or over the chart (`overlay`). */
  legend(value: RadarLegend): RadarChartCardView;
}
/** Bloom `SleepScoreCard`: a score from its metrics. */
export type SleepScoreCardView = ViewModifiers<SleepScoreCardView>;
/** Bloom `Sparkline`: a small line of values. */
export interface SparklineView extends ViewModifiers<SparklineView> {
  /** `accent` (default), `positive`, `negative` or `neutral`. */
  tint(value: SparklineTone): SparklineView;
  /** `curved` (default) or `sharp`. */
  shape(value: ChartShape): SparklineView;
  /** The area under the line, filled. */
  filled(value?: boolean): SparklineView;
}
/** Bloom `StageBarsCard`: a funnel's stages as bars. */
export interface StageBarsCardView extends ViewModifiers<StageBarsCardView> {
  /** One ink for every stage. */
  mono(value?: boolean): StageBarsCardView;
}
/** Bloom `StepsCard`: a day's steps as bars. */
export interface StepsCardView extends ViewModifiers<StepsCardView>, Inked<StepsCardView> {}
/** Bloom `TokensChartCard`: tokens used over time. */
export interface TokensChartCardView
  extends ViewModifiers<TokensChartCardView>,
    Inked<TokensChartCardView> {}

export function AreaChartCard(options: AreaChartCardOptions = {}): AreaChartCardView {
  return new Node('areaChartCard', { options }, []);
}
export function BarListCard(options: BarListCardOptions = {}): BarListCardView {
  return new Node('barListCard', { options }, []);
}
/** Bloom `ChartCardSurface` around `content` (a list of views, keyed by `.id()`, is its children). */
export function ChartCardSurface(
  content: Child,
  options: ChartCardSurfaceOptions = {},
): ChartCardSurfaceView {
  return new Node('chartCardSurface', { options }, [content]);
}
export function ChartHeadline(
  label: string,
  options: ChartHeadlineOptions = {},
): ChartHeadlineView {
  return new Node('chartHeadline', { label, options }, []);
}
export function ChartStatTiles(
  items: readonly ChartStatTile[],
  options: ChartStatTilesOptions = {},
): ChartStatTilesView {
  return new Node('chartStatTiles', { items, options }, []);
}
export function ContributionsCard(options: ContributionsCardOptions = {}): ContributionsCardView {
  return new Node('contributionsCard', { options }, []);
}
export function HeatmapChartCard(options: HeatmapChartCardOptions = {}): HeatmapChartCardView {
  return new Node('heatmapChartCard', { options }, []);
}
export function LineChartCard(options: LineChartCardOptions = {}): LineChartCardView {
  return new Node('lineChartCard', { options }, []);
}
export function RadarChartCard(options: RadarChartCardOptions = {}): RadarChartCardView {
  return new Node('radarChartCard', { options }, []);
}
export function SleepScoreCard(
  metrics: readonly SleepMetric[],
  options: SleepScoreCardOptions = {},
): SleepScoreCardView {
  return new Node('sleepScoreCard', { metrics, options }, []);
}
export function Sparkline(data: readonly number[], options: SparklineOptions = {}): SparklineView {
  return new Node('sparkline', { data, options }, []);
}
export function StageBarsCard(options: StageBarsCardOptions = {}): StageBarsCardView {
  return new Node('stageBarsCard', { options }, []);
}
export function StepsCard(
  data: readonly StepsPoint[],
  options: StepsCardOptions = {},
): StepsCardView {
  return new Node('stepsCard', { data, options }, []);
}
export function TokensChartCard(
  data: readonly TokensPoint[],
  options: TokensChartCardOptions = {},
): TokensChartCardView {
  return new Node('tokensChartCard', { data, options }, []);
}

/** A card's own colours, painted from their roles. */
const inks = (d: ControlDraw) => ({
  color: d.own('tint')?.value as ColorToken | undefined,
  activeColor: d.own('activeTint')?.value,
});

export const CHART_CARDS: Record<ChartCardKind, ControlRenderer> = {
  areaChartCard: product(BloomAreaChartCard, {
    own: (d) => ({ variant: d.own('style')?.value, shape: d.own('shape')?.value }),
  }),
  barListCard: product(BloomBarListCard, {
    colors: inks,
    own: (d) => ({ mono: d.own('mono')?.value }),
  }),
  chartCardSurface: product(BloomChartCardSurface, {
    own: (d) => {
      const { height } = (d.node.props as { options: ChartCardSurfaceOptions }).options;
      return {
        height: height === 'auto' ? height : length(height),
        gap: length(d.own('spacing')?.value as SpaceToken | undefined),
      };
    },
  }),
  chartHeadline: product(BloomChartHeadline),
  chartStatTiles: product(BloomChartStatTiles),
  contributionsCard: product(BloomContributionsCard, { colors: inks }),
  heatmapChartCard: product(BloomHeatmapChartCard, { colors: inks }),
  lineChartCard: product(BloomLineChartCard, {
    own: (d) => ({ shape: d.own('shape')?.value }),
    colors: inks,
  }),
  radarChartCard: product(BloomRadarChartCard, {
    own: (d) => ({ variant: d.own('style')?.value, legend: d.own('legend')?.value }),
  }),
  sleepScoreCard: product(BloomSleepScoreCard, { lengths: ['height'] }),
  sparkline: product(BloomSparkline, {
    lengths: ['width', 'height'],
    own: (d) => ({
      tone: d.own('tint')?.value,
      shape: d.own('shape')?.value,
      fill: d.own('filled')?.value,
    }),
  }),
  stageBarsCard: product(BloomStageBarsCard, { own: (d) => ({ mono: d.own('mono')?.value }) }),
  stepsCard: product(BloomStepsCard, { colors: inks }),
  tokensChartCard: product(BloomTokensChartCard, { lengths: ['plotHeight'], colors: inks }),
};
