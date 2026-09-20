import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { mixColor } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { chartHueTone, resolveTone, type ChartHue, type ChartSeriesTone } from './palette';
import { ChartCardSurface } from './primitives/ChartCardSurface';
import { ChartHeader, TABULAR } from './primitives/ChartHeader';
import { describeDeltaRatio } from './primitives/format';
import { useChartCardPalette, useChartTones } from './primitives/use-chart-palette';
import { useChartRange, type ChartRange } from './primitives/use-chart-range';
import {
  hitTestSankey,
  layoutSankey,
  placeSankeyLabels,
  sankeyRibbonPath,
  sankeyNodePath,
  type SankeyLayout,
} from './sankey-layout';
import { svgTextType, textTopForBaseline } from './svg-text';
import { useEasedValues } from './use-eased-values';

export interface SankeyNodeDatum {
  name: string;
  /**
   * Any colour; defaults to the chart palette by node index. `'neutral'` is
   * the semantic secondary ink given to minor sinks.
   */
  color?: string | 'neutral';
  activeColor?: string;
  /** A `chart-n` token (1–9) on the theme (e.g. `var(--color-chart-7)`). Ignored when `color` is set. */
  hue?: ChartHue;
}

export interface SankeyLinkDatum {
  /** A node name or index. */
  source: string | number;
  target: string | number;
  value: number;
}

/** A selectable period: pill label + the props it overrides. */
export type SankeyRange = ChartRange<{
  nodes: readonly SankeyNodeDatum[];
  links: readonly SankeyLinkDatum[];
  delta: number;
  headline: number;
}>;

/** What is hovered: a node or a link, by index. */
export interface SankeyActiveItem {
  type: 'node' | 'link';
  index: number;
}

