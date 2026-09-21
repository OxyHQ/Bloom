import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { PageHeader } from '../page-header';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { VerticalFade } from './SettingsArt';
import { Backdrop, OverlayRoot } from '../overlay';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { Text } from '../typography';
import {
  SettingsModalContext,
  settingsLayoutFor,
  useSettingsPalette,
  type SettingsModalLayout,
} from './context';
import { ModalPortal } from './modal-portal';
import type { SettingsPalette } from './palette';
import type { SettingsModalProps, SettingsNavGroup, SettingsNavItem } from './types';
import { IS_WEB, useSettingsWebCss } from './web-css';

/**
 * A settings modal.
 *
 *   backdrop  black @ 70%
 *   panel     871×614 (capped at the viewport − 32), radius 24,
 *             background/full, shadow-xs, clipped
 *   rail      274 wide, background/secondary, 1px right separator, p 10,
 *             groups 20 apart; group = pt 4, label (pl 8, body-medium,
 *             text/secondary) 6 above rows 4 apart; row = p 8, radius 10,
 *             20px icon (icon/secondary) + 8 + body-medium label
 *             (selected: background/secondary/hover + text/primary;
 *             hover: background/secondary/hover @ 60%)
 *   content   shared inline PageHeader and close ButtonGroup island; the page scrolls under a 40px top fade that eases
 *             in (200ms) once it is scrolled; px 32 pb 32
 *   toast     "Saved" pill straddling the panel's bottom edge: 1px
 *             border/button, background/primary, py 4 pr 10 pl 6, gap 4,
 *             16px lime check + body-2-medium, shadow-dropdown. Rises 12px in,
 *             drifts 10px up on the way out, scale .9 + blur 2px, 200ms.
 *
 * Motion: the panel fades, un-blurs (4px, web) and scales from .85 over 300ms
 * on `cubic-bezier(0.32, 0.72, 0, 1)`; the backdrop cross-fades; close plays
 * the same in reverse and unmounts after it. All of it snaps under reduced
 * motion.
 *
 * WHY NOT `Dialog`: this shell differs from Dialog's centered card in every
 * load-bearing way — its own backdrop (black 70%, no blur), radius, surface,
 * size, motion curve and a toast that must sit OUTSIDE the panel's clip.
 * Dialog's card owns its chrome, its keyframes and its overflow, so hosting
 * this inside it means overriding all of them from outside. The shell is built
 * from the same authorities Dialog is — `Portal`, `OverlayRoot` (the stacking
 * rank) and `Backdrop` (the pointer-events contract) — and takes Dialog's
 * `control` from `useDialogControl()`, so it is driven exactly like one.
 */

const PANEL_WIDTH = 871;
const PANEL_HEIGHT = 614;
const RAIL_WIDTH = 274;
/** `medium` layout: the rail narrows so the page keeps a readable measure. */
const RAIL_WIDTH_MEDIUM = 220;
/** Content inset per layout — 32 at regular, stepping down with the room. */
const CONTENT_INSET: Record<SettingsModalLayout, number> = { regular: 32, medium: 24, compact: 16 };
const VIEWPORT_GUTTER = 16;
const MOTION_MS = 300;
const UNMOUNT_MS = 320;
const MOTION_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const EASE = Easing.bezier(0.32, 0.72, 0, 1);
/** Tailwind `ease-out` — the backdrop's cross-fade. */
const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const SAVED_VISIBLE_MS = 2000;
const SAVED_FADE_MS = 220;

type SavedPhase = 'hidden' | 'shown' | 'leaving';

/** Double rAF — the hidden state must commit before the transition runs. */
function afterPaint(fn: () => void): () => void {
  if (typeof requestAnimationFrame !== 'function') {
    const t = setTimeout(fn, 0);
    return () => clearTimeout(t);
  }
  let inner = 0;
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(outer);
    if (inner) cancelAnimationFrame(inner);
  };
}

function firstPage(groups: SettingsNavGroup[]): string | undefined {
  for (const group of groups) {
    for (const item of group.items) if (item.page) return item.page;
  }
  return undefined;
}

