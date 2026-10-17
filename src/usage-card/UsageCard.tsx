import { useInteractionState } from '../hooks/use-interaction-state';
import { surfaceFillOn } from '../styles/surface-levels';
import { Collapsible } from '../collapsible/Collapsible';
import { Card } from '../card/Card';
import { useCardFill } from '../card/use-card-fill';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { WebCssStyle } from '../styles/web-view-style';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ACCENT_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiArrowRightLine } from '../icons/remix/RiArrowRightLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { Text, TYPE_SCALE } from '../typography';
import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { parseRgba } from '../theme/color-utils';
import { srgbToOklch, oklchToRgbString } from '../theme/color-space';
import type { Theme } from '../theme/types';
import { USAGE_CARD_MESSAGES } from './messages';
import { useTheme } from '../theme/use-theme';
import type { UsageCardProps, UsageData, UsageGroup, UsageLimit } from './types';
import { IS_WEB } from '../styles/platform';

/**
 * A shared usage card for storage, budgets, quotas, and context windows.
 *
 *   Context window   stacked usage bar (one segment per counted bucket) with a
 *                    "used / max (pct)" readout. Pressing it grows the card to
 *                    a legend row per bucket, free space, deferred buckets
 *                    ("—") and collapsible groups listing their members.
 *   Plan limits      one row per rolling limit: label, reset time, percent and
 *                    a progress bar.
 *
 * Geometry, resolved to numbers:
 *
 *   card        radius 28, padding 10 top / 16 sides / 16 bottom
 *   header      28 tall (py 4, 14/20 medium), bleeds 8px each side, radius 10
 *   bars        6 tall, full radius, 1px gap between segments, 6 below header
 *   legend row  30 tall (py 5), swatch 10 radius 3, share column 56 wide
 *   group row   34 tall (py 7), chevron 16, members indented 22 at 13/18
 *   separator   1px, 12 above and below
 *   limit row   label line + 6 + bar, rows 12 apart, percent column 36 wide
 *
 * Motion: breakdown height+opacity 320ms and group members
 * 260ms on `cubic-bezier(0.22, 1, 0.36, 1)`, chevrons 200ms ease-out, bar widths
 * 500ms ease-out on change — and all of it snaps under reduced motion.
 */

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

interface CardPalette {
  surface: string;
  hover: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  track: string;
  deferred: string;
  limitFill: string;
  ring: string;
  chart: readonly string[];
}

/**
 * Tailwind v4's `-400` stops for the chart order: blue, purple, pink, yellow,
 * emerald, sky, teal, lime. Each tone is carried as an OFFSET from `blue-400`,
 * so it can be re-anchored on the theme's own accent-400.
 */
// biome-ignore lint/suspicious/noApproximativeNumericConstant: Exact published color stop, not a mathematical constant.
const TAILWIND_BLUE_400 = { l: 0.707, c: 0.165, h: 254.624 } as const;
const CHART_TONES_OKLCH = [
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: Exact published color stop.
  { l: 0.707, c: 0.165, h: 254.624 }, // blue
  { l: 0.714, c: 0.203, h: 305.504 }, // purple
  { l: 0.718, c: 0.202, h: 349.761 }, // pink
  { l: 0.852, c: 0.199, h: 91.936 }, // yellow
  { l: 0.765, c: 0.177, h: 163.223 }, // emerald
  { l: 0.746, c: 0.16, h: 232.661 }, // sky
  { l: 0.777, c: 0.152, h: 181.912 }, // teal
  { l: 0.841, c: 0.238, h: 128.85 }, // lime
] as const;

/**
 * The `chart-*` palette around the theme. The first tone IS the accent
 * ramp's 400 (`colorRamp(primary)`, the `chart-6` blue-400); every other
 * tone keeps Tailwind's lightness step, chroma ratio and hue distance from
 * blue-400, measured from that stop — so a blue preset reproduces the
 * palette and any other preset rotates the whole set with its primary.
 */
function chartPalette(accent400: string): string[] {
  const rgba = parseRgba(accent400);
  if (!rgba) return CHART_TONES_OKLCH.map(() => accent400);
  const base = srgbToOklch(rgba);
  return CHART_TONES_OKLCH.map((tone, index) => {
    if (index === 0) return accent400;
    return oklchToRgbString({
      l: Math.min(0.99, Math.max(0.05, base.l + (tone.l - TAILWIND_BLUE_400.l))),
      c: base.c * (tone.c / TAILWIND_BLUE_400.c),
      h: (((base.h + (tone.h - TAILWIND_BLUE_400.h)) % 360) + 360) % 360,
    });
  });
}

