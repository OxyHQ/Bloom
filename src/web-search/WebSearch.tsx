import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Text as RNText,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type TextStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  AGENT_LOG_SOFT_EASE,
  AgentLogGuideBridge,
  AgentLogReveal,
  AgentLogRow,
  AgentLogShimmerText,
  AgentLogWorkingRow,
  useAgentLogMotion,
  useAgentLogRevealTicker,
} from '../agent-log';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { SOCIAL_PROVIDERS } from '../social-button/providers';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type {
  WebSearchBrand,
  WebSearchProps,
  WebSearchSource,
  WebSearchStep,
} from './types';

/**
 * Web Search: what the agent looked at, as it looks.
 *
 * The research counterpart to Task List: where that one logs work the agent did,
 * this one logs where it went. Each step is a query it ran or a page it opened,
 * and a step can carry the sources it surfaced, listed underneath with their real
 * marks so the reader recognises a Reddit thread or an X post without reading the
 * domain. Streaming, reveal and the curved guide all come from `agent-log`, so
 * this and `TaskList` move as one.
 *
 * Geometry, resolved to numbers:
 *
 *   step row      py 4, glyph 16 (mt 2) + gap 8, label body-regular, query
 *                 caption-1 mono (ml 6), meta body-regular tabular (pt 1);
 *                 content inset 14 (the log's 16 minus 2 for the glyph's air)
 *   brand glyph   13px mark centred in the 16px slot
 *   sources       bridge 5 tall at x 7, nested list indented 7 (heading: 6 / 7)
 *   toggle        "Sources" body-regular, stack ml 8, marks 20 (border 1, 12px
 *                 mark or 8px dot) overlapping by 6, "+N" ml 8, chevron 16 ml 4
 *   link row      radius 6, px 4 py 4, mark 20 + gap 8, title body-regular
 *                 truncated, domain caption-1 (≥ 640 wide)
 *
 * Motion: a link row grows 280ms on the soft curve, its text fades
 * 160ms after a 50ms beat, rows open bottom-up 100ms apart (first after 100ms)
 * and close top-down 100ms apart, each mark FLIES between the stack and its row on
 * a 420/36 spring, the stack's width follows on the same spring 70ms behind, and
 * the chevron turns 300ms `ease`. All of it snaps under reduced motion.
 */

const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Palette
// ---------------------------------------------------------------------------

export interface WebSearchPalette {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  iconSecondary: string;
  iconQuaternary: string;
  markBorder: string;
  markSurface: string;
  markDot: string;
  rowHover: string;
  ring: string;
  accent: string;
}

/** Canonical theme surfaces, foregrounds and focus roles. */
export function resolveWebSearchPalette(theme: Theme): WebSearchPalette {
  const c = theme.colors;
  return {
    textPrimary: c.text, textSecondary: c.textSecondary, textTertiary: c.textTertiary,
    iconSecondary: c.textSecondary, iconQuaternary: c.textTertiary,
    ring: c.primary, accent: c.primary,
    markBorder: c.borderLight, markSurface: c.card, markDot: c.textTertiary,
    rowHover: c.backgroundSecondary,
  };
}

// ---------------------------------------------------------------------------
//  Web CSS: the toggle's focus ring and the link rows' hover transition.
//  react-native-web consumes `className`, so the rules hang off `dataSet`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-web-search-web-css';
const TOGGLE_SELECTOR = '[data-bloom-web-search-toggle]';
const LINK_SELECTOR = '[data-bloom-web-search-link]';
const WEB_CSS = `
${TOGGLE_SELECTOR} {
  outline: none;
  cursor: pointer;
  text-align: left;
}
${TOGGLE_SELECTOR}:focus-visible {
  box-shadow: 0 0 0 2px var(--bloom-web-search-ring);
}
${LINK_SELECTOR} {
  cursor: pointer;
  text-decoration: none;
  transition: background-color 150ms ease;
}
`;

// ---------------------------------------------------------------------------
//  Motion
// ---------------------------------------------------------------------------

/** Motion's `ease` keyword, as CSS defines it. */
const CSS_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Milliseconds between one link opening and the next. */
const ROW_STAGGER = 100;
const ROW_LEAD = 100;
/** Retracting matches the opening cadence, so each arrival is its own moment. */
const ROW_CLOSE = 100;
const ROW_HEIGHT_MS = 280;

