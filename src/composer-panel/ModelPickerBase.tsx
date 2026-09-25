import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDownSLine } from '../icons/remix/RiArrowDownSLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RadioIndicator } from '../radio-indicator';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text, TYPE_SCALE } from '../typography';
import { useComposerPopover } from './context';
import { EffortSlider } from './EffortSlider';
import { InlineAside } from './InlineAside';
import {
  DEFAULT_EFFORT,
  EFFORT_WIDTH,
  MODEL_PICKER_EFFORT_LEVELS,
  PICKER_HEIGHT,
  PICKER_WIDTH,
  resolveComposerPalette,
  withAlpha,
  type ComposerPalette,
} from './shared';
import type { ModelPickerLabels, ModelPickerModel, ModelPickerProps, ModelPickerProvider } from './types';
import { dataHook, IS_WEB, useComposerWebCss } from './web-hooks';

/** CSS `ease`, the chevrons' 200ms turn. */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

const RAIL_HEIGHT = 276;
const RAIL_PADDING = 3;
const MARK_HEIGHT = 30;
const MARK_GAP = 6;
const ROW_HEIGHT = 36;
/** The model chip's widest: past this a name truncates even with room to spare. */
const MODEL_TRIGGER_MAX_WIDTH = 240;

const DEFAULT_LABELS: Required<ModelPickerLabels> = {
  models: 'Models',
  quickSearch: 'Quick Search',
  searchPlaceholder: 'Search models',
  closeSearch: 'Close search',
  noMatches: 'No models match',
  providers: 'Providers',
  effort: 'Effort',
  effortAuto: 'Auto',
  faster: 'Faster',
  smarter: 'Smarter',
};

interface Match {
  provider: ModelPickerProvider;
  model: ModelPickerModel;
}

function findModel(providers: ReadonlyArray<ModelPickerProvider>, id: string): Match | null {
  for (const provider of providers) {
    const model = provider.models.find((option) => option.id === id);
    if (model) return { provider, model };
  }
  return null;
}

/** Every model whose name, or provider, contains the query; everything for an empty one. */
function searchModels(providers: ReadonlyArray<ModelPickerProvider>, query: string): Match[] {
  const needle = query.trim().toLowerCase();
  return providers.flatMap((provider) =>
    provider.models
      .filter(
        (model) =>
          !needle || model.name.toLowerCase().includes(needle) || provider.name.toLowerCase().includes(needle),
      )
      .map((model) => ({ provider, model })),
  );
}

/** A chevron that turns to `degrees` over 200ms `ease`. */
function TurningChevron({ degrees, color }: { degrees: number; color: string }) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(degrees);
  useEffect(() => {
    rotation.value = reducedMotion ? degrees : withTiming(degrees, { duration: 200, easing: EASE });
  }, [degrees, reducedMotion, rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }), [rotation]);
  return (
    <Animated.View style={[{ width: 18, height: 18, flexShrink: 0 }, style]}>
      <RiArrowDownSLine width={18} height={18} fill={color} />
    </Animated.View>
  );
}

