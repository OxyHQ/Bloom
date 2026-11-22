import {
  AreaChartCard,
  BarListCard,
  ChartCardSurface,
  ChartHeadline,
  ChartStatTiles,
  ContributionsCard,
  HeatmapChartCard,
  LineChartCard,
  RadarChartCard,
  SleepScoreCard,
  Sparkline,
  StageBarsCard,
  StepsCard,
  TokensChartCard,
} from '@oxy.so/bloom/chart-cards';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const AREA = MONTHS.map((label, i) => ({ label, organic: 40 + i * 7, paid: 20 + ((i * 5) % 13) }));
const AREA_SERIES = [
  { key: 'organic', label: 'Organic' },
  { key: 'paid', label: 'Paid' },
];
const LINE = MONTHS.map((label, i) => ({ label, value: 120 + ((i * 37) % 90) }));
const BARS = [
  { label: 'Direct', value: 420 },
  { label: 'Search', value: 310 },
  { label: 'Social', value: 120 },
];
const STATS = [
  { label: 'Visits', value: '12.4k' },
  { label: 'Bounce', value: '38%' },
];
const RADAR = ['Speed', 'Power', 'Range', 'Grip', 'Comfort'].map((label, i) => ({
  label,
  a: 50 + i * 9,
  b: 70 - i * 6,
}));
const RADAR_SERIES = [
  { key: 'a', label: 'Model A' },
  { key: 'b', label: 'Model B' },
];
const HEAT = ['Mon', 'Tue', 'Wed'].map((label, r) => ({
  label,
  values: [0, 1, 2, 3, 4, 5].map((c) => (r * 6 + c) % 7),
}));
const CELLS = Array.from({ length: 42 }, (_, i) => ({ count: (i * 7) % 5 }));
const SLEEP = [
  { label: 'Duration', detail: '7h 40m', score: 38, max: 50 },
  { label: 'Depth', detail: '1h 52m', score: 20, max: 25 },
  { label: 'Calm', detail: '12 wakes', score: 14, max: 25 },
];
const STAGES = [
  { label: 'Visited', value: 1200 },
  { label: 'Signed up', value: 480 },
  { label: 'Paid', value: 96 },
];
const STEPS = ['6', '9', '12', '15', '18', '21'].map((label, i) => ({
  label,
  value: 400 + i * 230,
}));

const cards: ParityCase[] = [
  ...ENUMS.areaVariant.flatMap((variant) =>
    ENUMS.chartShape.map((shape) => ({
      name: `AreaChartCard ${variant} ${shape}`,
      language: () =>
        toElement(
          L.AreaChartCard({ title: 'Visitors', data: AREA, series: AREA_SERIES, headline: 2480 })
            .style(variant)
            .shape(shape),
        ),
      bloom: () => (
        <AreaChartCard
          title="Visitors"
          data={AREA}
          series={AREA_SERIES}
          headline={2480}
          variant={variant}
          shape={shape}
        />
      ),
    })),
  ),
  {
    name: 'BarListCard',
    language: () => toElement(L.BarListCard({ title: 'Sources', items: BARS, stats: STATS })),
    bloom: () => <BarListCard title="Sources" items={BARS} stats={STATS} />,
  },
  {
    name: 'BarListCard tinted, mono, shares',
    language: () =>
      toElement(L.BarListCard({ items: BARS, metric: 'share', limit: 2 }).tint('success').mono()),
    bloom: () => (
      <Themed>
        {(c) => <BarListCard items={BARS} mono metric="share" limit={2} color={c.success} />}
      </Themed>
    ),
  },
  {
    name: 'ContributionsCard',
    language: () =>
      toElement(L.ContributionsCard({ title: 'Activity', total: 320, cells: CELLS, columns: 6 })),
    bloom: () => <ContributionsCard title="Activity" total={320} cells={CELLS} columns={6} />,
  },
  {
    name: 'ContributionsCard tinted',
    language: () =>
      toElement(L.ContributionsCard({ cells: CELLS, columns: 6, animateIn: false }).tint('info')),
    bloom: () => (
      <Themed>
        {(c) => <ContributionsCard cells={CELLS} columns={6} animateIn={false} color={c.info} />}
      </Themed>
    ),
  },
  {
    name: 'HeatmapChartCard',
    language: () =>
      toElement(L.HeatmapChartCard({ title: 'Load', rows: HEAT, columns: MONTHS, max: 6 })),
    bloom: () => <HeatmapChartCard title="Load" rows={HEAT} columns={MONTHS} max={6} />,
  },
  {
    name: 'HeatmapChartCard tinted, active tint',
    language: () =>
      toElement(
        L.HeatmapChartCard({ rows: HEAT, columns: MONTHS })
          .tint('warning')
          .activeTint('error/half'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <HeatmapChartCard
            rows={HEAT}
            columns={MONTHS}
            color={c.warning}
            activeColor={withAlpha(c.error, 0.5)}
          />
        )}
      </Themed>
    ),
  },
  ...ENUMS.chartShape.map((shape) => ({
    name: `LineChartCard ${shape}`,
    language: () =>
      toElement(L.LineChartCard({ title: 'Revenue', data: LINE, headline: 980 }).shape(shape)),
    bloom: () => <LineChartCard title="Revenue" data={LINE} headline={980} shape={shape} />,
  })),
  {
    name: 'LineChartCard tinted, with stats',
    language: () =>
      toElement(
        L.LineChartCard({ data: LINE, stats: STATS }).tint('primary').activeTint('success'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <LineChartCard data={LINE} stats={STATS} color={c.primary} activeColor={c.success} />
        )}
      </Themed>
    ),
  },
  ...ENUMS.radarVariant.map((variant) => ({
    name: `RadarChartCard ${variant}`,
    language: () =>
      toElement(
        L.RadarChartCard({ title: 'Fit', data: RADAR, series: RADAR_SERIES, max: 100 }).style(
          variant,
        ),
      ),
    bloom: () => (
      <RadarChartCard title="Fit" data={RADAR} series={RADAR_SERIES} max={100} variant={variant} />
    ),
  })),
  ...ENUMS.radarLegend.map((legend) => ({
    name: `RadarChartCard legend ${legend}`,
    language: () =>
      toElement(
        L.RadarChartCard({ title: 'Fit', data: RADAR, series: RADAR_SERIES, max: 100 }).legend(
          legend,
        ),
      ),
    bloom: () => (
      <RadarChartCard title="Fit" data={RADAR} series={RADAR_SERIES} max={100} legend={legend} />
    ),
  })),
  {
    name: 'SleepScoreCard',
    language: () => toElement(L.SleepScoreCard(SLEEP, { title: 'Sleep', range: 'Last night' })),
    bloom: () => <SleepScoreCard metrics={SLEEP} title="Sleep" range="Last night" />,
  },
  {
    name: 'SleepScoreCard with a height',
    language: () => toElement(L.SleepScoreCard(SLEEP, { height: '320' })),
    bloom: () => <SleepScoreCard metrics={SLEEP} height={320} />,
  },
  {
    name: 'StageBarsCard',
    language: () => toElement(L.StageBarsCard({ title: 'Funnel', stages: STAGES })),
    bloom: () => <StageBarsCard title="Funnel" stages={STAGES} />,
  },
  {
    name: 'StageBarsCard mono, percentages of the first',
    language: () =>
      toElement(
        L.StageBarsCard({
          stages: STAGES,
          showPercentages: true,
          percentageBase: 'first',
        }).mono(),
      ),
    bloom: () => <StageBarsCard stages={STAGES} mono showPercentages percentageBase="first" />,
  },
  {
    name: 'StepsCard',
    language: () => toElement(L.StepsCard(STEPS, { title: 'Steps', headline: 8421 })),
    bloom: () => <StepsCard data={STEPS} title="Steps" headline={8421} />,
  },
  {
    name: 'StepsCard tinted',
    language: () => toElement(L.StepsCard(STEPS).tint('info').activeTint('primary')),
    bloom: () => (
      <Themed>{(c) => <StepsCard data={STEPS} color={c.info} activeColor={c.primary} />}</Themed>
    ),
  },
  {
    name: 'TokensChartCard',
    language: () => toElement(L.TokensChartCard(LINE, { title: 'Tokens', animate: false })),
    bloom: () => <TokensChartCard data={LINE} title="Tokens" animate={false} />,
  },
  {
    name: 'TokensChartCard tinted, a plot height',
    language: () =>
      toElement(L.TokensChartCard(LINE, { animate: false, plotHeight: '120' }).tint('success')),
    bloom: () => (
      <Themed>
        {(c) => <TokensChartCard data={LINE} animate={false} plotHeight={120} color={c.success} />}
      </Themed>
    ),
  },
];