/**
 * The text waits just long enough that a title never beats its mark out of the
 * stack, after which the two travel together and settle on the same frame.
 */
const TEXT_DELAY_MS = 50;
const TEXT_FADE_MS = 160;

/** `{ type: "spring", stiffness: 420, damping: 36 }`. */
const FLIGHT_SPRING = { stiffness: 420, damping: 36, mass: 1 } as const;

/**
 * The stack's width learns about a mark the instant it is reassigned, while the
 * mark still has its whole flight ahead of it; a beat of lag keeps the chevron
 * BEHIND the marks rather than ahead of them.
 */
const STACK_LAG_MS = 70;

const CHEVRON_MS = 300;

/** How many marks the collapsed stack shows before the rest become a count. */
const STACK_LIMIT = 6;

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/** From the underside of the step's 16px glyph down to the top of the nested list. */
const SOURCES_BRIDGE = 5;
/** Nested indent: the glyph's own axis (8), one back so a 1px line lands on it. */
const SOURCES_INDENT = 7;
/** Where the nested trail's trunk sits under a heading's glyph. */
const HEAD_INDENT = 7;
/** From the underside of the heading's glyph to the top of the trail below it. */
const HEAD_BRIDGE = 6;
/** A step and its sources are two units: the sources land a beat after the step. */
const SOURCES_BEAT = 900;

/** Step rows sit 2px closer to the guide: a glyph's ink starts inside its box. */
const STEP_INSET = 14;

const MARK = 20;
const MARK_OVERLAP = 6;
/** Tailwind's `sm` breakpoint, below which link rows drop the domain. */
const SM_BREAKPOINT = 640;

/**
 * Marks whose brand colour is black or near-black. Painted in their own colour
 * they vanish on a dark surface, so they take the text colour instead.
 */
const MONOCHROME_BRANDS = new Set<WebSearchBrand>(['x', 'github', 'apple', 'notion']);

const MONO_FAMILY = IS_WEB ? 'var(--bloom-font-mono)' : 'JetBrains Mono';
const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

// ---------------------------------------------------------------------------
//  Glyphs
// ---------------------------------------------------------------------------

function BrandMark({
  brand,
  size,
  palette,
}: {
  brand: WebSearchBrand;
  size: number;
  palette: WebSearchPalette;
}) {
  const meta = SOCIAL_PROVIDERS[brand];
  const fill = MONOCHROME_BRANDS.has(brand) ? palette.textPrimary : (meta.brand ?? palette.accent);
  return (
    <Svg aria-hidden width={size} height={size} viewBox={meta.viewBox} style={{ flexShrink: 0 }}>
      <Path d={meta.path} fill={fill} />
    </Svg>
  );
}

/** The step's leading glyph: a site's own mark, a supplied icon, or an empty slot. */
function StepGlyph({ step, palette }: { step: WebSearchStep; palette: WebSearchPalette }) {
  const slot = { width: 16, height: 16, marginTop: 2, flexShrink: 0 } as const;
  if (step.brand) {
    // A brand mark is solid to the edge of its box while an outline icon is
    // mostly air: drawn at 13 inside the same 16px slot the two weigh the same.
    return (
      <View aria-hidden style={[slot, { alignItems: 'center', justifyContent: 'center' }]}>
        <BrandMark brand={step.brand} size={13} palette={palette} />
      </View>
    );
  }
  const Icon = step.icon;
  if (!Icon) return <View aria-hidden style={slot} />;
  return (
    <View aria-hidden style={slot}>
      <Icon width={16} height={16} fill={palette.iconSecondary} />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Height that animates to and from `auto`
// ---------------------------------------------------------------------------

/**
 * `motion.li animate={{ height: visible ? "auto" : 0 }} initial={false}`: mounts
 * at its target, then grows to the measured content height (settling on `auto`)
 * or shrinks to 0. Children stay mounted either way.
 */
function useAutoHeight(open: boolean, duration: number) {
  const progress = useSharedValue(open ? 1 : 0);
  const measured = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    progress.value =
      duration > 0
        ? withTiming(open ? 1 : 0, { duration, easing: AGENT_LOG_SOFT_EASE })
        : open
          ? 1
          : 0;
  }, [open, duration, progress]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      measured.value = event.nativeEvent.layout.height;
    },
    [measured],
  );

  const style = useAnimatedStyle(
    () => ({
      height: progress.value >= 1 ? 'auto' : progress.value * measured.value,
    }),
    [progress, measured],
  );

  return { onLayout, style };
}