/** Canonical theme surfaces, foregrounds and focus roles. */
function resolvePalette(theme: Theme): CardPalette {
  const c = theme.colors;
  return {
    text: c.text,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    limitFill: resolveButtonRamps(theme).accent[400],
    ring: c.primary,
    chart: chartPalette(colorRamp(c.primary, ACCENT_TABLE)[400]),
    surface: c.card,
    hover: c.backgroundSecondary,
    separator: c.borderLight,
    track: c.backgroundTertiary,
    deferred: c.border,
  };
}

// ---------------------------------------------------------------------------
//  Formatting
// ---------------------------------------------------------------------------

/** 482_800 → "482.8k", 96_000 → "96k", 1_000_000 → "1M", 314 → "314". */
function defaultFormatValue(n: number): string {
  const short = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  if (n >= 1_000_000) return `${short(n / 1_000_000)}M`;
  if (n >= 1_000) return `${short(n / 1_000)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
//  Web: focus ring + hover transition. The rows are react-native-web
//  `Pressable`s, so the rules hang off a `dataSet` attribute (a class never
//  reaches the DOM — see `chip/Chip.tsx`). Hover itself is state-driven so it
//  paints on native as well.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-agent-limits-card-web-css';
const ROW_SELECTOR = '[data-bloom-agent-limits-row]';
const WEB_CSS = `
${ROW_SELECTOR} {
  cursor: pointer;
  outline: none;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
${ROW_SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-agent-limits-ring);
}
`;

// ---------------------------------------------------------------------------
//  Motion
// ---------------------------------------------------------------------------

/** Tailwind `ease-out`. */
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

const BREAKDOWN_MS = 320;
const GROUP_MS = 260;
const CHEVRON_MS = 200;
const BAR_MS = 500;

/**
 * `AnimatePresence` + `motion.div` animating `height: 0 ↔ auto` and opacity:
 * the children mount on open, the clip grows to their measured height, and they
 * unmount once the close finishes. Mounted-open (`initial={false}`) does not
 * animate, and neither does anything under reduced motion.
 */
function Collapse({
  open,
  duration,
  style,
  children,
}: {
  open: boolean;
  duration: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={open} transition={{ duration, easing: [0.22, 1, 0.36, 1] }} style={style}>
      {children}
    </Collapsible>
  );
}

/** A chevron that rotates to `degrees` when `active`, 200ms ease-out. */
function RotatingIcon({
  active,
  degrees,
  children,
}: {
  active: boolean;
  degrees: number;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(active ? degrees : 0);
  useEffect(() => {
    const target = active ? degrees : 0;
    rotation.value = reducedMotion
      ? target
      : withTiming(target, { duration: CHEVRON_MS, easing: EASE_OUT });
  }, [active, degrees, reducedMotion, rotation]);
  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );
  return (
    <Animated.View style={[ICON_BOX, animatedStyle]} aria-hidden>
      {children}
    </Animated.View>
  );
}

/** A bar fill whose width follows `percent` (0–100), 500ms ease-out on change. */
function BarFill({
  percent,
  color,
  rounded,
  testID,
}: {
  percent: number;
  color: string;
  rounded?: boolean;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(percent);
  useEffect(() => {
    width.value = reducedMotion
      ? percent
      : withTiming(percent, { duration: BAR_MS, easing: EASE_OUT });
  }, [percent, reducedMotion, width]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }), [width]);
  return (
    <Animated.View
      testID={testID}
      style={[
        { height: '100%', flexShrink: 0, backgroundColor: color },
        rounded ? { borderRadius: BAR_HEIGHT / 2 } : null,
        animatedStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

const BAR_HEIGHT = 6;
const ROW_RADIUS = 10;
const SHARE_WIDTH = 56;
const ICON_SIZE = 16;
const ICON_BOX: ViewStyle = {
  width: ICON_SIZE,
  height: ICON_SIZE,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
/** `text-body-medium`, `text-body-regular`, `text-body-2-regular`. */
const BODY_MEDIUM: TextStyle = TYPE_SCALE['body-medium'];
const BODY_REGULAR: TextStyle = TYPE_SCALE['body-regular'];
const BODY_2_REGULAR: TextStyle = TYPE_SCALE['body-2-regular'];
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/** The track: `Bar` — 6 tall, full radius, 1px between segments. */
function Track({
  color,
  style,
  children,
  ...a11y
}: {
  color: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  label: string;
  max: number;
  now: number;
  testID?: string;
}) {
  return (
    <View
      testID={a11y.testID}
      accessibilityRole="progressbar"
      // Flat `aria-value*`: react-native-web ignores `accessibilityValue`, and
      // React Native folds these back into it.
      aria-valuemin={0}
      aria-valuemax={a11y.max}
      aria-valuenow={a11y.now}
      accessibilityLabel={a11y.label}
      style={[
        {
          flexDirection: 'row',
          width: '100%',
          height: BAR_HEIGHT,
          gap: 1,
          overflow: 'hidden',
          borderRadius: BAR_HEIGHT / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Rows
// ---------------------------------------------------------------------------

/** `<card testID>-<part>`, so several cards on one screen stay addressable. */
const part = (testID: string | undefined, name: string) =>
  testID ? `${testID}-${name}` : undefined;

/** A full-width pressable row that bleeds 8px past the content and pills on hover. */
function HoverRow({
  palette,
  onPress,
  expanded,
  accessibilityLabel,
  style,
  testID,
  children,
}: {
  palette: CardPalette;
  onPress: () => void;
  expanded: boolean;
  accessibilityLabel: string;
  style: ViewStyle;
  testID?: string;
  children: (hovered: boolean) => React.ReactNode;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const ringStyle: WebCssStyle = { '--bloom-agent-limits-ring': palette.ring };
  const webStyle = IS_WEB ? ringStyle : null;
  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomAgentLimitsRow: '' } } as Record<string, unknown>) : {})}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-expanded={expanded}
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: -8,
          marginRight: -8,
          paddingLeft: 8,
          paddingRight: 8,
          borderRadius: ROW_RADIUS,
          backgroundColor: hovered ? palette.hover : 'transparent',
        },
        style,
        webStyle,
      ]}
    >
      {children(hovered)}
    </Pressable>
  );
}

function UsageGroupRow({
  group,
  palette,
  format,
}: {
  group: UsageGroup;
  palette: CardPalette;
  format: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <HoverRow
        palette={palette}
        onPress={() => setOpen((prev) => !prev)}
        expanded={open}
        accessibilityLabel={`${group.label}, ${format(group.value)}, ${group.items.length}`}
        style={{ gap: 6, paddingTop: 7, paddingBottom: 7 }}
      >
        {() => (
          <>
            <RotatingIcon active={open} degrees={90}>
              <RiArrowRightSLine width={ICON_SIZE} height={ICON_SIZE} fill={palette.textTertiary} />
            </RotatingIcon>
            <Text
              numberOfLines={1}
              style={[BODY_REGULAR, { flex: 1, minWidth: 0, color: palette.textSecondary }]}
            >
              {group.label}
            </Text>
            <Text style={[BODY_REGULAR, TABULAR, { color: palette.textTertiary }]}>
              {format(group.value)}
            </Text>
            <Text
              style={[
                BODY_REGULAR,
                TABULAR,
                { width: SHARE_WIDTH, textAlign: 'right', color: palette.textTertiary },
              ]}
            >
              {group.items.length}
            </Text>
          </>
        )}
      </HoverRow>
      <Collapse open={open} duration={GROUP_MS}>
        <View style={{ paddingBottom: 4, paddingLeft: 22 }}>
          {group.items.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingTop: 4,
                paddingBottom: 4,
              }}
            >
              <Text
                numberOfLines={1}
                style={[BODY_2_REGULAR, { flex: 1, minWidth: 0, color: palette.textSecondary }]}
              >
                {item.label}
              </Text>
              <Text style={[BODY_2_REGULAR, TABULAR, { color: palette.textTertiary }]}>
                {format(item.value)}
              </Text>
              <View style={{ width: SHARE_WIDTH }} />
            </View>
          ))}
        </View>
      </Collapse>
    </View>
  );
}

function LegendRow({
  swatch,
  label,
  value,
  share,
  palette,
}: {
  swatch: string;
  label: string;
  value: string;
  share: string;
  palette: CardPalette;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 5,
        paddingBottom: 5,
      }}
    >
      <View
        style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, backgroundColor: swatch }}
      />
      <Text numberOfLines={1} style={[BODY_REGULAR, { flex: 1, minWidth: 0, color: palette.text }]}>
        {label}
      </Text>
      <Text style={[BODY_REGULAR, TABULAR, { color: palette.textTertiary }]}>{value}</Text>
      <Text
        style={[
          BODY_MEDIUM,
          TABULAR,
          { width: SHARE_WIDTH, textAlign: 'right', color: palette.text },
        ]}
      >
        {share}
      </Text>
    </View>
  );
}

function UsageSection({
  usage,
  palette,
  format,
  expanded,
  onToggle,
  label,
  freeSpaceLabel,
  testID,
}: {
  usage: UsageData;
  palette: CardPalette;
  format: (n: number) => string;
  expanded: boolean;
  onToggle: () => void;
  label: string;
  freeSpaceLabel: string;
  testID?: string;
}) {
  const used = usage.segments.reduce((sum, s) => (s.deferred ? sum : sum + s.value), 0);
  const free = Math.max(0, usage.max - used);
  const share = (n: number) => (n / Math.max(1, usage.max)) * 100;
  const tone = (index: number, color?: string) =>
    color ?? palette.chart[index % palette.chart.length] ?? palette.limitFill;
  const readout = `${format(used)} / ${format(usage.max)}`;
  const percent = `(${Math.round(share(used))}%)`;

  return (
    <>
      <HoverRow
        palette={palette}
        onPress={onToggle}
        expanded={expanded}
        accessibilityLabel={`${label}, ${readout} ${percent}`}
        style={{ justifyContent: 'space-between', gap: 12, paddingTop: 4, paddingBottom: 4 }}
        testID={part(testID, 'context-toggle')}
      >
        {(hovered) => (
          <>
            <Text
              numberOfLines={1}
              style={[BODY_MEDIUM, { flexShrink: 1, color: palette.textSecondary }]}
            >
              {label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Text
                numberOfLines={1}
                style={[BODY_MEDIUM, TABULAR, { color: palette.textSecondary }]}
              >
                {readout}{' '}
                <Text style={[BODY_MEDIUM, TABULAR, { color: palette.text }]}>{percent}</Text>
              </Text>
              <RotatingIcon active={expanded} degrees={180}>
                <RiArrowDownSLine
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  fill={hovered ? palette.textSecondary : palette.textTertiary}
                />
              </RotatingIcon>
            </View>
          </>
        )}
      </HoverRow>

      <Track
        color={palette.track}
        style={{ marginTop: 6 }}
        label={label}
        max={usage.max}
        now={used}
        testID={part(testID, 'context-bar')}
      >
        {usage.segments.map((segment, index) =>
          segment.deferred ? null : (
            <BarFill
              key={segment.label}
              percent={share(segment.value)}
              color={tone(index, segment.color)}
            />
          ),
        )}
      </Track>

      <Collapse
        open={expanded}
        duration={BREAKDOWN_MS}
        // Bleeds 8px so the rows' hover pills keep their corners inside the clip.
        style={{ marginLeft: -8, marginRight: -8, paddingLeft: 8, paddingRight: 8 }}
      >
        <View style={{ paddingTop: 12 }} testID={part(testID, 'breakdown')}>
          {usage.segments.map((segment, index) => (
            <LegendRow
              key={segment.label}
              swatch={segment.deferred ? palette.deferred : tone(index, segment.color)}
              label={segment.label}
              value={format(segment.value)}
              share={segment.deferred ? '—' : `${share(segment.value).toFixed(1)}%`}
              palette={palette}
            />
          ))}
          <LegendRow
            swatch={palette.track}
            label={freeSpaceLabel}
            value={format(free)}
            share={`${share(free).toFixed(1)}%`}
            palette={palette}
          />
          {usage.groups && usage.groups.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {usage.groups.map((group) => (
                <UsageGroupRow key={group.label} group={group} palette={palette} format={format} />
              ))}
            </View>
          ) : null}
        </View>
      </Collapse>
    </>
  );
}

/**
 * The plan arrow: a 24px `rounded-md` link, tertiary icon that turns
 * secondary over a `background-secondary-hover` fill.
 */
function PlanLink({
  palette,
  onPress,
  accessibilityLabel,
  testID,
}: {
  palette: CardPalette;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const ringStyle: WebCssStyle = { '--bloom-agent-limits-ring': palette.ring };
  return (
    <Pressable
      {...(IS_WEB ? ({ dataSet: { bloomAgentLimitsRow: '' } } as Record<string, unknown>) : {})}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        {
          width: 24,
          height: 24,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          backgroundColor: hovered ? palette.hover : 'transparent',
        },
        IS_WEB ? ringStyle : null,
      ]}
    >
      <View style={ICON_BOX} aria-hidden>
        <RiArrowRightLine
          width={ICON_SIZE}
          height={ICON_SIZE}
          fill={hovered ? palette.textSecondary : palette.textTertiary}
        />
      </View>
    </Pressable>
  );
}

function LimitRow({ limit, palette }: { limit: UsageLimit; palette: CardPalette }) {
  const pct = Math.round(
    Math.max(0, Math.min(1, Number.isFinite(limit.used) ? limit.used : 0)) * 100,
  );
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text
          numberOfLines={1}
          style={[BODY_MEDIUM, { flexShrink: 1, minWidth: 0, color: palette.text }]}
        >
          {limit.label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
          <Text style={[BODY_REGULAR, { color: palette.textTertiary }]}>{limit.resets}</Text>
          <Text
            style={[BODY_MEDIUM, TABULAR, { width: 36, textAlign: 'right', color: palette.text }]}
          >
            {pct}%
          </Text>
        </View>
      </View>
      <Track color={palette.track} label={limit.label} max={100} now={pct}>
        <BarFill percent={pct} color={palette.limitFill} rounded />
      </Track>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Card
// ---------------------------------------------------------------------------

const UsageCardComponent: React.FC<UsageCardProps> = ({
  usage,
  radius = 'radius-28',
  title,
  footer,
  fallback,
  plan,
  limits,
  onPlanPress,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  formatValue = defaultFormatValue,
  labels,
  style,
  testID,
}) => {
  const theme = useTheme();
  const fill = useCardFill(style);
  const palette = useMemo(
    () => ({ ...resolvePalette(theme), surface: fill, hover: surfaceFillOn(theme, fill) }),
    [theme, fill],
  );
  const { messages } = useMessages(USAGE_CARD_MESSAGES);
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const toggle = useCallback(() => setExpanded(!expanded), [expanded, setExpanded]);

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  const showPlan = limits !== undefined || plan !== undefined;
  const planHeading = `${labels?.planUsageLimits ?? messages.planUsageLimits}${plan ? ` · ${plan}` : ''}`;

  return (
    <Card
      radius={radius}
      elevation="none"
      testID={testID}
      style={[
        {
          width: '100%',
          minWidth: 0,
          flexDirection: 'column',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 10,
          paddingBottom: 16,
        },
        style,
      ]}
    >
      {usage ? (
        <UsageSection
          usage={usage}
          palette={palette}
          format={formatValue}
          expanded={expanded}
          onToggle={toggle}
          label={title ?? labels?.usage ?? messages.usage}
          freeSpaceLabel={labels?.freeSpace ?? messages.freeSpace}
          testID={testID}
        />
      ) : title || fallback ? (
        <View style={{ gap: 6 }}>
          {title ? (
            <Text style={[BODY_MEDIUM, { color: palette.textSecondary }]}>{title}</Text>
          ) : null}
          {fallback}
        </View>
      ) : null}

      {usage && showPlan ? (
        <View
          style={{
            marginTop: 12,
            marginBottom: 12,
            height: 1,
            width: '100%',
            backgroundColor: palette.separator,
          }}
        />
      ) : null}

      {showPlan ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <Text
              numberOfLines={1}
              style={[BODY_MEDIUM, { flexShrink: 1, color: palette.textSecondary }]}
            >
              {planHeading}
            </Text>
            {onPlanPress ? (
              <PlanLink
                palette={palette}
                onPress={onPlanPress}
                accessibilityLabel={labels?.managePlan ?? messages.managePlan}
                testID={part(testID, 'plan-button')}
              />
            ) : null}
          </View>
          {limits && limits.length > 0 ? (
            <View style={{ gap: 12, paddingTop: 4 }}>
              {limits.map((limit) => (
                <LimitRow key={limit.label} limit={limit} palette={palette} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
    </Card>
  );
};

export const UsageCard = memo(UsageCardComponent);
UsageCard.displayName = 'UsageCard';
