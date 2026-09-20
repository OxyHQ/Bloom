import React, { useCallback, useMemo } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { contrastRatio } from '../styles/color-contrast';
import { borderRadius } from '../styles/tokens';
import { Text } from '../typography';
import { resolveTone, type ChartSeriesTone } from './palette';
import { ChartCardSurface, CHART_CARD_HEIGHT } from './primitives/ChartCardSurface';
import { ChartHeader, TABULAR } from './primitives/ChartHeader';
import { describeDeltaRatio, formatNumber } from './primitives/format';
import { useActiveIndex } from './primitives/use-active-index';
import { useChartCardPalette, useChartTones, useMonoTone } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import { useWebTransition } from './primitives/use-web-transition';
import {
  StageStatTiles,
  hoverTarget,
  renderChartIcon,
  useGrowWidth,
  useMountedAfterDelay,
  type ChartIcon,
} from './stage-parts';

/**
 * `StageBarsCard`: the funnel as a list.
 *
 *   rows     one per stage, 12px apart, centred in whatever height the card
 *            has left (8px above and below): the name (`body-regular`
 *            text-secondary, right-aligned, its column as wide as the longest
 *            name), 12px, a 20px `chart-track` pill holding the stage's fill
 *            (radius full, at least 2% wide, width and colour easing 500ms),
 *            12px, the value (`body-medium`) and its share of the first stage
 *            (`caption-1-medium` text-tertiary), 6px apart on one baseline
 *   icons    14px, black/white chosen for AA against the actual data fill (both
 *            modes), pinned 4px inside the TRACK's left end so they line up
 *            down the column; the track clips them
 *   tiles    three per row, never stretched, swatch · name over value
 *
 * Hovering a row cell or its tile swaps the header to that stage, darkens its
 * fill (400 → 500), fades the other rows to 35% and the other tiles to 50%.
 * The card is content-sized with a 329px floor, so more stages make it taller.
 * Widths grow in on mount.
 */

export interface StageBar {
  label: string;
  value: number;
  /** Any colour; defaults to the chart palette by index. */
  color?: string;
  activeColor?: string;
  /** 14px glyph inside the bar's left end: an icon component (contrast-paired with its fill) or a node. */
  icon?: ChartIcon;
}

/** A selectable period: the pill label plus the props it overrides. */
export type StageBarsRange = ChartRange<{ stages: StageBar[]; delta: number; headline: number }>;

export interface StageBarsCardProps {
  /** Header label; swaps to the hovered stage's name. Default `"Pipeline"`. */
  title?: string;
  /** Stages top to bottom. Required unless every range carries its own. */
  stages?: readonly StageBar[];
  /** Single-ink look: every pill in one grey, no swatches on the tiles. */
  mono?: boolean;
  /** Draw each stage's `icon` inside its bar. Default `true`. */
  showIcons?: boolean;
  /** Headline number at rest; defaults to the first stage's value. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". No chip when omitted. */
  delta?: number;
  /** Static period pill ("Last 30 days"). Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods: the pill becomes a dropdown and the selected range's fields override the props above. */
  ranges?: readonly StageBarsRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Headline, row and tile values. Default en-US grouping. */
  format?: (value: number) => string;
  /** The hovered stage. Controlled when set (`null` = none); omit to track the pointer. */
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
  /** Names the bar list for assistive tech. Defaults to a summary of the stages. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Opacity of the other rows while one stage is hovered. */
const ROW_DIM = 0.35;
const ROW_GAP = 12;
const BAR_HEIGHT = 20;
const ICON_SIZE = 14;

export function StageBarsCard({
  title = 'Pipeline',
  stages: stagesProp,
  mono = false,
  showIcons = true,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = formatNumber,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  accessibilityLabel,
  style,
  testID,
}: StageBarsCardProps) {
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const monoTone = useMonoTone();
  const mounted = useMountedAfterDelay();
  const fade = useWebTransition('opacity', 200);

  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);
  const stages = selected?.stages ?? stagesProp ?? [];
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const [activeIndex, setActiveIndex] = useActiveIndex(stages.length, controlledIndex, onActiveIndexChange);
  const selectRange = useCallback(
    (id: string) => {
      setActiveIndex(null);
      select(id);
    },
    [select, setActiveIndex],
  );