export interface SankeyChartCardProps {
  /** Header label; swaps to the hovered node / link. Default `"Tracked time"`. */
  title?: string;
  nodes?: readonly SankeyNodeDatum[];
  links?: readonly SankeyLinkDatum[];
  /** Headline at rest; defaults to the total flowing out of the source nodes. */
  headline?: number;
  /** Delta ratio for the chip, e.g. `0.052` → "+5.2%". */
  delta?: number;
  /** Static period pill. Ignored when `ranges` is set. */
  range?: string;
  /** Selectable periods — the pill becomes a dropdown and the range's fields override the props. */
  ranges?: readonly SankeyRange[];
  defaultRange?: string;
  onRangeChange?: (id: string) => void;
  /** Headline and source values. Default hours: `32h`, `10.4h`. */
  format?: (value: number) => string;
  /** Small captions under the left and right columns. */
  axisLabels?: readonly [string, string];
  /** Which end's colour a ribbon takes. `source` (default) makes every flow out of a node share its colour. */
  linkColor?: 'source' | 'target';
  /** Card height on wide layouts (default 480). Narrow cards may grow to fit wrapped adjacent labels. */
  height?: number;
  /** The hovered node or link. Controlled when set (`null` = none). */
  activeItem?: SankeyActiveItem | null;
  onActiveItemChange?: (item: SankeyActiveItem | null) => void;
  /** Names the diagram for assistive tech. Defaults to a summary of its sources and sinks. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Sankey layout constants. */
const NODE_WIDTH = 12;
const NODE_PADDING = 14;
const LINK_CURVATURE = 0.55;
const ITERATIONS = 32;
/** Room reserved for the labels beside the two outer columns. */
const LABEL_LEFT = 88;
const LABEL_RIGHT = 150;
const MARGIN = { top: 2, bottom: 2, left: LABEL_LEFT, right: LABEL_RIGHT } as const;
// Below this measured plot width, side labels would consume most of the flow.
const COMPACT_WIDTH = 440;
const LABEL_GAP = 8;
export const SANKEY_CARD_HEIGHT = 480;

const NAME_TYPE = svgTextType('body-2-medium');
const SHARE_TYPE = svgTextType('body-2-regular');
const VALUE_TYPE = svgTextType('caption-1-regular');

const NO_NODES: readonly SankeyNodeDatum[] = [];
const NO_LINKS: readonly SankeyLinkDatum[] = [];

const defaultHours = (n: number) => `${Math.round(n * 10) / 10}h`;

const sameItem = (a: SankeyActiveItem | null, b: SankeyActiveItem | null) =>
  a === b || (!!a && !!b && a.type === b.type && a.index === b.index);

/**
 * The sankey flow diagram. recharts' layout runs in `sankey-layout.ts`; the
 * card draws it as follows:
 *
 *   ribbons   a closed cubic band per link, `linkCurvature` 0.55, with its
 *             vertical thickness in the source node's colour (`linkColor="target"`
 *             flips it), fill-opacity 0.32 at rest — ×1.6 for neutral ink
 *   nodes     12 wide, 14 apart, rounded 5 only on the outward side
 *   labels    sources: name (13 medium, text-primary) over value (12,
 *             tertiary) 8px left of the node; a node under 26px keeps the
 *             name only. Sinks: "Name · 22%" 8px right of the node
 *   hover     a node lifts its links to 0.7 and fades the rest to 0.08,
 *             unconnected nodes to 35%; a link isolates itself. The header
 *             swaps to the node's value or "Source → Target". 200ms ease-out;
 *             the node fill steps to its `-active` colour over 150ms
 *
 * Hover on web, press-and-scrub on native (letting go clears).
 */
export function SankeyChartCard({
  title = 'Tracked time',
  nodes: nodesProp,
  links: linksProp,
  headline: headlineProp,
  delta: deltaProp,
  range,
  ranges,
  defaultRange,
  onRangeChange,
  format = defaultHours,
  axisLabels,
  linkColor = 'source',
  height = SANKEY_CARD_HEIGHT,
  activeItem: controlled,
  onActiveItemChange,
  accessibilityLabel,
  style,
  testID,
}: SankeyChartCardProps) {
  const theme = useTheme();
  const palette = useChartCardPalette();
  const palettes = useChartTones();
  const { selected, selectedId, select } = useChartRange(ranges, defaultRange, onRangeChange);

  const nodes = selected?.nodes ?? nodesProp ?? NO_NODES;
  const links = selected?.links ?? linksProp ?? NO_LINKS;
  const headline = selected?.headline ?? headlineProp;
  const delta = selected?.delta ?? deltaProp;

  const [own, setOwn] = useState<SankeyActiveItem | null>(null);
  const active = controlled !== undefined ? controlled : own;
  const setActive = useCallback(
    (item: SankeyActiveItem | null) => {
      if (sameItem(item, active)) return;
      if (controlled === undefined) setOwn(item);
      onActiveItemChange?.(item);
    },
    [active, controlled, onActiveItemChange],
  );

  const neutral = useMemo<ChartSeriesTone>(() => {
    return { color: theme.colors.textSecondary, activeColor: theme.colors.text };
  }, [theme]);

  const tones = useMemo(
    () =>
      nodes.map((n, i) =>
        n.color === 'neutral'
          ? neutral
          : !n.color && n.hue
            ? chartHueTone(theme, n.hue)
            : resolveTone(palettes, i, n.color, n.activeColor),
      ),
    [nodes, neutral, palettes, theme],
  );

  const resolvedLinks = useMemo(() => {
    const indexOf = (ref: string | number) =>
      typeof ref === 'number' ? ref : Math.max(0, nodes.findIndex((n) => n.name === ref));
    return links.map((l) => ({ source: indexOf(l.source), target: indexOf(l.target), value: l.value }));
  }, [links, nodes]);

  const stats = useMemo(() => {
    const outflow = nodes.map((_, i) => resolvedLinks.filter((l) => l.source === i).reduce((s, l) => s + l.value, 0));
    const inflow = nodes.map((_, i) => resolvedLinks.filter((l) => l.target === i).reduce((s, l) => s + l.value, 0));
    const isSource = nodes.map((_, i) => inflow[i] === 0);
    const isSink = nodes.map((_, i) => outflow[i] === 0);
    const nodeValue = nodes.map((_, i) => Math.max(inflow[i]!, outflow[i]!));
    const total = nodeValue.reduce((s, v, i) => (isSource[i] ? s + v : s), 0);
    const sinkTotal = nodeValue.reduce((s, v, i) => (isSink[i] ? s + v : s), 0);
    return { isSource, isSink, nodeValue, total, sinkTotal };
  }, [nodes, resolvedLinks]);

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height: h } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === h ? prev : { width, height: h }));
  }, []);

  const compact = size !== null && size.width < COMPACT_WIDTH;
  const [wordWidths, setWordWidths] = useState<Record<string, number>>({});
  const labelWords = useMemo(() => {
    const words = new Map<string, { key: string; word: string; source: boolean }>();
    nodes.forEach((node, index) => {
      if (!stats.isSource[index] && !stats.isSink[index]) return;
      const source = !!stats.isSource[index] && !stats.isSink[index];
      for (const word of node.name.split(/\s+/).filter(Boolean)) {
        const key = `${source}:${word}`;
        words.set(key, { key, word, source });
      }
    });
    return [...words.values()];
  }, [nodes, stats]);
  const longestWord = (source: boolean) => labelWords.filter(word => word.source === source).reduce((width, word) => Math.max(width, wordWidths[word.key] ?? word.word.length * 7), 0);
  const plotWidth = size?.width ?? 0;
  const desiredLeft = Math.max(plotWidth * 0.24, longestWord(true) + LABEL_GAP + 1);
  const desiredRight = Math.max(plotWidth * 0.32, longestWord(false) + LABEL_GAP + 1);
  // Let whole words use more than the baseline gutters, but retain two node
  // bars and at least36px of actual ribbon even in an unusually narrow host.
  const gutterScale = Math.min(1, Math.max(0, plotWidth - NODE_WIDTH * 2 - 36) / (desiredLeft + desiredRight || 1));
  const leftGutter = Math.round(desiredLeft * gutterScale);
  const rightGutter = Math.round(desiredRight * gutterScale);
  const [measuredLabels, setMeasuredLabels] = useState<Record<number, { key: string; height: number }>>({});
  const compactLabels = nodes.map((node, index) => {
    const source = !!stats.isSource[index] && !stats.isSink[index];
    const width = Math.max(1, (source ? leftGutter : rightGutter) - LABEL_GAP);
    const share = stats.sinkTotal > 0 ? Math.round(((stats.nodeValue[index] ?? 0) / stats.sinkTotal) * 100) : 0;
    const value = `${format(stats.nodeValue[index] ?? 0)}${stats.isSink[index] ? ` · ${share}%` : ''}`;
    const key = `${width}:${node.name}:${value}`;
    // Reserve space before text measurement, then use the actual wrapped height.
    const estimated = Math.ceil(node.name.length * 7 / width) * 18 + Math.ceil(value.length * 6 / width) * 16 + 2;
    return { index, source, width, value, key, height: measuredLabels[index]?.key === key ? measuredLabels[index]!.height : estimated };
  });
  const columnHeight = (source: boolean) => compactLabels.filter(label => source ? label.source : stats.isSink[label.index]).reduce((sum, label) => sum + label.height + LABEL_GAP, 0);
  const compactPlotHeight = Math.max(180, height - 128, columnHeight(true), columnHeight(false));

  const layout = useMemo<SankeyLayout | null>(
    () =>
      size
        ? layoutSankey(nodes.length, resolvedLinks, {
            width: size.width,
            height: compact ? compactPlotHeight : size.height,
            margin: compact ? { top: 2, bottom: 2, left: leftGutter, right: rightGutter } : MARGIN,
            nodeWidth: NODE_WIDTH,
            nodePadding: NODE_PADDING,
            linkCurvature: LINK_CURVATURE,
            iterations: ITERATIONS,
            sort: false,
          })
        : null,
    [size, nodes.length, resolvedLinks, compact, leftGutter, rightGutter, compactPlotHeight],
  );

  const compactLabelTops = compact && layout ? {
    ...placeSankeyLabels(layout.nodes.filter(node => compactLabels[node.index]?.source).map(node => ({ index: node.index, center: node.y + node.height / 2, height: compactLabels[node.index]!.height })), compactPlotHeight),
    ...placeSankeyLabels(layout.nodes.filter(node => stats.isSink[node.index]).map(node => ({ index: node.index, center: node.y + node.height / 2, height: compactLabels[node.index]!.height })), compactPlotHeight),
  } : {};

  const linkTouches = (li: number, ni: number) => {
    const l = resolvedLinks[li];
    return !!l && (l.source === ni || l.target === ni);
  };
  const nodeOpacity = (i: number) => {
    if (!active) return 1;
    if (active.type === 'node') {
      if (active.index === i) return 1;
      const connected = resolvedLinks.some(
        (l, li) => (l.source === active.index || l.target === active.index) && linkTouches(li, i),
      );
      return connected ? 1 : 0.35;
    }
    return linkTouches(active.index, i) ? 1 : 0.35;
  };
  const linkOpacity = (li: number) => {
    if (!active) return 0.32;
    if (active.type === 'link') return active.index === li ? 0.7 : 0.08;
    return linkTouches(li, active.index) ? 0.7 : 0.08;
  };
  const linkTone = (li: number) => {
    const l = resolvedLinks[li];
    return tones[(linkColor === 'target' ? l?.target : l?.source) ?? 0] ?? neutral;
  };

  const nodeOpacities = useEasedValues(nodes.map((_, i) => nodeOpacity(i)), 200);
  const nodeFills = useEasedValues(
    nodes.map((_, i) => (active?.type === 'node' && active.index === i ? 1 : 0)),
    150,
  );
  const linkOpacities = useEasedValues(
    resolvedLinks.map((_, li) => {
      const boost = linkTone(li) === neutral ? 1.6 : 1;
      return Math.min(0.85, linkOpacity(li) * boost);
    }),
    200,
  );

  let headerLabel = title;
  let headlineValue = headline ?? stats.total;
  if (active?.type === 'node') {
    headerLabel = nodes[active.index]?.name ?? title;
    headlineValue = stats.nodeValue[active.index] ?? headlineValue;
  } else if (active?.type === 'link') {
    const l = resolvedLinks[active.index];
    if (l) {
      headerLabel = `${nodes[l.source]?.name} → ${nodes[l.target]?.name}`;
      headlineValue = l.value;
    }
  }

  const track = (px: number, py: number) => {
    if (!layout) return;
    setActive(hitTestSankey(layout, px, py));
  };
  const pointerHandlers: ViewProps = {
    onPointerMove: (e: PointerEvent) => track(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
    onPointerLeave: () => setActive(null),
    ...(Platform.OS === 'web'
      ? null
      : {
          onStartShouldSetResponder: () => true,
          onMoveShouldSetResponder: () => true,
          onResponderTerminationRequest: () => false,
          onResponderGrant: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderMove: (e: GestureResponderEvent) => track(e.nativeEvent.locationX, e.nativeEvent.locationY),
          onResponderRelease: () => setActive(null),
          onResponderTerminate: () => setActive(null),
        }),
  };

  const label =
    accessibilityLabel ??
    `${title} flow diagram: ${nodes.filter((_, i) => stats.isSource[i]).map((n) => n.name).join(', ')} to ${nodes
      .filter((_, i) => stats.isSink[i] && !stats.isSource[i])
      .map((n) => n.name)
      .join(', ')}`;

  return (
    <ChartCardSurface height={compact ? 'auto' : height} style={style} testID={testID}>
      {compact ? <View pointerEvents="none" accessibilityElementsHidden aria-hidden={true}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, overflow: 'hidden', alignItems: 'flex-start' }}>
        {labelWords.map(word => <Text key={word.key} accessible={false} style={[NAME_TYPE, { flexShrink: 0 }]}
          onLayout={event => {
            const width = event.nativeEvent.layout.width;
            if (width > 0) setWordWidths(previous => previous[word.key] !== undefined && Math.abs(previous[word.key]! - width) < 0.5 ? previous : { ...previous, [word.key]: width });
          }}>{word.word}</Text>)}
      </View> : null}
      <ChartHeader
        label={headerLabel}
        value={headlineValue}
        format={format}
        delta={delta !== undefined ? describeDeltaRatio(delta) : undefined}
        hovering={active !== null}
        fadeKey={`${selectedId ?? ''}:${active ? `${active.type}:${active.index}` : 'idle'}`}
        range={range}
        ranges={ranges}
        rangeId={selectedId}
        onRangeChange={(id) => {
          setActive(null);
          select(id);
        }}
        testID={testID}
      />

      <View style={compact ? { width: '100%', height: compactPlotHeight, flexShrink: 0, flexGrow: 0, flexBasis: 'auto' } : styles.plot} onLayout={onLayout} testID={testID ? `${testID}-plot` : undefined}>
        {size && layout ? (
          <>
            <Svg width={size.width} height={compact ? compactPlotHeight : size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <G>
                {layout.links.map((link) => (
                  <Path
                    key={`link-${link.index}`}
                    d={sankeyRibbonPath(link)}
                    fill={linkTone(link.index).color}
                    fillOpacity={linkOpacities[link.index] ?? 0.32}
                  />
                ))}
              </G>
              <G>
                {layout.nodes.map((n) => {
                  const tone = tones[n.index] ?? neutral;
                  const t = nodeFills[n.index] ?? 0;
                  return (
                    <G key={`node-${n.index}`} opacity={nodeOpacities[n.index] ?? 1}>
                      <Path
                        d={sankeyNodePath(n.x, n.y, n.width, n.height, !!stats.isSource[n.index], !!stats.isSink[n.index])}
                        fill={t <= 0 ? tone.color : t >= 1 ? tone.activeColor : mixColor(tone.color, tone.activeColor, t)}
                      />
                    </G>
                  );
                })}
              </G>
              {compact ? layout.nodes.map(node => {
                const label = compactLabels[node.index]!;
                const top = compactLabelTops[node.index];
                if (top === undefined) return null;
                const center = top + label.height / 2;
                const nodeCenter = node.y + node.height / 2;
                if (Math.abs(center - nodeCenter) < 2) return null;
                const start = label.source ? node.x : node.x + node.width;
                const end = label.source ? node.x - LABEL_GAP + 2 : node.x + node.width + LABEL_GAP - 2;
                return <Path key={`leader-${node.index}`} d={`M${start},${nodeCenter} L${end},${center}`} fill="none" stroke={palette.textTertiary} strokeWidth={1} strokeOpacity={0.4} />;
              }) : null}
            </Svg>
            {layout.nodes.map((n) => {
              const i = n.index;
              const node = nodes[i];
              if (!node) return null;
              const midY = n.y + n.height / 2;
              const opacity = nodeOpacities[i] ?? 1;
              if (compact && (stats.isSource[i] || stats.isSink[i])) {
                const label = compactLabels[i]!;
                return <View
                  key={`label-${i}`}
                  testID={testID ? `${testID}-label-box-${i}` : undefined}
                  onLayout={event => {
                    const measuredHeight = event.nativeEvent.layout.height;
                    if (measuredHeight <= 0) return;
                    setMeasuredLabels(previous => previous[i]?.key === label.key && Math.abs(previous[i]!.height - measuredHeight) < 0.5
                      ? previous : { ...previous, [i]: { key: label.key, height: measuredHeight } });
                  }}
                  style={{ position: 'absolute', width: label.width, top: compactLabelTops[i] ?? 0,
                    ...(label.source ? { left: 0 } : { right: 0 }), gap: 2, opacity }}>
                  <Text testID={testID ? `${testID}-label-${i}` : undefined}
                    style={[NAME_TYPE, { color: palette.text, textAlign: label.source ? 'right' : 'left' }]}>{node.name}</Text>
                  <Text style={[VALUE_TYPE, TABULAR, { color: palette.textTertiary, textAlign: label.source ? 'right' : 'left' }]}>{label.value}</Text>
                </View>;
              }
              if (stats.isSource[i] && !stats.isSink[i]) {
                const tall = n.height >= 26;
                const right = size.width - (n.x - 8);
                return (
                  <React.Fragment key={`label-${i}`}>
                    <Text
                      numberOfLines={1}
                        testID={testID ? `${testID}-label-${i}` : undefined}
                      style={[
                        NAME_TYPE,
                        { position: 'absolute', right, top: textTopForBaseline(midY + (tall ? -2 : 4), NAME_TYPE), color: palette.text, opacity },
                      ]}>
                      {node.name}
                    </Text>
                    {tall ? (
                      <Text
                        numberOfLines={1}
                            style={[
                          VALUE_TYPE,
                          TABULAR,
                          { position: 'absolute', right, top: textTopForBaseline(midY + 14, VALUE_TYPE), color: palette.textTertiary, opacity },
                        ]}>
                        {format(stats.nodeValue[i] ?? 0)}
                      </Text>
                    ) : null}
                  </React.Fragment>
                );
              }
              if (stats.isSink[i]) {
                const share = stats.sinkTotal > 0 ? Math.round(((stats.nodeValue[i] ?? 0) / stats.sinkTotal) * 100) : 0;
                return (
                  <Text
                    key={`label-${i}`}
                    numberOfLines={1}
                    testID={testID ? `${testID}-label-${i}` : undefined}
                    style={[
                      NAME_TYPE,
                      {
                        position: 'absolute',
                        left: n.x + n.width + 8,
                        top: textTopForBaseline(midY + 4, NAME_TYPE),
                        color: palette.text,
                        opacity,
                      },
                    ]}>
                    {node.name}
                    <Text style={[SHARE_TYPE, TABULAR, { color: palette.textTertiary }]}>{` · ${share}%`}</Text>
                  </Text>
                );
              }
              return null;
            })}
            <View
              role="img"
              accessibilityLabel={label}
              testID={testID ? `${testID}-surface` : undefined}
              style={StyleSheet.absoluteFill}
              {...pointerHandlers}
            />
          </>
        ) : null}
      </View>

      {axisLabels ? (
        <View style={styles.axisLabels}>
          <Text variant="caption-1-medium" style={{ color: palette.textTertiary }}>
            {axisLabels[0]}
          </Text>
          <Text variant="caption-1-medium" style={{ color: palette.textTertiary }}>
            {axisLabels[1]}
          </Text>
        </View>
      ) : null}

    </ChartCardSurface>
  );
}

const styles = StyleSheet.create({
  plot: { width: '100%', flex: 1, minHeight: 0 },
  axisLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
});