export function SettingsModal({
  control,
  open: controlledOpen,
  onClose,
  groups,
  pages,
  page: controlledPage,
  defaultPage,
  onPageChange,
  initialView = 'navigation',
  labels,
  testID,
}: SettingsModalProps) {
  useSettingsWebCss();
  const palette = useSettingsPalette();
  const reducedMotion = useReducedMotion();
  const isControlled = controlledOpen !== undefined;

  const [mounted, setMounted] = useState(controlledOpen === true);
  const [visible, setVisible] = useState(false);
  // Bumped by every open, so reopening during an exit replays the enter.
  const [openCount, setOpenCount] = useState(0);
  const [internalPage, setInternalPage] = useState<string | undefined>(
    defaultPage ?? firstPage(groups),
  );
  const currentPage = controlledPage ?? internalPage;
  const { width: vw, height: vh } = useWindowDimensions();
  const layout = settingsLayoutFor(vw);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const insets = useSafeAreaInsets();

  // `compact` layout is two levels: the section list, then a page pushed over it.
  const [compactPageOpen, setCompactPageOpen] = useState(initialView === 'page');
  const initialViewRef = useRef(initialView);
  initialViewRef.current = initialView;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;
  const defaultPageRef = useRef(defaultPage ?? firstPage(groups));
  defaultPageRef.current = defaultPage ?? firstPage(groups);

  const show = useCallback(() => {
    setInternalPage(defaultPageRef.current);
    setCompactPageOpen(initialViewRef.current === 'page');
    setMounted(true);
    setOpenCount((count) => count + 1);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  // Enter: once mounted, the hidden frame commits, then the transition runs.
  useEffect(() => {
    if (!mounted) return;
    return afterPaint(() => setVisible(true));
  }, [mounted, openCount]);

  // Exit: unmount only after the reverse transition. `visible` goes false
  // before `mounted` does, so this runs for every close.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible) {
      wasVisible.current = true;
      return;
    }
    if (!mounted || !wasVisible.current) return;
    const timer = setTimeout(
      () => {
        wasVisible.current = false;
        setMounted(false);
        if (!isControlledRef.current) onCloseRef.current?.();
      },
      reducedMotion ? 0 : UNMOUNT_MS,
    );
    return () => clearTimeout(timer);
  }, [visible, mounted, reducedMotion]);

  // Controlled mode mirrors `open` into the same two-phase lifecycle.
  useEffect(() => {
    if (!isControlled) return;
    if (controlledOpen) show();
    else hide();
  }, [isControlled, controlledOpen, show, hide]);

  const requestClose = useCallback(() => {
    if (isControlledRef.current) onCloseRef.current?.();
    else hide();
  }, [hide]);

  useImperativeHandle(
    control?.ref,
    () => ({
      open: show,
      close: (cb?: () => void) => {
        hide();
        if (cb) setTimeout(cb, UNMOUNT_MS);
      },
    }),
    [show, hide],
  );

  const selectPage = useCallback(
    (next: string) => {
      if (controlledPage === undefined) setInternalPage(next);
      setCompactPageOpen(true);
      onPageChange?.(next);
    },
    [controlledPage, onPageChange],
  );

  // Escape closes (web). On `window`, not `document`: a menu or popover opened
  // inside the modal handles Escape on `document` and stops propagation there,
  // so the innermost surface closes first and the modal stays open.
  useEffect(() => {
    if (!mounted || !IS_WEB || typeof window === 'undefined') return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mounted, requestClose]);

  const compactPageOpenRef = useRef(false);
  compactPageOpenRef.current = compactPageOpen && layoutRef.current === 'compact';

  // Android back closes, like a native modal.
  useEffect(() => {
    // `BackHandler` is absent from some test environments' react-native mocks.
    if (!mounted || IS_WEB || typeof BackHandler?.addEventListener !== 'function') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // On a pushed page (compact), back returns to the section list first.
      if (compactPageOpenRef.current) setCompactPageOpen(false);
      else requestClose();
      return true;
    });
    return () => sub.remove();
  }, [mounted, requestClose]);

  // ----- saved toast -------------------------------------------------------
  const [savedPhase, setSavedPhase] = useState<SavedPhase>('hidden');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSaved = useCallback(() => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSavedPhase('shown');
    savedTimer.current = setTimeout(() => {
      setSavedPhase('leaving');
      // Back to the below-the-edge start once faded, so the next save rises in again.
      savedTimer.current = setTimeout(() => setSavedPhase('hidden'), SAVED_FADE_MS);
    }, SAVED_VISIBLE_MS);
  }, []);
  useEffect(() => {
    if (!mounted) setSavedPhase('hidden');
  }, [mounted]);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const context = useMemo(
    () => ({ showSaved, close: requestClose, layout }),
    [showSaved, requestClose, layout],
  );

  // ----- motion ------------------------------------------------------------
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reducedMotion
      ? visible
        ? 1
        : 0
      : withTiming(visible ? 1 : 0, { duration: MOTION_MS, easing: EASE_OUT });
  }, [visible, reducedMotion, progress]);

  const panelProgress = useSharedValue(0);
  useEffect(() => {
    if (IS_WEB) return;
    panelProgress.value = reducedMotion
      ? visible
        ? 1
        : 0
      : withTiming(visible ? 1 : 0, { duration: MOTION_MS, easing: EASE });
  }, [visible, reducedMotion, panelProgress]);
  const isCompact = layout === 'compact';
  const nativePanelMotion = useAnimatedStyle(
    () => ({
      opacity: panelProgress.value,
      transform: isCompact
        ? [{ translateY: 16 * (1 - panelProgress.value) }]
        : [{ scale: 0.85 + 0.15 * panelProgress.value }],
    }),
    [panelProgress, isCompact],
  );

  // Full screen, a .85 scale reads as the page shrinking away; compact rises 16px instead.
  const webPanelMotion: WebCssStyle = {
    opacity: visible ? 1 : 0,
    transform: isCompact
      ? [{ translateY: visible ? 0 : 16 }]
      : [{ scale: visible ? 1 : 0.85 }],
    filter: visible ? 'blur(0px)' : 'blur(4px)',
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: reducedMotion ? '0ms' : `${MOTION_MS}ms`,
    transitionTimingFunction: MOTION_EASING,
  };

  if (!mounted) return null;

  const pageConfig = currentPage ? pages[currentPage] : undefined;
  const closeLabel = labels?.close ?? 'Close settings';

  return (
    <ModalPortal>
      <SettingsModalContext.Provider value={context}>
        <OverlayRoot>
          <Backdrop
            onPress={requestClose}
            progress={progress}
            blurIntensity={0}
            dimColor="#000"
            dimOpacity={0.7}
            accessibilityLabel={closeLabel}
            testID={testID ? `${testID}-backdrop` : undefined}
          >
            <View
              pointerEvents="box-none"
              style={[styles.center, layout === 'compact' ? styles.centerCompact : null]}
            >
              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.motion,
                  layout === 'compact' ? styles.motionCompact : null,
                  IS_WEB ? webPanelMotion : nativePanelMotion,
                ]}
              >
                <View
                  role="dialog"
                  aria-modal
                  aria-label={labels?.dialog ?? 'Settings'}
                  testID={testID}
                  {...webDataSet({ bloomSettingsDialog: '' })}
                  style={[
                    styles.panel,
                    layout === 'compact'
                      ? {
                          // Full screen: no radius, no gutter, content inside the safe area.
                          width: vw,
                          height: vh,
                          borderRadius: 0,
                          paddingTop: insets.top,
                          paddingBottom: insets.bottom,
                          paddingLeft: insets.left,
                          paddingRight: insets.right,
                        }
                      : {
                          width: Math.min(PANEL_WIDTH, vw - VIEWPORT_GUTTER * 2),
                          height: Math.min(PANEL_HEIGHT, vh - VIEWPORT_GUTTER * 2),
                        },
                    {
                      backgroundColor: palette.full,
                      boxShadow: palette.shadowXs,
                    },
                    ringVars(palette),
                  ]}
                >
                  {layout === 'compact' ? (
                    compactPageOpen && pageConfig ? (
                      <View style={styles.content}>
                        <SettingsHeader
                          title={pageConfig.title}
                          onBack={() => setCompactPageOpen(false)}
                          backLabel={labels?.back ?? 'Back'}
                          closeLabel={closeLabel}
                          onClose={requestClose}
                          palette={palette}
                          testID={testID}
                        />
                        <PageScroller
                          key={currentPage}
                          palette={palette}
                          inset={CONTENT_INSET.compact}
                          insetTop={CONTENT_INSET.compact}
                          testID={testID}
                        >
                          {pageConfig.content}
                        </PageScroller>
                      </View>
                    ) : (
                      <View style={styles.content}>
                        <SettingsHeader
                          title={labels?.dialog ?? 'Settings'}
                          closeLabel={closeLabel}
                          onClose={requestClose}
                          palette={palette}
                          testID={testID}
                        />
                        <SettingsRail
                          groups={groups}
                          page={currentPage}
                          onSelect={selectPage}
                          palette={palette}
                          label={labels?.nav ?? 'Settings sections'}
                          layout="compact"
                          testID={testID}
                        />
                      </View>
                    )
                  ) : (
                    <>
                      <SettingsRail
                        groups={groups}
                        page={currentPage}
                        onSelect={selectPage}
                        palette={palette}
                        label={labels?.nav ?? 'Settings sections'}
                        layout={layout}
                        testID={testID}
                      />
                      <View style={styles.content}>
                        <SettingsHeader
                          title={pageConfig?.title ?? ''}
                          closeLabel={closeLabel}
                          onClose={requestClose}
                          palette={palette}
                          testID={testID}
                        />
                        <PageScroller
                          key={currentPage}
                          palette={palette}
                          inset={CONTENT_INSET[layout]}
                          insetTop={pageConfig?.compactTitle ? 6 : 12}
                          testID={testID}
                        >
                          {pageConfig?.content}
                        </PageScroller>
                      </View>
                    </>
                  )}
                </View>
                <SavedToast
                  phase={savedPhase}
                  label={labels?.saved ?? 'Saved'}
                  palette={palette}
                  reducedMotion={reducedMotion}
                  testID={testID ? `${testID}-saved` : undefined}
                />
              </Animated.View>
            </View>
          </Backdrop>
        </OverlayRoot>
      </SettingsModalContext.Provider>
    </ModalPortal>
  );
}