  const tones: ChartSeriesTone[] = stages.map((s, i) => (mono ? monoTone : resolveTone(palettes, i, s.color, s.activeColor)));
  const top = Math.max(1, stages[0]?.value ?? 1);
  const hovering = activeIndex !== null;
  const headerLabel = hovering ? stages[activeIndex]!.label : title;
  const headlineValue = hovering ? stages[activeIndex]!.value : (headline ?? top);
  const dim = (i: number) => (hovering && activeIndex !== i ? ROW_DIM : 1);

  const summary =
    accessibilityLabel ??
    `${title}: ${stages.map((s) => `${s.label} ${format(s.value)} (${Math.round((s.value / top) * 100)}%)`).join(', ')}`;

  return (
    <ChartCardSurface height="auto" style={[{ minHeight: CHART_CARD_HEIGHT }, style]} testID={testID}>
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={hovering}
        fadeKey={`${selectedId ?? ''}:${activeIndex}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={selectRange}
        testID={testID}
      />

      {/* Three columns whose cells share one 20px row height stand in for
          a CSS grid's `auto minmax(0,1fr) auto` columns: the name column sizes
          to the longest name, the value column to the widest value. */}
      <View
        role="img"
        accessibilityLabel={summary}
        testID={testID ? `${testID}-rows` : undefined}
        style={{ width: '100%', flexGrow: 1, minHeight: 0, justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: ROW_GAP }}>
            {stages.map((stage, i) => (
              <View
                key={`label-${stage.label}-${i}`}
                {...hoverTarget(i, setActiveIndex)}
                style={[{ height: BAR_HEIGHT, justifyContent: 'center', opacity: dim(i) }, fade]}>
                <Text variant="body-regular" numberOfLines={1} style={{ color: palette.textSecondary, textAlign: 'right' }}>
                  {stage.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: ROW_GAP }}>
            {stages.map((stage, i) => (
              <StageTrack
                key={`bar-${stage.label}-${i}`}
                percent={Math.max(2, (stage.value / top) * 100)}
                mounted={mounted}
                color={activeIndex === i ? tones[i]!.activeColor : tones[i]!.color}
                track={palette.track}
                opacity={dim(i)}
                icon={showIcons ? renderChartIcon(stage.icon, ICON_SIZE, contrastRatio(activeIndex === i ? tones[i]!.activeColor : tones[i]!.color, '#ffffff') >= 4.5 ? '#ffffff' : '#000000') : null}
                hover={hoverTarget(i, setActiveIndex)}
                testID={testID ? `${testID}-bar-${i}` : undefined}
              />
            ))}
          </View>
          <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: ROW_GAP }}>
            {stages.map((stage, i) => (
              <View
                key={`value-${stage.label}-${i}`}
                {...hoverTarget(i, setActiveIndex)}
                style={[
                  { height: BAR_HEIGHT, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', gap: 6, opacity: dim(i) },
                  fade,
                ]}>
                <Text variant="body-medium" numberOfLines={1} style={[{ color: palette.text }, TABULAR]}>
                  {format(stage.value)}
                </Text>
                <Text variant="caption-1-medium" numberOfLines={1} style={[{ color: palette.textTertiary }, TABULAR]}>
                  {`${Math.round((stage.value / top) * 100)}%`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <StageStatTiles
        columns={3}
        swatches={!mono}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
        testID={testID ? `${testID}-tiles` : undefined}
        items={stages.map((stage, i) => ({
          label: stage.label,
          value: format(stage.value),
          color: tones[i]!.color,
          activeColor: tones[i]!.activeColor,
        }))}
      />
    </ChartCardSurface>
  );
}

function StageTrack({
  percent,
  mounted,
  color,
  track,
  opacity,
  icon,
  hover,
  testID,
}: {
  percent: number;
  mounted: boolean;
  color: string;
  track: string;
  opacity: number;
  icon: React.ReactNode;
  hover: ReturnType<typeof hoverTarget>;
  testID?: string;
}) {
  const width = useGrowWidth(percent, mounted);
  const fade = useWebTransition('opacity', 200);
  const colorEase = useWebTransition('background-color', 500);
  return (
    <View
      {...hover}
      testID={testID}
      style={[
        { height: BAR_HEIGHT, minWidth: 0, overflow: 'hidden', borderRadius: borderRadius.full, backgroundColor: track, opacity },
        fade,
      ]}>
      <Animated.View
        testID={testID ? `${testID}-fill` : undefined}
        style={[
          { position: 'absolute', top: 0, bottom: 0, left: 0, width, borderRadius: borderRadius.full, backgroundColor: color },
          colorEase,
        ]}
      />
      {icon ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 4, justifyContent: 'center' }}>
          {icon}
        </View>
      ) : null}
    </View>
  );
}
