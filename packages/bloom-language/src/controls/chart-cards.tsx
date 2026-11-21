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
  RadarVariant,
  SparklineTone,
  SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length } from './product';

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
export type BarListCardOptions = Omit<BarListCardProps, Drawn | Inks>;
export type ChartCardSurfaceOptions = Omit<
  ChartCardSurfaceProps,
  Drawn | 'children' | 'gap' | 'height'
> & { readonly height?: SpaceToken | 'auto' };
export type ChartHeadlineOptions = Omit<ChartHeadlineProps, Drawn | 'label'>;
export type ChartStatTilesOptions = Omit<ChartStatTilesProps, Drawn | 'items'>;
export type ContributionsCardOptions = Omit<ContributionsCardProps, Drawn | Inks>;
export type HeatmapChartCardOptions = Omit<HeatmapChartCardProps, Drawn | Inks>;
export type LineChartCardOptions = Omit<LineChartCardProps, Drawn | Inks | 'shape'>;
export type RadarChartCardOptions = Omit<RadarChartCardProps, Drawn | 'variant'>;
export type SleepScoreCardOptions = Omit<SleepScoreCardProps, Drawn | 'metrics' | 'height'> & {
  readonly height?: SpaceToken;
};
export type SparklineOptions = Omit<
  SparklineProps,
  Drawn | Inks | 'data' | 'tone' | 'width' | 'height'
> & { readonly width?: SpaceToken; readonly height?: SpaceToken };
export type StageBarsCardOptions = Omit<StageBarsCardProps, Drawn>;
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
}
/** Bloom `SleepScoreCard`: a score from its metrics. */
export type SleepScoreCardView = ViewModifiers<SleepScoreCardView>;
/** Bloom `Sparkline`: a small line of values. */
export interface SparklineView extends ViewModifiers<SparklineView> {
  /** `accent` (default), `positive`, `negative` or `neutral`. */
  tint(value: SparklineTone): SparklineView;
}
/** Bloom `StageBarsCard`: a funnel's stages as bars. */
export type StageBarsCardView = ViewModifiers<StageBarsCardView>;
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
/** Bloom `ChartCardSurface` around `children`. */
export function ChartCardSurface(
  options: ChartCardSurfaceOptions,
  ...children: Child[]
): ChartCardSurfaceView {
  return new Node('chartCardSurface', { options }, children);
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

interface CardProps<O> {
  readonly options: O;
  readonly [key: string]: unknown;
}
const propsOf = <O,>(d: ControlDraw) => d.node.props as CardProps<O>;

/** A card's own colours, painted from their roles. */
const inks = (d: ControlDraw) => ({
  color: d.own('tint')?.value as ColorToken | undefined,
  activeColor: d.own('activeTint')?.value,
});

/** A card that takes its content as props: the node's props, its options spread, drawn with its colours. */
function card(host: unknown, extra: (d: ControlDraw) => Record<string, unknown>): ControlRenderer {
  return (d) => {
    const { options, ...content } = propsOf<object>(d);
    return d.pressAround((props) =>
      d.painted(host, { ...props, ...options, ...content, ...extra(d) }, inks(d)),
    );
  };
}
const none = () => ({});

export const CHART_CARDS: Record<ChartCardKind, ControlRenderer> = {
  areaChartCard: card(BloomAreaChartCard, (d) => ({
    variant: d.own('style')?.value,
    shape: d.own('shape')?.value,
  })),
  barListCard: card(BloomBarListCard, none),
  chartCardSurface: (d) => {
    const { options } = propsOf<ChartCardSurfaceOptions>(d);
    const { height } = options;
    return d.pressAround((props) =>
      d.component(
        BloomChartCardSurface,
        {
          ...props,
          ...options,
          height: height === 'auto' ? height : length(height),
          gap: length(d.own('spacing')?.value as SpaceToken | undefined),
        },
        ...d.children(d.node.children),
      ),
    );
  },
  chartHeadline: card(BloomChartHeadline, none),
  chartStatTiles: card(BloomChartStatTiles, none),
  contributionsCard: card(BloomContributionsCard, none),
  heatmapChartCard: card(BloomHeatmapChartCard, none),
  lineChartCard: card(BloomLineChartCard, (d) => ({ shape: d.own('shape')?.value })),
  radarChartCard: card(BloomRadarChartCard, (d) => ({ variant: d.own('style')?.value })),
  sleepScoreCard: card(BloomSleepScoreCard, (d) => ({
    height: length(propsOf<SleepScoreCardOptions>(d).options.height),
  })),
  sparkline: (d) => {
    const { data, options } = propsOf<SparklineOptions>(d);
    return d.pressAround((props) =>
      d.component(BloomSparkline, {
        ...props,
        ...options,
        data,
        tone: d.own('tint')?.value,
        width: length(options.width),
        height: length(options.height),
      }),
    );
  },
  stageBarsCard: card(BloomStageBarsCard, none),
  stepsCard: card(BloomStepsCard, none),
  tokensChartCard: card(BloomTokensChartCard, (d) => ({
    plotHeight: length(propsOf<TokensChartCardOptions>(d).options.plotHeight),
  })),
};
