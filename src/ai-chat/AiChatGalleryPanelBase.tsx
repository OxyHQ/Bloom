import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiCollapseDiagonalLine } from '../icons/remix/RiCollapseDiagonalLine';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import { RiGalleryLine } from '../icons/remix/RiGalleryLine';
import { RiImageAddLine } from '../icons/remix/RiImageAddLine';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiSideBarLine } from '../icons/remix/RiSideBarLine';
import { RiSparkling2Line } from '../icons/remix/RiSparkling2Line';
import { withAlpha } from '../composer-panel/shared';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { PanelHeader, PanelPlaceholder } from './AiChatCodePanel';
import { SurfaceAction } from './AiChatControls';
import {
  dataHook,
  IS_WEB,
  primaryHoverOver,
  ROW_RADIUS,
  useAiChatPalette,
  useAiChatWebCss,
  type AiChatPalette,
} from './shared';
import type { AiChatGalleryPanelProps, AiChatGeneration, AiChatPanelAction, AiChatPanelTab } from './types';

const EASE_QUINT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_QUINT_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
const GAP = 8;

const DEFAULT_LABELS = {
  gallery: 'Gallery',
  styles: 'Styles',
  tabs: 'Panel view',
  stylePresets: 'Style presets',
  enlarge: (prompt: string) => `Enlarge ${prompt}`,
  minimize: (prompt: string) => `Minimize ${prompt}`,
  download: (prompt: string) => `Download ${prompt}`,
  more: (prompt: string) => `More actions for ${prompt}`,
};
type Labels = typeof DEFAULT_LABELS;

export const DEFAULT_GALLERY_PANEL_ACTIONS: ReadonlyArray<AiChatPanelAction> = [
  { key: 'new', label: 'New generation', icon: RiImageAddLine },
  { key: 'expand', label: 'Expand panel', icon: RiExpandDiagonalSLine },
  { key: 'toggle', label: 'Toggle panel', icon: RiSideBarLine },
];

/**
 * An optical correction: `RiGalleryLine` is a dense filled rectangle, so
 * the pill draws it at 18px beside the 20px sparkle (`[&_svg]:size-[18px]`).
 */
function GalleryGlyph({ fill }: { width?: number; height?: number; fill?: string }) {
  return <RiGalleryLine width={18} height={18} fill={fill} />;
}

type Placed = AiChatGeneration & { order: number };

/**
 * Split the wall into explicit columns, always filling the currently shortest
 * one, and give every tile its place in the entrance cascade by its vertical
 * offset (ties left to right) — a top-left → bottom-right sweep rather than
 * column 1 top to bottom first.
 */
export function distributeGenerations(items: ReadonlyArray<AiChatGeneration>, columnCount: number): Placed[][] {
  const columns: Placed[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);
  const placed: { item: AiChatGeneration; column: number; top: number }[] = [];
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    placed.push({ item, column: shortest, top: heights[shortest]! });
    heights[shortest]! += 1 / item.aspectRatio;
  }
  const order = new Map<string, number>();
  [...placed]
    .sort((a, b) => a.top - b.top || a.column - b.column)
    .forEach((entry, index) => order.set(entry.item.id, index));
  for (const entry of placed) columns[entry.column]!.push({ ...entry.item, order: order.get(entry.item.id) ?? 0 });
  return columns;
}

/** The scrim's top-to-bottom neutral-950 wash: 40% → clear → 55%. */
function Scrim({ palette, expanded }: { palette: AiChatPalette; expanded: boolean }) {
  const ink = palette.neutral[950];
  if (IS_WEB) {
    const style: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `linear-gradient(to bottom, ${withAlpha(ink, 0.4)}, transparent, ${withAlpha(ink, 0.55)})`,
    };
    return <View pointerEvents="none" style={style} />;
  }
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: expanded ? 1 : 1 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bloom-ai-chat-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ink} stopOpacity={0.4} />
            <Stop offset="0.5" stopColor={ink} stopOpacity={0} />
            <Stop offset="1" stopColor={ink} stopOpacity={0.55} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bloom-ai-chat-scrim)" />
      </Svg>
    </View>
  );
}