// ---------------------------------------------------------------------------
//  Mark flight
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

type HostNode = View;

/**
 * A mark renders in exactly ONE place — the stack or its row — and moving it is
 * an unmount + mount (standing in for a shared `layoutId`). The registry is what lets the
 * new copy start where the old one was: the row measures the departing mark just
 * before the switch (`from`), and the arriving mark measures itself on mount and
 * springs across the difference.
 */
interface FlightRegistry {
  root: React.RefObject<HostNode | null>;
  nodes: Map<string, HostNode>;
  from: Map<string, Point>;
}

/** Position of `node` relative to `root`: DOM rects on web (synchronous), `measureLayout` on native. */
function measureRelative(node: HostNode, root: HostNode, done: (point: Point | null) => void) {
  if (Platform.OS === 'web') {
    const el = node as unknown as HTMLElement;
    const base = root as unknown as HTMLElement;
    if (typeof el.getBoundingClientRect !== 'function' || typeof base.getBoundingClientRect !== 'function') {
      done(null);
      return;
    }
    const a = el.getBoundingClientRect();
    const b = base.getBoundingClientRect();
    done({ x: a.left - b.left, y: a.top - b.top });
    return;
  }
  if (typeof node.measureLayout !== 'function') {
    done(null);
    return;
  }
  node.measureLayout(
    root,
    (x, y) => done({ x, y }),
    () => done(null),
  );
}

/** How long an arriving mark stays hidden waiting for a native measurement. */
const MEASURE_TIMEOUT_MS = 48;

/**
 * One source's mark: a 20px disc with a 1px ring holding the caller's icon, the
 * site's brand mark, or a quiet 8px dot.
 */