const pieces: ParityCase[] = [
  {
    name: 'ChartCardSurface',
    language: () => toElement(L.ChartCardSurface(L.Text('Inside'))),
    bloom: () => (
      <ChartCardSurface>
        <Text>Inside</Text>
      </ChartCardSurface>
    ),
  },
  {
    name: 'ChartCardSurface spaced, a height',
    language: () =>
      toElement(
        L.ChartCardSurface([L.Text('A').id('a'), L.Text('B').id('b')], { height: '200' }).spacing(
          'sm',
        ),
      ),
    bloom: () => (
      <ChartCardSurface height={200} gap={8}>
        <Text>A</Text>
        <Text>B</Text>
      </ChartCardSurface>
    ),
  },
  {
    name: 'ChartHeadline',
    language: () => toElement(L.ChartHeadline('Revenue', { value: 1240, caption: 'This month' })),
    bloom: () => <ChartHeadline label="Revenue" value={1240} caption="This month" />,
  },
  {
    name: 'ChartStatTiles',
    language: () => toElement(L.ChartStatTiles(STATS, { activeIndex: 1 })),
    bloom: () => <ChartStatTiles items={STATS} activeIndex={1} />,
  },
  {
    name: 'Sparkline',
    language: () => toElement(L.Sparkline([3, 5, 2, 8, 6])),
    bloom: () => <Sparkline data={[3, 5, 2, 8, 6]} />,
  },
  ...ENUMS.sparklineTone.map((tone) => ({
    name: `Sparkline ${tone}, sized, filled`,
    language: () =>
      toElement(
        L.Sparkline([3, 5, 2, 8, 6], { width: '96', height: '28' })
          .tint(tone)
          .shape('sharp')
          .filled(),
      ),
    bloom: () => (
      <Sparkline data={[3, 5, 2, 8, 6]} width={96} height={28} fill shape="sharp" tone={tone} />
    ),
  })),
];

const looks: ParityCase[] = [
  ...ENUMS.chartShape.map((shape) => ({
    name: `Sparkline ${shape}, not filled`,
    language: () => toElement(L.Sparkline([3, 5, 2, 8, 6]).shape(shape).filled(false)),
    bloom: () => <Sparkline data={[3, 5, 2, 8, 6]} shape={shape} fill={false} />,
  })),
];

export const CHART_CARD_CASES: ParityCase[] = [...cards, ...pieces, ...looks];