function ProviderMark({ provider, size, palette }: { provider: ModelPickerProvider; size: number; palette: ComposerPalette }) {
  if (provider.logo) {
    return (
      <View style={{ width: size, height: size, flexShrink: 0 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {provider.logo({ size, color: palette.logo })}
      </View>
    );
  }
  return (
    <View
      style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden>
      <Text
        style={{
          fontSize: Math.round(size * 0.65),
          lineHeight: size,
          fontWeight: '600',
          color: palette.logo,
        }}>
        {provider.name.slice(0, 1)}
      </Text>
    </View>
  );
}

/**
 * The soft top edge of a scrolled list: on web three backdrop blurs of growing
 * strength, each masked shorter than the last, under a wash of the panel colour
 * (surface → surface/70 → transparent). Native has no backdrop filter, so only
 * the wash draws — as an SVG gradient whose alpha lives in `stopOpacity`, never
 * in the stop colour (react-native-svg drops a colour's own alpha). Fades in
 * over 200ms once the list has scrolled.
 */
function ScrollFade({ visible, palette }: { visible: boolean; palette: ComposerPalette }) {
  const base: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    zIndex: 10,
    opacity: visible ? 1 : 0,
    ...(IS_WEB
      ? { transitionProperty: 'opacity', transitionDuration: '200ms', transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' }
      : null),
  };
  if (IS_WEB) {
    const layer = (blur: number, mask: string): WebCssStyle => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      maskImage: `linear-gradient(to bottom, ${mask})`,
      WebkitMaskImage: `linear-gradient(to bottom, ${mask})`,
    });
    const wash: WebCssStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `linear-gradient(to bottom, ${palette.surface} 0%, ${withAlpha(palette.surface, 0.7)} 50%, ${withAlpha(palette.surface, 0)} 100%)`,
    };
    return (
      <View pointerEvents="none" style={base}>
        <View style={layer(1, 'black 0%, black 45%, transparent 100%')} />
        <View style={layer(3, 'black 0%, black 25%, transparent 75%')} />
        <View style={layer(8, 'black 0%, transparent 50%')} />
        <View style={wash} />
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={base}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bloom-composer-scroll-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.surface} stopOpacity={1} />
            <Stop offset="0.5" stopColor={palette.surface} stopOpacity={0.7} />
            <Stop offset="1" stopColor={palette.surface} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bloom-composer-scroll-fade)" />
      </Svg>
    </View>
  );
}

/** The effort level blurs in each time it changes (350ms `ease-out`). */
function BlurInLevel({ level, palette }: { level: string; palette: ComposerPalette }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  useEffect(() => {
    progress.value = 0;
    progress.value = reducedMotion ? 1 : withTiming(1, { duration: 350, easing: EASE_OUT });
  }, [level, reducedMotion, progress]);
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${4 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View style={style}>
      <Text variant="body-medium" style={{ color: palette.text }}>
        {level}
      </Text>
    </Animated.View>
  );
}

/**
 * The effort chip on the checked row. Drawn only where there are stops to
 * choose from — a model with no effort axis gets no chip, rather than an empty
 * one over a slider that cannot commit.
 */