/** A 22px glass action on the scrim: neutral-950 @45% (65% hovered), blur 4, radius 6, 14px white glyph. */
function ScrimAction({
  label,
  icon: Icon,
  onPress,
  palette,
}: {
  label: string;
  icon: typeof RiDownload2Line;
  onPress?: () => void;
  palette: AiChatPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
    backgroundColor: withAlpha(palette.neutral[950], hovered ? 0.65 : 0.45),
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    '--bloom-ai-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAiChatControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <Icon width={14} height={14} fill="#ffffff" />
    </Pressable>
  );
}

interface TileProps {
  generation: Placed;
  expanded: boolean;
  isNew: boolean;
  skipEntrance: boolean;
  flying: boolean;
  onToggle: () => void;
  onDownload?: (generation: AiChatGeneration) => void;
  onMore?: (generation: AiChatGeneration) => void;
  labels: Labels;
  palette: AiChatPalette;
  register: (id: string, node: unknown) => void;
}

/**
 * One generation (`GenerationTile`): a radius-10 clipped tile at the
 * artwork's own aspect ratio on background-secondary, the image covering it.
 * Hovering lifts the image 3% (300ms ease-out) and fades in a scrim (200ms) with
 * the download / more actions top-right (each only with its handler) and the
 * prompt along the bottom
 * (body-2-regular, two lines; body-medium and p 10 when expanded, which also adds
 * a minimize action). The whole tile toggles the enlarged view.
 *
 * Entrance: fades and un-blurs 8px over 400ms and scales from 95% over 550ms
 * (`cubic-bezier(0.22, 1, 0.36, 1)`), 130ms × its cascade order late; a freshly
 * generated tile only fades and un-blurs.
 */
function GenerationTile({
  generation,
  expanded,
  isNew,
  skipEntrance,
  flying,
  onToggle,
  onDownload,
  onMore,
  labels,
  palette,
  register,
}: TileProps) {
  const reducedMotion = useReducedMotion();
  const run = !skipEntrance && !reducedMotion;
  const fade = useSharedValue(run ? 0 : 1);
  const grow = useSharedValue(run && !isNew ? 0 : 1);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!run) return;
    const delay = isNew ? 0 : generation.order * 130;
    fade.value = withDelay(delay, withTiming(1, { duration: 400, easing: EASE_QUINT }));
    if (!isNew) grow.value = withDelay(delay, withTiming(1, { duration: 550, easing: EASE_QUINT }));
    // Mount-only entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrance = useAnimatedStyle(
    () => ({
      opacity: fade.value,
      transform: [{ scale: 0.95 + 0.05 * grow.value }],
      ...(IS_WEB ? { filter: fade.value >= 1 ? 'none' : `blur(${8 * (1 - fade.value)}px)` } : null),
    }),
    [fade, grow],
  );

  const scrimShown = IS_WEB ? undefined : expanded;
  const caption = labels[expanded ? 'minimize' : 'enlarge'](generation.prompt);
  const toggleStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    '--bloom-ai-chat-ring': palette.ring,
  };

  return (
    <View
      ref={(node) => register(generation.id, node)}
      {...dataHook('bloomAiChatTile', expanded ? '' : 'lift')}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ position: 'relative', zIndex: expanded || flying ? 30 : undefined }}>
      <Animated.View style={[{ overflow: 'hidden', borderRadius: ROW_RADIUS }, entrance]}>
        <View style={{ position: 'relative', width: '100%', aspectRatio: generation.aspectRatio, backgroundColor: palette.secondary }}>
          {generation.source ? (
            <View
              {...dataHook('bloomAiChatTileImage')}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image
                source={generation.source}
                accessibilityLabel={generation.prompt}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <RiImageAddLine width={20} height={20} fill={palette.iconQuaternary} />
            </View>
          )}

          <Pressable
            {...dataHook('bloomAiChatZoom', expanded ? 'out' : 'in')}
            accessibilityRole="button"
            accessibilityLabel={caption}
            aria-expanded={expanded}
            accessibilityState={{ expanded }}
            onPress={onToggle}
            style={toggleStyle}
          />

          <View
            {...dataHook('bloomAiChatScrim')}
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: expanded ? 10 : 6,
              ...(scrimShown === undefined ? null : { opacity: scrimShown || hovered ? 1 : 0 }),
            }}>
            <Scrim palette={palette} expanded={expanded} />
            <View pointerEvents="box-none" style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
              {expanded ? (
                <ScrimAction label={labels.minimize(generation.prompt)} icon={RiCollapseDiagonalLine} onPress={onToggle} palette={palette} />
              ) : null}
              {onDownload ? (
                <ScrimAction
                  label={labels.download(generation.prompt)}
                  icon={RiDownload2Line}
                  onPress={() => onDownload(generation)}
                  palette={palette}
                />
              ) : null}
              {onMore ? (
                <ScrimAction
                  label={labels.more(generation.prompt)}
                  icon={RiMore2Fill}
                  onPress={() => onMore(generation)}
                  palette={palette}
                />
              ) : null}
            </View>
            <Text
              variant={expanded ? 'body-medium' : 'body-2-regular'}
              numberOfLines={expanded ? undefined : 2}
              pointerEvents="none"
              style={{ paddingLeft: 2, paddingRight: 2, color: '#ffffff' }}>
              {generation.prompt}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