function ringVars(palette: SettingsPalette): WebCssStyle | null {
  return IS_WEB
    ? { '--bloom-settings-ring': palette.ring, '--bloom-settings-ring-offset': palette.full }
    : null;
}

// ---------------------------------------------------------------------------
//  Rail
// ---------------------------------------------------------------------------

function SettingsRail({
  groups,
  page,
  onSelect,
  palette,
  label,
  layout,
  testID,
}: {
  groups: SettingsNavGroup[];
  page: string | undefined;
  onSelect: (page: string) => void;
  palette: SettingsPalette;
  label: string;
  layout: SettingsModalLayout;
  testID?: string;
}) {
  const compact = layout === 'compact';
  return (
    <ScrollView
      role="navigation"
      aria-label={label}
      style={[
        compact
          ? styles.railCompact
          : [styles.rail, { width: layout === 'medium' ? RAIL_WIDTH_MEDIUM : RAIL_WIDTH }],
        { backgroundColor: palette.secondary, borderRightColor: palette.separator },
      ]}
      contentContainerStyle={[styles.railContent, compact ? styles.railContentCompact : null]}
      showsVerticalScrollIndicator={false}
      testID={testID ? `${testID}-rail` : undefined}
    >
      {groups.map((group) => (
        <View key={group.key ?? group.label} style={styles.group}>
          <Text variant="body-medium" style={[styles.groupLabel, { color: palette.textSecondary }]}>
            {group.label}
          </Text>
          <View style={styles.groupRows}>
            {group.items.map((item) => (
              <RailRow
                key={item.key}
                item={item}
                // A list, not a selection, when the rows ARE the navigation.
                selected={!compact && item.page !== undefined && item.page === page}
                showChevron={compact && item.page !== undefined}
                onSelect={onSelect}
                palette={palette}
                testID={testID ? `${testID}-nav-${item.key}` : undefined}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function RailRow({
  item,
  selected,
  showChevron = false,
  onSelect,
  palette,
  testID,
}: {
  item: SettingsNavItem;
  selected: boolean;
  showChevron?: boolean;
  onSelect: (page: string) => void;
  palette: SettingsPalette;
  testID?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;
  const onPress = item.page
    ? () => onSelect(item.page as string)
    : item.onPress;
  return (
    <Pressable
      role="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected, disabled: item.disabled }}
      aria-disabled={item.disabled}
      {...(IS_WEB ? { 'aria-current': selected ? 'page' : undefined } : null)}
      {...webDataSet({ bloomSettingsPress: '' })}
      disabled={item.disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      testID={testID}
      style={[
        styles.railRow,
        {
          backgroundColor: selected
            ? palette.secondaryHover
            : hovered
              ? palette.secondaryHoverSoft
              : 'transparent',
        },
      ]}
    >
      <Icon width={20} height={20} fill={palette.iconSecondary} />
      <Text
        variant="body-medium"
        numberOfLines={1}
        style={[
          styles.railLabel,
          { color: selected || showChevron ? palette.text : palette.textSecondary },
        ]}
      >
        {item.label}
      </Text>
      {showChevron ? (
        <View style={styles.railChevron}>
          <RiArrowRightSLine width={20} height={20} fill={palette.iconSecondary} />
        </View>
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Close button, scroller, toast
// ---------------------------------------------------------------------------

/** Shared header on every layout; the modal already owns safe-area insets. */
function SettingsHeader({
  title,
  onBack,
  backLabel,
  closeLabel,
  onClose,
  palette,
  testID,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  closeLabel: string;
  onClose: () => void;
  palette: SettingsPalette;
  testID?: string;
}) {
  // Inline chrome does not reveal with scroll. An explicit local offset keeps
  // the page behind the modal from influencing this header's paint or title.
  const scrollY = useSharedValue(0);
  return (
    <PageHeader
      title={title}
      headingLevel={2}
      onBack={onBack}
      backLabel={backLabel}
      safeArea={false}
      sticky={false}
      placement="inline"
      scrim="none"
      scrimColor={palette.full}
      scrollY={scrollY}
      actions={
        <ButtonGroup accessibilityLabel={closeLabel}>
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiCloseLine}
            accessibilityLabel={closeLabel}
            onPress={onClose}
            testID={testID ? `${testID}-close` : undefined}
          />
        </ButtonGroup>
      }
      testID={testID ? `${testID}-header` : undefined}
    />
  );
}

function PageScroller({
  children,
  palette,
  inset,
  insetTop = 0,
  testID,
}: {
  children: React.ReactNode;
  palette: SettingsPalette;
  inset: number;
  /** Content gap below PageHeader; desktop Storage uses the compact 6px gap. */
  insetTop?: number;
  testID?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > 0;
    setScrolled((prev) => (prev === next ? prev : next));
  }, []);
  const fade: WebCssStyle = {
    opacity: scrolled ? 1 : 0,
    ...(IS_WEB
      ? { transitionProperty: 'opacity', transitionDuration: '200ms', transitionTimingFunction: 'ease-out' }
      : null),
  };
  return (
    <View style={styles.scrollHost}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingLeft: inset, paddingRight: inset, paddingBottom: inset, paddingTop: insetTop },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        testID={testID ? `${testID}-page` : undefined}
      >
        {children}
      </ScrollView>
      {/* Progressive top fade — `from-background-primary-default`. */}
      <View
        pointerEvents="none"
        style={[styles.fade, fade]}
        testID={testID ? `${testID}-fade` : undefined}
      >
        <VerticalFade color={palette.primary} />
      </View>
    </View>
  );
}

function SavedToast({
  phase,
  label,
  palette,
  reducedMotion,
  testID,
}: {
  phase: SavedPhase;
  label: string;
  palette: SettingsPalette;
  reducedMotion: boolean;
  testID?: string;
}) {
  const shown = phase === 'shown';
  const [box, setBox] = useState({ width: 0, height: 26 });
  // `translate-y-1/2`, `calc(50% + 12px)` (rising in) and `calc(50% - 10px)` (drifting out).
  const half = box.height / 2;
  const translateY = phase === 'shown' ? half : phase === 'hidden' ? half + 12 : half - 10;
  const motion: WebCssStyle = {
    opacity: shown ? 1 : 0,
    marginLeft: -box.width / 2,
    transform: [{ translateY }, { scale: shown ? 1 : 0.9 }],
    ...(IS_WEB
      ? {
          filter: shown ? 'blur(0px)' : 'blur(2px)',
          transitionProperty: 'opacity, transform, filter',
          transitionDuration: reducedMotion || phase === 'hidden' ? '0ms' : '200ms',
          transitionTimingFunction: 'ease-out',
        }
      : null),
  };
  return (
    <View
      pointerEvents="none"
      aria-live="polite"
      accessibilityLiveRegion="polite"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setBox({ width, height });
      }}
      testID={testID}
      style={[
        styles.toast,
        {
          borderColor: palette.borderButton,
          backgroundColor: palette.primary,
          boxShadow: palette.shadowDropdown,
        },
        motion,
      ]}
    >
      <RiCheckboxCircleFill width={16} height={16} fill={palette.success[600]} />
      <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: VIEWPORT_GUTTER,
  },
  centerCompact: {
    padding: 0,
  },
  motion: {
    position: 'relative',
  },
  motionCompact: {
    flex: 1,
    alignSelf: 'stretch',
  },
  railCompact: {
    flex: 1,
  },
  railContentCompact: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  railChevron: {
    marginLeft: 'auto',
  },
  panel: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
  },
  rail: {
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
  },
  railContent: {
    padding: 10,
    gap: 20,
  },
  group: {
    paddingTop: 4,
    gap: 6,
  },
  groupLabel: {
    paddingLeft: 8,
  },
  groupRows: {
    gap: 4,
  },
  railRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
  },
  railLabel: {
    flexShrink: 1,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  scrollHost: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 40,
  },
  toast: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 9999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 10,
    paddingLeft: 6,
  },
});