function SourceMark({
  source,
  flightKey,
  z,
  registry,
  reduce,
  palette,
}: {
  source: WebSearchSource;
  flightKey?: string;
  z: number;
  registry: FlightRegistry;
  reduce: boolean;
  palette: WebSearchPalette;
}) {
  const ref = useRef<HostNode>(null);
  // Read at first render: a mark arriving from somewhere starts hidden until it
  // knows where "somewhere" is, so it never paints a frame at its destination.
  const [hidden, setHidden] = useState(
    () => flightKey != null && !reduce && registry.from.has(flightKey),
  );
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (flightKey == null || !node) return undefined;
    registry.nodes.set(flightKey, node);
    const from = registry.from.get(flightKey);
    registry.from.delete(flightKey);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const root = registry.root.current;
    if (from && !reduce && root) {
      let settled = false;
      measureRelative(node, root, (to) => {
        if (settled) return;
        settled = true;
        if (to) {
          const dx = from.x - to.x;
          const dy = from.y - to.y;
          if (IS_WEB) {
            // Painted before reanimated's first frame lands.
            (node as unknown as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
          }
          tx.value = withSequence(withTiming(dx, { duration: 0 }), withSpring(0, FLIGHT_SPRING));
          ty.value = withSequence(withTiming(dy, { duration: 0 }), withSpring(0, FLIGHT_SPRING));
        }
        setHidden(false);
      });
      timeout = setTimeout(() => {
        settled = true;
        setHidden(false);
      }, MEASURE_TIMEOUT_MS);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
      if (registry.nodes.get(flightKey) === node) registry.nodes.delete(flightKey);
    };
    // Mount-only: a mark flies once per arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flightStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }] }),
    [tx, ty],
  );

  return (
    <Animated.View
      ref={ref}
      aria-hidden
      style={[
        {
          position: 'relative',
          zIndex: z,
          width: MARK,
          height: MARK,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: MARK / 2,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderLeftWidth: 1,
          borderTopColor: palette.markBorder,
          borderRightColor: palette.markBorder,
          borderBottomColor: palette.markBorder,
          borderLeftColor: palette.markBorder,
          backgroundColor: palette.markSurface,
          opacity: hidden ? 0 : 1,
        },
        flightStyle,
      ]}
    >
      {source.icon ? (
        <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
          {source.icon}
        </View>
      ) : source.brand ? (
        <BrandMark brand={source.brand} size={12} palette={palette} />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.markDot }} />
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
//  Sources
// ---------------------------------------------------------------------------

function SourceLinkRow({
  source,
  visible,
  flightKey,
  z,
  reduce,
  registry,
  palette,
  showDomain,
  testID,
}: {
  source: WebSearchSource;
  visible: boolean;
  flightKey?: string;
  z: number;
  reduce: boolean;
  registry: FlightRegistry;
  palette: WebSearchPalette;
  showDomain: boolean;
  testID?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const height = useAutoHeight(visible, reduce ? 0 : ROW_HEIGHT_MS);

  const textOpacity = useSharedValue(visible ? 1 : 0);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const target = visible ? 1 : 0;
    textOpacity.value = reduce
      ? target
      : withDelay(visible ? TEXT_DELAY_MS : 0, withTiming(target, { duration: TEXT_FADE_MS }));
  }, [visible, reduce, textOpacity]);
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }), [textOpacity]);

  const href = source.href;
  const content = (
    <>
      {visible ? (
        <SourceMark
          source={source}
          flightKey={flightKey}
          z={z}
          registry={registry}
          reduce={reduce}
          palette={palette}
        />
      ) : (
        <View aria-hidden style={{ width: MARK, height: MARK, flexShrink: 0 }} />
      )}
      <Animated.View
        style={[
          { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
          textStyle,
        ]}
      >
        <Text selectable={false}
          variant="body-regular"
          numberOfLines={1}
          style={{ flex: 1, minWidth: 0, color: palette.textSecondary }}
        >
          {source.title}
        </Text>
        {showDomain ? (
          <Text selectable={false} variant="caption-1-regular" style={{ flexShrink: 0, color: palette.textTertiary }}>
            {source.domain}
          </Text>
        ) : null}
      </Animated.View>
    </>
  );

  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
  } as const;

  return (
    <Animated.View role="listitem" testID={testID} style={[{ overflow: 'hidden' }, height.style]}>
      <View onLayout={height.onLayout}>
        {href ? (
          <Pressable
            {...(IS_WEB
              ? ({
                  dataSet: { bloomWebSearchLink: '' },
                  href,
                  hrefAttrs: { target: '_blank', rel: 'noreferrer' },
                } as Record<string, unknown>)
              : {})}
            role="link"
            accessibilityLabel={`${source.title}, ${source.domain}`}
            tabIndex={visible ? 0 : -1}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            onPress={() => {
              // On web the rendered `<a href>` navigates by itself.
              if (!IS_WEB) Linking.openURL(href).catch(() => {});
            }}
            style={[rowStyle, { backgroundColor: hovered ? palette.rowHover : 'transparent' }]}
          >
            {content}
          </Pressable>
        ) : (
          <View style={rowStyle}>{content}</View>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * The sources a step found: marks first, the links themselves behind a chevron.
 *
 * One counter runs the whole thing. `shown` opens rows from the bottom up, so the
 * mark that leaves the stack first is its rightmost, and each next link lands
 * above the one before it; closing walks back down. Every row animates its own
 * height, so the panel grows a row at a time instead of jumping to full size.
 */
function SourcesRow({
  sources,
  reduce,
  palette,
  label,
  testID,
}: {
  sources: ReadonlyArray<WebSearchSource>;
  reduce: boolean;
  palette: WebSearchPalette;
  label: string;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [countWidth, setCountWidth] = useState(0);
  const uid = useId();
  const { width: windowWidth } = useWindowDimensions();
  const showDomain = windowWidth >= SM_BREAKPOINT;

  const rootRef = useRef<HostNode>(null);
  const registry = useMemo<FlightRegistry>(
    () => ({ root: rootRef, nodes: new Map(), from: new Map() }),
    [],
  );

  const total = sources.length;
  // Marks past the stack have nowhere to fly from, so they simply appear.
  const flightId = useCallback(
    (index: number) => (reduce || index >= STACK_LIMIT ? undefined : `${uid}-source-${index}`),
    [reduce, uid],
  );

  // Opening walks up the list, closing walks back down, one row per tick.
  useEffect(() => {
    if (open && shown >= total) return undefined;
    if (!open && shown === 0) return undefined;
    const next = open ? shown + 1 : shown - 1;
    // The row whose visibility this tick flips.
    const moving = open ? total - 1 - shown : total - shown;
    const delay = open ? (shown === 0 ? ROW_LEAD : ROW_STAGGER) : ROW_CLOSE;

    let cancelled = false;
    let advanced = false;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const advance = () => {
      if (cancelled || advanced) return;
      advanced = true;
      setShown(next);
    };
    const id = setTimeout(
      () => {
        const key = flightId(moving);
        const node = key ? registry.nodes.get(key) : undefined;
        const root = rootRef.current;
        if (!key || !node || !root) {
          advance();
          return;
        }
        // Where the mark is right now — mid-flight included — is where its next
        // copy departs from.
        measureRelative(node, root, (point) => {
          if (cancelled || advanced) return;
          if (point) registry.from.set(key, point);
          advance();
        });
        fallback = setTimeout(advance, MEASURE_TIMEOUT_MS);
      },
      reduce ? 0 : delay,
    );
    return () => {
      cancelled = true;
      clearTimeout(id);
      if (fallback) clearTimeout(fallback);
    };
  }, [open, shown, total, reduce, flightId, registry]);

  const stacked = sources.slice(0, STACK_LIMIT);
  const overflow = total - stacked.length;
  // Rows open from the bottom, so the last source is the first to leave.
  const rowVisible = (index: number) => shown > total - 1 - index;

  // A 20px mark plus 14px for every one behind it, from those still stacked;
  // zero once they have all gone, so the chevron closes right up. The "+N" count
  // is added to it so it doesn't overprint the chevron.
  const stillStacked = stacked.filter((_, index) => !rowVisible(index)).length;
  const showCount = overflow > 0 && shown === 0;
  const stackWidth =
    (stillStacked > 0 ? stillStacked * (MARK - MARK_OVERLAP) + MARK_OVERLAP : 0) +
    (showCount ? 8 + countWidth : 0);

  const width = useSharedValue(stackWidth);
  const firstWidth = useRef(true);
  useEffect(() => {
    if (firstWidth.current) {
      firstWidth.current = false;
      return;
    }
    width.value = reduce
      ? stackWidth
      : withDelay(STACK_LAG_MS, withSpring(stackWidth, FLIGHT_SPRING));
  }, [stackWidth, reduce, width]);
  const stackStyle = useAnimatedStyle(() => ({ width: width.value }), [width]);

  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    rotation.value = reduce
      ? open
        ? 180
        : 0
      : withTiming(open ? 180 : 0, { duration: CHEVRON_MS, easing: CSS_EASE });
  }, [open, reduce, rotation]);
  const chevronStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, []);

  const ringStyle: WebCssStyle = { '--bloom-web-search-ring': palette.ring };

  return (
    <AgentLogRow first={false} last reduce={reduce} testID={testID}>
      <View ref={rootRef} style={{ paddingTop: 4, paddingBottom: 4 }}>
        <Pressable
          {...(IS_WEB ? ({ dataSet: { bloomWebSearchToggle: '' } } as Record<string, unknown>) : {})}
          testID={testID ? `${testID}-toggle` : undefined}
          role="button"
          accessibilityLabel={label}
          aria-expanded={open}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={[
            { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 6 },
            ringStyle,
          ]}
        >
          <Text selectable={false} variant="body-regular" style={{ color: palette.textSecondary }}>
            {label}
          </Text>
          <Animated.View
            testID={testID ? `${testID}-stack` : undefined}
            style={[{ marginLeft: 8, flexDirection: 'row', alignItems: 'center' }, stackStyle]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {stacked.map((source, index) =>
                rowVisible(index) ? null : (
                  <View
                    key={`${source.domain}-${index}`}
                    style={{ marginLeft: index === 0 ? 0 : -MARK_OVERLAP, zIndex: stacked.length - index }}
                  >
                    <SourceMark
                      source={source}
                      flightKey={flightId(index)}
                      z={stacked.length - index}
                      registry={registry}
                      reduce={reduce}
                      palette={palette}
                    />
                  </View>
                ),
              )}
            </View>
            {showCount ? (
              <RNText
                onLayout={(event) => setCountWidth(Math.ceil(event.nativeEvent.layout.width))}
                style={[
                  TYPE_SCALE['body-regular'],
                  TABULAR,
                  {
                    marginLeft: 8,
                    color: palette.textTertiary,
                    fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
                  },
                ]}
              >
                +{overflow}
              </RNText>
            ) : null}
          </Animated.View>
          <Animated.View aria-hidden style={[{ marginLeft: 4, width: 16, height: 16 }, chevronStyle]}>
            <RiArrowDownSLine
              width={16}
              height={16}
              fill={hovered ? palette.iconSecondary : palette.iconQuaternary}
            />
          </Animated.View>
        </Pressable>

        <View role="list">
          {sources.map((source, index) => (
            <SourceLinkRow
              key={`${source.domain}-${index}`}
              source={source}
              visible={rowVisible(index)}
              flightKey={flightId(index)}
              z={total - index}
              reduce={reduce}
              registry={registry}
              palette={palette}
              showDomain={showDomain}
              testID={testID ? `${testID}-link-${index}` : undefined}
            />
          ))}
        </View>
      </View>
    </AgentLogRow>
  );
}

// ---------------------------------------------------------------------------
//  Steps
// ---------------------------------------------------------------------------

/** The line itself: glyph, label, an optional query, an optional tally. */
function StepContent({
  step,
  active,
  palette,
}: {
  step: WebSearchStep;
  active: boolean;
  palette: WebSearchPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <StepGlyph step={step} palette={palette} />
      <Text selectable={false} variant="body-regular" style={{ flex: 1, minWidth: 0, color: palette.textSecondary }}>
        {active ? <AgentLogShimmerText>{step.label}</AgentLogShimmerText> : step.label}
        {step.query ? (
          <RNText
            style={[
              TYPE_SCALE['caption-1-regular'],
              { color: palette.textTertiary, fontFamily: MONO_FAMILY },
              // Nested text takes no margin on native; a space stands in for `ml-1.5`.
              IS_WEB ? { marginLeft: 6 } : null,
            ]}
          >
            {IS_WEB ? step.query : ` ${step.query}`}
          </RNText>
        ) : null}
      </Text>
      {step.meta ? (
        <Text selectable={false}
          variant="body-regular"
          style={[{ flexShrink: 0, paddingTop: 1, color: palette.textTertiary }, TABULAR]}
        >
          {step.meta}
        </Text>
      ) : null}
    </View>
  );
}

function StepRow({
  step,
  active,
  first,
  last,
  showSources,
  reduce,
  palette,
  sourcesLabel,
  testID,
}: {
  step: WebSearchStep;
  active: boolean;
  first: boolean;
  last: boolean;
  showSources: boolean;
  reduce: boolean;
  palette: WebSearchPalette;
  sourcesLabel: string;
  testID?: string;
}) {
  return (
    <AgentLogRow first={first} last={last} reduce={reduce} style={{ paddingLeft: STEP_INSET }} testID={testID}>
      <View style={{ paddingTop: 4, paddingBottom: 4 }}>
        <StepContent step={step} active={active} palette={palette} />
        {step.sources?.length && showSources ? (
          // The bridge carries the trunk up to this row's glyph, so the sources
          // descend from the step that found them.
          <View style={{ position: 'relative', marginTop: 2 }}>
            <AgentLogGuideBridge height={SOURCES_BRIDGE} offset={SOURCES_INDENT} reduce={reduce} />
            <View role="list" style={{ marginLeft: SOURCES_INDENT }}>
              <SourcesRow
                sources={step.sources}
                reduce={reduce}
                palette={palette}
                label={sourcesLabel}
                testID={testID ? `${testID}-sources` : undefined}
              />
            </View>
          </View>
        ) : null}
      </View>
    </AgentLogRow>
  );
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

interface Unit {
  step: number;
  kind: 'step' | 'sources';
}

function WebSearchComponent({
  steps,
  run = true,
  stepInterval = 850,
  startDelay = 320,
  revealed: controlledRevealed,
  working = 'Working',
  onComplete,
  reduce: reduceProp,
  labels,
  style,
  testID,
}: WebSearchProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveWebSearchPalette(theme), [theme]);
  const systemReduce = useAgentLogMotion();
  const reduce = reduceProp ?? systemReduce;
  const sourcesLabel = labels?.sources ?? 'Sources';

  // Every row is a unit, so a step that found sources contributes two and the
  // log can pause between them.
  const units = useMemo<Unit[]>(
    () =>
      steps.flatMap((step, index) =>
        step.sources?.length && !step.heading
          ? [
              { step: index, kind: 'step' as const },
              { step: index, kind: 'sources' as const },
            ]
          : [{ step: index, kind: 'step' as const }],
      ),
    [steps],
  );
  // One tick past the last row, so the final step holds and shimmers for its own
  // dwell. Only when uncontrolled: a caller driving `revealed` knows when the
  // agent is actually finished.
  const isControlled = controlledRevealed !== undefined;
  const total = units.length + (isControlled ? 0 : 1);

  // How long to sit on the unit before this one. A step with sources holds only
  // the short beat before they arrive; the step's own dwell runs after them.
  const delayFor = useCallback(
    (index: number) => {
      if (index === 0) return startDelay;
      const previous = units[index - 1];
      if (!previous) return stepInterval;
      const step = steps[previous.step];
      if (!step) return stepInterval;
      if (previous.kind === 'step' && step.sources?.length && !step.heading) return SOURCES_BEAT;
      return step.dwell ?? stepInterval;
    },
    [units, steps, startDelay, stepInterval],
  );

  const revealed = useAgentLogRevealTicker({
    total,
    run,
    startDelay,
    stepInterval,
    revealed: controlledRevealed,
    delayFor,
    onComplete,
  });

  const unitOf = (stepIndex: number, kind: Unit['kind']) =>
    units.findIndex((u) => u.step === stepIndex && u.kind === kind);

  // A leading heading is the root the trail hangs from.
  const head = steps[0]?.heading ? steps[0] : null;
  const trail = head ? steps.slice(1) : steps;
  const offset = head ? 1 : 0;

  const shownCount = trail.filter((_, i) => revealed > unitOf(i + offset, 'step')).length;
  const lastShownIndex = shownCount - 1;
  const busy = working !== false && revealed > 0 && revealed < total;

  const list = (
    <View role="list" aria-live="polite">
      {trail.map((step, index) => {
        const stepIndex = index + offset;
        const unit = unitOf(stepIndex, 'step');
        if (revealed <= unit) return null;
        const sourcesUnit = unitOf(stepIndex, 'sources');
        return (
          <StepRow
            key={`${step.label}-${stepIndex}`}
            step={step}
            // Still the newest thing in the log, sources pending included.
            active={!reduce && index === lastShownIndex && revealed < total}
            first={index === 0}
            last={index === lastShownIndex}
            showSources={sourcesUnit === -1 ? false : revealed > sourcesUnit}
            reduce={reduce}
            palette={palette}
            sourcesLabel={sourcesLabel}
            testID={testID ? `${testID}-step-${stepIndex}` : undefined}
          />
        );
      })}
    </View>
  );

  // The indicator sits outside the trail, level with the heading (or, with no
  // heading, on the step glyphs' edge): it is not something the search found.
  const indicator =
    busy ? (
      <AgentLogWorkingRow
        label={working}
        reduce={reduce}
        style={head ? undefined : { paddingLeft: STEP_INSET }}
        testID={testID ? `${testID}-working` : undefined}
      />
    ) : null;

  if (!head) {
    return (
      <View testID={testID} style={[{ width: '100%' }, style]}>
        {list}
        {indicator}
      </View>
    );
  }

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      {revealed > 0 ? (
        <AgentLogReveal reduce={reduce} testID={testID ? `${testID}-heading` : undefined}>
          <View style={{ paddingTop: 4, paddingBottom: 4 }}>
            <StepContent
              step={head}
              active={!reduce && revealed === 1 && total > 1}
              palette={palette}
            />
          </View>
        </AgentLogReveal>
      ) : null}
      {revealed > 1 ? (
        <View style={{ position: 'relative' }}>
          <AgentLogGuideBridge height={HEAD_BRIDGE} offset={HEAD_INDENT} reduce={reduce} />
          <View style={{ marginLeft: HEAD_INDENT }}>{list}</View>
        </View>
      ) : null}
      {indicator}
    </View>
  );
}

export const WebSearch = memo(WebSearchComponent);
WebSearch.displayName = 'WebSearch';