interface Box {
  left: number;
  top: number;
  width: number;
}

/**
 * The gallery panel: the image-generation counterpart to
 * the code panel, sharing its shell — the same column, pt 8 / gap 10 rhythm and
 * 30px pill-tab header (Gallery at 18px, Styles) with 18px actions on 2px
 * padding, radius 6, primary-hover on hover, each named by a tooltip.
 *
 * The wall fills the rest and scrolls: explicit balanced columns 8 apart (so an
 * insertion only moves the column it lands in), a freshly generated image pinned
 * to the head of the first. Pressing a tile lifts it out of its column into a
 * full-width row above the wall; on web the tile morphs between the two boxes
 * (and its neighbours glide) by FLIP over 550ms (600ms for the enlarged tile),
 * painting above the wall while it flies.
 */
export function AiChatGalleryPanelBase({
  generations,
  generated,
  columns: columnCount = 3,
  onDownload,
  onMore,
  tab,
  defaultTab = 'gallery',
  onTabChange,
  stylePresets,
  actions = DEFAULT_GALLERY_PANEL_ACTIONS,
  width = 410,
  labels,
  style,
  testID,
}: AiChatGalleryPanelProps) {
  useAiChatWebCss();
  const palette = useAiChatPalette();
  const reducedMotion = useReducedMotion();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [current, setCurrent] = useControllableState<'gallery' | 'styles'>({
    value: tab,
    defaultValue: defaultTab,
    onChange: onTabChange,
  });

  const columns = useMemo(() => {
    const base = distributeGenerations(generations, columnCount);
    if (!generated?.length) return base;
    return base.map((column, index) => (index === 0 ? [...generated.map((g) => ({ ...g, order: 0 })), ...column] : column));
  }, [generations, generated, columnCount]);
  const generatedIds = useMemo(() => new Set((generated ?? []).map((g) => g.id)), [generated]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = useMemo(
    () => (expandedId ? (columns.flat().find((g) => g.id === expandedId) ?? null) : null),
    [columns, expandedId],
  );
  const visibleColumns = useMemo(
    () => (expandedId ? columns.map((column) => column.filter((g) => g.id !== expandedId)) : columns),
    [columns, expandedId],
  );
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set());
  const [flying, setFlying] = useState<ReadonlySet<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const nodes = useRef(new Map<string, unknown>());
  const boxes = useRef(new Map<string, Box>());
  const register = useCallback((id: string, node: unknown) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const toggleExpanded = (id: string) => {
    const next = expandedId === id ? null : id;
    setFlying(new Set(expandedId && expandedId !== id ? [id, expandedId] : [id]));
    setToggled((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      if (expandedId) updated.add(expandedId);
      return updated;
    });
    setExpandedId(next);
    if (next) scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // FLIP (web): measure every tile against the wall before paint, play each one
  // from where it was, then remember where everything landed.
  const layoutKey = `${expandedId ?? ''}|${columns.map((c) => c.map((g) => g.id).join(',')).join('/')}`;
  const useIsoLayoutEffect = IS_WEB ? useLayoutEffect : useEffect;
  useIsoLayoutEffect(() => {
    if (!IS_WEB) return;
    const content = contentRef.current as unknown as HTMLElement | null;
    if (!content || typeof content.getBoundingClientRect !== 'function') return;
    const origin = content.getBoundingClientRect();
    const next = new Map<string, Box>();
    nodes.current.forEach((node, id) => {
      const element = node as HTMLElement;
      if (typeof element.getBoundingClientRect !== 'function') return;
      const rect = element.getBoundingClientRect();
      const box = { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width };
      next.set(id, box);
      const prev = boxes.current.get(id);
      if (!prev || reducedMotion || typeof element.animate !== 'function') return;
      const dx = prev.left - box.left;
      const dy = prev.top - box.top;
      const scale = box.width > 0 ? prev.width / box.width : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.002) return;
      const clip = element.firstElementChild as HTMLElement | null;
      const settle = () =>
        setFlying((current) => {
          if (!current.has(id)) return current;
          const updated = new Set(current);
          updated.delete(id);
          return updated;
        });
      const timing = { duration: id === expandedId ? 600 : 550, easing: EASE_QUINT_CSS };
      element.animate(
        [
          { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          { transformOrigin: '0 0', transform: 'none' },
        ],
        timing,
      ).onfinish = settle;
      // Hold the corner at 10px while the box scales.
      clip?.animate([{ borderRadius: `${ROW_RADIUS / scale}px` }, { borderRadius: `${ROW_RADIUS}px` }], timing);
    });
    boxes.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  // The panel's own width changing (a resize drag) moves every tile without
  // re-rendering the wall's data; re-baseline so the next toggle starts true.
  const rebaseline = useCallback(() => {
    if (!IS_WEB) return;
    const content = contentRef.current as unknown as HTMLElement | null;
    if (!content || typeof content.getBoundingClientRect !== 'function') return;
    const origin = content.getBoundingClientRect();
    nodes.current.forEach((node, id) => {
      const element = node as HTMLElement;
      if (typeof element.getBoundingClientRect !== 'function') return;
      const rect = element.getBoundingClientRect();
      boxes.current.set(id, { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width });
    });
  }, []);

  // `stylePresets={null}`: the host has no styles to offer, so there is no tab.
  const hasStyles = stylePresets !== null;
  const shown = hasStyles ? current : 'gallery';
  const tabs: AiChatPanelTab[] = [
    { value: 'gallery', label: l.gallery, icon: GalleryGlyph },
    ...(hasStyles ? [{ value: 'styles', label: l.styles, icon: RiSparkling2Line }] : []),
  ];

  const renderTile = (generation: Placed, isExpanded: boolean) => (
    <GenerationTile
      key={generation.id}
      generation={generation}
      expanded={isExpanded}
      isNew={generatedIds.has(generation.id)}
      skipEntrance={isExpanded || toggled.has(generation.id)}
      flying={flying.has(generation.id)}
      onToggle={() => toggleExpanded(generation.id)}
      onDownload={onDownload}
      onMore={onMore}
      labels={l}
      palette={palette}
      register={register}
    />
  );

  return (
    <View
      role="complementary"
      testID={testID}
      style={[
        {
          width,
          minWidth: width,
          maxWidth: width,
          height: '100%',
          flexShrink: 0,
          flexDirection: 'column',
          gap: 10,
          overflow: 'hidden',
          paddingTop: 8,
        },
        style,
      ]}>
      <PanelHeader tabs={tabs} value={shown} onValueChange={(next) => setCurrent(next as 'gallery' | 'styles')} label={l.tabs}>
        {actions.map((action) => (
          <SurfaceAction
            key={action.key}
            label={action.label}
            onPress={action.onPress}
            padding={2}
            radius={6}
            background="transparent"
            hoverBackground={primaryHoverOver(palette, palette.full)}
            palette={palette}
            glyph={(color) => <action.icon width={18} height={18} fill={color} />}
          />
        ))}
      </PanelHeader>

      {shown === 'gallery' ? (
        <ScrollView
          ref={scrollRef}
          {...dataHook('bloomAiChatScroll', 'thin')}
          style={{ minHeight: 0, width: '100%', flex: 1 }}>
          <View ref={contentRef} onLayout={rebaseline} style={{ flexDirection: 'column', gap: GAP }}>
            {expanded ? renderTile(expanded, true) : null}
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {visibleColumns.map((column, index) => (
                <View key={index} style={{ minWidth: 0, flex: 1, flexDirection: 'column', gap: GAP }}>
                  {column.map((generation) => renderTile(generation, false))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        (stylePresets ?? <PanelPlaceholder label={l.stylePresets} palette={palette} />)
      )}
    </View>
  );
}
