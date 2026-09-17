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

import { mixColor, resolveButtonRamps } from '../button/shared';
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
  sankeyLinkPath,
  sankeyNodePath,
  type SankeyLayout,
} from './sankey-layout';
import { svgTextType, textTopForBaseline } from './svg-text';
import { useEasedValues } from './use-eased-values';

export interface SankeyNodeDatum {
  name: string;
  /**
   * Any colour; defaults to the chart palette by node index. `'neutral'` is
   * the grey given to minor sinks (neutral-400 light / neutral-300 dark).
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
  /** Card height. Default 480 — a flow needs more room than the 329 chart cards. */
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
 *   ribbons   one cubic per link, `linkCurvature` 0.55, stroked at its value's
 *             thickness in the source node's colour (`linkColor="target"`
 *             flips it), stroke-opacity 0.32 at rest — ×1.6 for neutral ink
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
    const { neutral: n } = resolveButtonRamps(theme);
    return theme.isDark ? { color: n[300], activeColor: n[100] } : { color: n[400], activeColor: n[500] };
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

  const layout = useMemo<SankeyLayout | null>(
    () =>
      size
        ? layoutSankey(nodes.length, resolvedLinks, {
            width: size.width,
            height: size.height,
            margin: MARGIN,
            nodeWidth: NODE_WIDTH,
            nodePadding: NODE_PADDING,
            linkCurvature: LINK_CURVATURE,
            iterations: ITERATIONS,
            sort: false,
          })
        : null,
    [size, nodes.length, resolvedLinks],
  );

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
    <ChartCardSurface height={height} style={style} testID={testID}>
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

      <View style={styles.plot} onLayout={onLayout} testID={testID ? `${testID}-plot` : undefined}>
        {size && layout ? (
          <>
            <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
              <G>
                {layout.links.map((link) => (
                  <Path
                    key={`link-${link.index}`}
                    d={sankeyLinkPath(link)}
                    fill="none"
                    stroke={linkTone(link.index).color}
                    strokeWidth={Math.max(1, link.width)}
                    strokeOpacity={linkOpacities[link.index] ?? 0.32}
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
            </Svg>
            {layout.nodes.map((n) => {
              const i = n.index;
              const node = nodes[i];
              if (!node) return null;
              const midY = n.y + n.height / 2;
              const opacity = nodeOpacities[i] ?? 1;
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