function EffortMenu({
  value,
  onChange,
  levels,
  labels,
  palette,
}: {
  value: number | null;
  onChange: (next: number) => void;
  levels: ReadonlyArray<string>;
  labels: Required<ModelPickerLabels>;
  palette: ComposerPalette;
}) {
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const level = value === null ? labels.effortAuto : (levels[value] ?? labels.effortAuto);

  const chipStyle: WebCssStyle = {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 4,
    paddingLeft: 8,
    backgroundColor: hovered ? palette.tertiaryHover : palette.tertiary,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  const panelStyle: WebCssStyle = {
    width: EFFORT_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 4,
    gap: 0,
    boxShadow: palette.shadowDropdown,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        {...dataHook('bloomComposerControl')}
        accessibilityRole="button"
        accessibilityLabel={`${labels.effort}: ${level}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={chipStyle}>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {level}
        </Text>
        <TurningChevron degrees={open ? 0 : -90} color={palette.iconSecondary} />
      </Pressable>
      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        label={labels.effort}
        side="bottom"
        sideOffset={10}
        style={panelStyle}>
        <View style={{ flexDirection: 'column', paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, marginBottom: -2 }}>
            <Text variant="body-medium" style={{ color: palette.textSecondary }}>
              {`${labels.effort} `}
            </Text>
            <BlurInLevel level={level} palette={palette} />
          </View>
          <View style={{ flexDirection: 'column', gap: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8,
                paddingBottom: 3,
              }}>
              <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                {labels.faster}
              </Text>
              <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
                {labels.smarter}
              </Text>
            </View>
            <View style={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}>
              <EffortSlider
                value={value}
                onChange={onChange}
                levels={levels}
                label={labels.effort}
                unsetLabel={labels.effortAuto}
                palette={palette}
              />
            </View>
          </View>
        </View>
      </Popover>
    </>
  );
}

function ModelRow({
  match,
  checked,
  searching,
  palette,
  onSelect,
  effort,
}: {
  match: Match;
  checked: boolean;
  searching: boolean;
  palette: ComposerPalette;
  onSelect: () => void;
  effort: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const { provider, model } = match;
  const hitStyle: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <View
      style={{
        position: 'relative',
        height: ROW_HEIGHT,
        width: '100%',
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: checked || hovered ? palette.hover : 'transparent',
      }}
      {...dataHook('bloomComposerRow')}>
      {/* The whole row selects; the effort chip sits above it. */}
      <Pressable
        {...dataHook('bloomComposerControl', 'inset')}
        accessibilityRole="radio"
        accessibilityLabel={`${provider.name} ${model.name}`}
        aria-checked={checked}
        accessibilityState={{ checked }}
        onPress={onSelect}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={hitStyle}
      />
      <View pointerEvents="box-none" style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View pointerEvents="box-none" style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View pointerEvents="none">
            <ProviderMark provider={provider} size={16} palette={palette} />
          </View>
          <View pointerEvents="none" style={{ flex: 1, minWidth: 0 }}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {model.name}
              {searching ? <InlineAside color={palette.textTertiary}>{provider.name}</InlineAside> : null}
            </Text>
          </View>
          {effort ? <View style={{ flexShrink: 0, flexDirection: 'row' }}>{effort}</View> : null}
        </View>
        <View pointerEvents="none">
          <RadioIndicator selected={checked} size={14} />
        </View>
      </View>
    </View>
  );
}

/**
 * `ModelPicker`. A 32px trigger with
 * the chosen model's name and a chevron that turns over while open, opening a
 * 341×282 panel upward:
 *
 *   rail     42 wide at (2, 2) inside the border, 276 tall, radius 17, p 3;
 *            marks 36×30 six apart, pill radius, active on tertiary, hover on
 *            tertiary/50; scrolls with no visible scrollbar and keeps the active
 *            mark in view (instantly on open, smoothly after)
 *   column   top 8 / right 8 / left 52: a 20px header ("Models" + a 50%-opacity
 *            "Quick Search" hint, or the search field), then the list 4 below
 *   rows     36 tall, radius 10, px 8: 16px mark, 6, name (+ provider while
 *            searching), the effort chip on the selected row, 12, 14px radio;
 *            4 apart, pb 4, soft top edge once scrolled
 *
 * Quick Search — or "/" and ⌘K while the panel is open (web) — filters every
 * lineup at once; Escape clears the query, then leaves search. The effort chip
 * opens a 266px panel with the six-stop slider.
 *
 * Takes its panel implementation from the family's platform binding.
 */
export function ModelPickerBase({
  providers,
  value,
  defaultValue,
  onValueChange,
  effort,
  defaultEffort = DEFAULT_EFFORT,
  onEffortChange,
  effortLevels = MODEL_PICKER_EFFORT_LEVELS,
  labels: labelOverrides,
  style,
  testID,
}: ModelPickerProps) {
  useComposerWebCss();
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const Popover = useComposerPopover();
  const reducedMotion = useReducedMotion();

  const triggerRef = useRef<View>(null);
  const [open, setOpenState] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [modelId, setModelId] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? providers[0]?.models[0]?.id ?? '',
    onChange: onValueChange,
  });
  const [effortValue, setEffort] = useControllableState<number | null>({
    value: effort,
    defaultValue: defaultEffort,
    // The picker can only ever land on a stop; `null` is the caller's to hold.
    onChange: (next) => {
      if (next !== null) onEffortChange?.(next);
    },
  });

  const selected: Match | null =
    findModel(providers, modelId) ??
    (providers[0]?.models[0] ? { provider: providers[0], model: providers[0].models[0] } : null);

  // The rail browses; it starts on the chosen model's provider each time.
  const [browsing, setBrowsing] = useState<string | null>(null);
  const activeProvider = providers.find((provider) => provider.id === browsing) ?? selected?.provider ?? providers[0];

  // Quick Search: null while the header shows the hint.
  const [query, setQuery] = useState<string | null>(null);
  const searching = query !== null;
  const results = searching ? searchModels(providers, query) : null;

  const setOpen = (next: boolean) => {
    if (next) setBrowsing(null);
    setQuery(null);
    setOpenState(next);
  };

  // "/" or ⌘K anywhere reaches the field while the panel is open (web).
  useEffect(() => {
    if (!IS_WEB || !open || searching || typeof document === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const shortcut = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
      if (!shortcut) return;
      event.preventDefault();
      setQuery('');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, searching]);

  // Keep the active mark in view: instantly on open, smoothly after.
  const railRef = useRef<ScrollView>(null);
  const railOffset = useRef(0);
  const railShown = useRef(false);
  const activeIndex = activeProvider ? providers.indexOf(activeProvider) : 0;
  useEffect(() => {
    if (!open) {
      railShown.current = false;
      return;
    }
    const top = RAIL_PADDING + activeIndex * (MARK_HEIGHT + MARK_GAP);
    const bottom = top + MARK_HEIGHT;
    const first = !railShown.current;
    railShown.current = true;
    const inView = top >= railOffset.current && bottom <= railOffset.current + RAIL_HEIGHT;
    if (!first && inView) return;
    const y = Math.max(0, top - (RAIL_HEIGHT - MARK_HEIGHT) / 2);
    // One frame so the panel's scroller exists.
    const id = setTimeout(() => railRef.current?.scrollTo({ y, animated: !first && !reducedMotion }), 0);
    return () => clearTimeout(id);
  }, [open, activeIndex, reducedMotion]);

  // The list's top edge softens once scrolled; a new lineup starts at the top.
  const listRef = useRef<ScrollView>(null);
  const [scrolled, setScrolled] = useState(false);
  const listKey = searching ? 'search' : (activeProvider?.id ?? '');
  const [prevListKey, setPrevListKey] = useState(listKey);
  if (prevListKey !== listKey) {
    setPrevListKey(listKey);
    setScrolled(false);
  }
  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [listKey]);

  const searchRef = useRef<TextInput>(null);
  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  const rows: Match[] = results ?? (activeProvider ? activeProvider.models.map((model) => ({ provider: activeProvider, model })) : []);

  const triggerStyle: WebCssStyle = {
    // At least 32, never exactly: at the largest system font the name is taller
    // than 32 and a fixed height clipped it. It shrinks (with an ellipsis) to
    // leave the composer's own buttons their room, and stops at a width that
    // still reads as a chip.
    minHeight: 32,
    minWidth: 0,
    maxWidth: MODEL_TRIGGER_MAX_WIDTH,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 9999,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 4,
    paddingLeft: 8,
    backgroundColor: hovered ? palette.hover : palette.surface,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  const panelStyle: WebCssStyle = {
    position: 'relative',
    width: PICKER_WIDTH,
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 0,
    gap: 0,
    boxShadow: palette.shadowPicker,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        testID={testID}
        {...dataHook('bloomComposerControl')}
        accessibilityRole="button"
        accessibilityLabel={selected ? `${labels.models}: ${selected.model.name}` : labels.models}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[triggerStyle, style]}>
        <Text variant="body-medium" numberOfLines={1} ellipsizeMode="tail" style={{ flexShrink: 1, minWidth: 0, paddingLeft: 2, paddingRight: 2, color: palette.textSecondary }}>
          {selected?.model.name ?? ''}
        </Text>
        <TurningChevron degrees={open ? 180 : 0} color={palette.iconSecondary} />
      </Pressable>

      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        label={labels.models}
        side="top"
        sideOffset={8}
        modal
        testID={testID ? `${testID}-panel` : undefined}
        style={panelStyle}>
        {/* Provider rail. */}
        <ScrollView
          ref={railRef}
          {...dataHook('bloomComposerScroll')}
          accessibilityRole="tablist"
          accessibilityLabel={labels.providers}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            railOffset.current = event.nativeEvent.contentOffset.y;
          }}
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            height: RAIL_HEIGHT,
            width: 42,
            borderRadius: 17,
            backgroundColor: palette.rail,
          }}
          contentContainerStyle={{ padding: RAIL_PADDING, width: 42, gap: MARK_GAP }}>
          {providers.map((provider) => (
            <RailMark
              key={provider.id}
              provider={provider}
              active={provider.id === activeProvider?.id}
              palette={palette}
              onPress={() => {
                setBrowsing(provider.id);
                setQuery(null);
              }}
            />
          ))}
        </ScrollView>

        {/* Header and the active lineup. */}
        <View style={{ position: 'absolute', top: 8, right: 8, bottom: 0, left: 52, flexDirection: 'column' }}>
          <View
            style={{
              height: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 5,
              paddingLeft: 2,
              paddingRight: 2,
            }}>
            {searching ? (
              <>
                <TextInput
                  ref={searchRef}
                  {...dataHook('bloomComposerInput')}
                  value={query}
                  onChangeText={setQuery}
                  onKeyPress={(event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
                    if (event.nativeEvent.key !== 'Escape') return;
                    // First Escape clears, the next leaves search; neither reaches
                    // the panel, which would close on it.
                    event.preventDefault();
                    event.stopPropagation();
                    setQuery(query ? '' : null);
                  }}
                  onBlur={() => {
                    if (!query) setQuery(null);
                  }}
                  placeholder={labels.searchPlaceholder}
                  placeholderTextColor={palette.textTertiary}
                  accessibilityLabel={labels.searchPlaceholder}
                  selectionColor={palette.accent500}
                  style={{
                    height: 20,
                    minWidth: 0,
                    flex: 1,
                    padding: 0,
                    ...TYPE_SCALE['body-medium'],
                    fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
                    color: palette.text,
                    backgroundColor: 'transparent',
                  }}
                />
                <Pressable
                  {...dataHook('bloomComposerControl')}
                  accessibilityRole="button"
                  accessibilityLabel={labels.closeSearch}
                  onPress={() => setQuery(null)}
                  style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', borderRadius: 4, cursor: 'pointer' }}>
                  <RiSearchLine width={16} height={16} fill={palette.iconSecondary} />
                </Pressable>
              </>
            ) : (
              <>
                <Text variant="body-medium" style={{ color: palette.textTertiary }}>
                  {labels.models}
                </Text>
                <QuickSearch label={labels.quickSearch} palette={palette} onPress={() => setQuery('')} />
              </>
            )}
          </View>

          <View style={{ position: 'relative', marginTop: 4, flex: 1, minHeight: 0, flexDirection: 'column' }}>
            <ScrollFade visible={scrolled} palette={palette} />
            <ScrollView
              ref={listRef}
              {...dataHook('bloomComposerScroll')}
              accessibilityRole="radiogroup"
              accessibilityLabel={searching ? 'Matching models' : `${activeProvider?.name ?? ''} models`}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 0)}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ flexDirection: 'column', gap: 4, paddingBottom: 4 }}>
              {results && results.length === 0 ? (
                <Text variant="body-medium" style={{ padding: 8, color: palette.textTertiary }}>
                  {labels.noMatches}
                </Text>
              ) : null}
              {rows.map((match) => {
                const checked = match.model.id === modelId;
                return (
                  <ModelRow
                    key={match.model.id}
                    match={match}
                    checked={checked}
                    searching={searching}
                    palette={palette}
                    onSelect={() => {
                      setModelId(match.model.id);
                      // A pick from search lands on that provider's lineup.
                      if (searching) {
                        setBrowsing(match.provider.id);
                        setQuery(null);
                      }
                    }}
                    effort={
                      checked && effortLevels.length > 0 ? (
                        <EffortMenu
                          value={effortValue}
                          onChange={setEffort}
                          levels={effortLevels}
                          labels={labels}
                          palette={palette}
                        />
                      ) : null
                    }
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Popover>
    </>
  );
}

function RailMark({
  provider,
  active,
  palette,
  onPress,
}: {
  provider: ModelPickerProvider;
  active: boolean;
  palette: ComposerPalette;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const markStyle: WebCssStyle = {
    height: MARK_HEIGHT,
    width: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: active ? palette.tertiary : hovered ? withAlpha(palette.tertiary, 0.5) : 'transparent',
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl')}
      accessibilityRole="tab"
      accessibilityLabel={provider.name}
      aria-selected={active}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={markStyle}>
      <ProviderMark provider={provider} size={provider.logoSize ?? 20} palette={palette} />
    </Pressable>
  );
}

/** "Quick Search" + glyph at 50% opacity, full on hover or keyboard focus. */
function QuickSearch({ label, palette, onPress }: { label: string; palette: ComposerPalette; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const quickStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 4,
    opacity: hovered || focused ? 1 : 0.5,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={quickStyle}>
      <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {label}
      </Text>
      <RiSearchLine width={16} height={16} fill={palette.iconSecondary} />
    </Pressable>
  );
}
