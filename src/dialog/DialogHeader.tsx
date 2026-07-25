import React, {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import {
  ChevronLeft_Stroke2_Corner0_Rounded,
  DotGrid3x1_Stroke2_Corner0_Rounded,
  TimesLarge_Stroke2_Corner0_Rounded,
} from '../icons';
import { FrostedIconButton } from '../frosted-icon-button';
import { Button } from '../button';
import { Search } from '../search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Item } from '../item';
import { useDialogControl } from './context';
import { useTheme } from '../theme/use-theme';
import { H1, Text } from '../typography';
import type { DialogHeaderConfig } from './types';

export type { DialogHeaderConfig } from './types';

// ---------------------------------------------------------------------------
//  Dialog-owned navigation header (iOS large-title collapse).
//
//  This is a DISTINCT surface mode from the declarative
//  `title`/`description`/`actions` centered-heading path: it turns the Dialog
//  into a scrolling page with a sticky, gradient top bar (left + right slots)
//  and a large collapsing title that lives in the Dialog's OWN scroll content.
//  As the large title scrolls under the bar, a small title cross-fades into the
//  bar center.
//
//  Screens render NO header of their own — they declare their title/subtitle
//  (via the surface registry) or contribute runtime slots (a Save action, a
//  dynamic title) through {@link useDialogHeader}.
// ---------------------------------------------------------------------------

/** Interactive nav-bar row height (px). Buttons + collapsed title live here. */
export const DIALOG_NAV_BAR_HEIGHT = 52;

/** Extra gradient tail (px) below the bar, over which scrolled content fades. */
const GRADIENT_FADE = 20;

/** Total gradient overlay height (bar + fade tail). */
export const DIALOG_HEADER_OVERLAY_HEIGHT = DIALOG_NAV_BAR_HEIGHT + GRADIENT_FADE;

/**
 * Top inset applied to the Dialog's scroll content so the large title starts
 * BELOW the whole gradient overlay (fully clear at rest, then scrolls under it).
 */
export const DIALOG_HEADER_CONTENT_TOP = DIALOG_HEADER_OVERLAY_HEIGHT;

/** Horizontal gutter — matches the `screen-margin` (20px) SDK screens use. */
const HEADER_H_PADDING = 20;

/** Circular icon-button diameter for the default back / close affordances. */
const NAV_BUTTON_SIZE = 36;

/**
 * Trailing icon `actions` shown inline before they collapse into a "more"
 * overflow menu (Material overflow pattern). Kept small so the nav row never
 * crowds the title.
 */
export const DIALOG_HEADER_MAX_INLINE_ACTIONS = 3;

/** Light content color for `tone: 'onImage'` (legible over any media). */
const ON_IMAGE_TEXT = '#FFFFFF';
const ON_IMAGE_SUBTEXT = 'rgba(255,255,255,0.82)';

// --- Runtime override store (child screen → nav bar / large title) ----------
//
// The nav bar overlay and the in-content large title live in DIFFERENT subtrees
// (the bar is a sibling ABOVE the scroller; the large title + the screen are
// inside it), so a plain React ancestor context cannot bridge a screen's runtime
// contribution up to the bar. We use a tiny external store instead: the screen
// writes its override through {@link useDialogHeader}; the bar and large title
// read it via `useSyncExternalStore`. Only those two re-render — never the
// screen subtree — and there is no shared-ancestor constraint.

interface HeaderStore {
  getSnapshot: () => DialogHeaderConfig | null;
  setOverride: (next: DialogHeaderConfig | null) => void;
  subscribe: (listener: () => void) => () => void;
}

function configsEqual(a: DialogHeaderConfig | null, b: DialogHeaderConfig | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.title === b.title &&
    a.titleContent === b.titleContent &&
    a.subtitle === b.subtitle &&
    a.largeTitle === b.largeTitle &&
    a.left === b.left &&
    a.right === b.right &&
    a.onBack === b.onBack &&
    a.showClose === b.showClose &&
    // Rich fields — object fields compared by identity (callers memoize them);
    // `tone` is a plain value.
    a.primaryAction === b.primaryAction &&
    a.actions === b.actions &&
    a.search === b.search &&
    a.segments === b.segments &&
    a.tone === b.tone &&
    a.progress === b.progress
  );
}

function createHeaderStore(): HeaderStore {
  let override: DialogHeaderConfig | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => override,
    setOverride: (next) => {
      if (configsEqual(override, next)) return;
      override = next;
      for (const l of listeners) l();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * The per-surface header controller — the scroll offset + measured large-title
 * height shared values plus the runtime-override store. Created once per Dialog
 * (via {@link useDialogHeaderController}) and threaded into the scroller (writes
 * `scrollY`), the nav bar, the large title, and the child provider.
 */
export interface DialogHeaderController {
  scrollY: SharedValue<number>;
  largeTitleHeight: SharedValue<number>;
  store: HeaderStore;
}

/** Create the header controller for one Dialog. Stable for the Dialog's life. */
export function useDialogHeaderController(): DialogHeaderController {
  const scrollY = useSharedValue(0);
  const largeTitleHeight = useSharedValue(0);
  const store = useMemo(() => createHeaderStore(), []);
  return useMemo(
    () => ({ scrollY, largeTitleHeight, store }),
    [scrollY, largeTitleHeight, store],
  );
}

const DialogHeaderContext = createContext<DialogHeaderController | null>(null);

/**
 * Wraps the Dialog's scroll content so a mounted screen can contribute header
 * slots via {@link useDialogHeader}. Only the child subtree needs this — the nav
 * bar and large title read the same controller directly.
 */
export function DialogHeaderProvider({
  controller,
  children,
}: {
  controller: DialogHeaderController;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DialogHeaderContext.Provider value={controller}>
      {children}
    </DialogHeaderContext.Provider>
  );
}

/**
 * Contribute header content from within a Dialog surface — a dynamic title, a
 * Save action, custom slots. Merges over the surface's static (registry) header
 * config; unmounting clears the contribution. Slot nodes (`left`/`right`) MUST
 * be referentially stable (memoize them) so the effect does not thrash.
 *
 * No-op outside a header-mode Dialog (e.g. a confirm dialog), so a screen can
 * call it unconditionally.
 */
export function useDialogHeader(config: DialogHeaderConfig | null | undefined): void {
  const controller = useContext(DialogHeaderContext);
  const store = controller?.store;
  // Set synchronously in the commit's layout phase so the bar/title fill in
  // BEFORE the browser paints — no first-frame flash of an empty bar.
  useLayoutEffect(() => {
    if (!store) return;
    store.setOverride(config ?? null);
    return () => store.setOverride(null);
    // Slot nodes are compared by identity; callers memoize them.
  }, [
    store,
    config?.title,
    config?.titleContent,
    config?.subtitle,
    config?.largeTitle,
    config?.left,
    config?.right,
    config?.onBack,
    config?.showClose,
    config?.primaryAction,
    config?.actions,
    config?.search,
    config?.segments,
    config?.tone,
    config?.progress,
  ]);
}

/** Read the merged (base + runtime-override) header config, reactively. */
function useMergedHeaderConfig(
  base: DialogHeaderConfig,
  store: HeaderStore,
): DialogHeaderConfig {
  const override = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return useMemo(() => (override ? { ...base, ...override } : base), [base, override]);
}

// --- Rich header sub-parts --------------------------------------------------

/**
 * The "more" overflow: a Bloom `Popover` that DROPS from the ⋯ trigger — anchored
 * under the button on web (measured trigger + `bottom-end` placement) and a bottom
 * sheet on native, matching how top libraries present a toolbar overflow (Radix
 * DropdownMenu / Material Menu on desktop, an action sheet on mobile). Items are
 * Bloom `Item` rows; pressing one closes the popover before firing.
 */
function HeaderOverflowMenu({
  items,
  onImage,
}: {
  items: NonNullable<DialogHeaderConfig['actions']>;
  onImage: boolean;
}): React.ReactElement {
  // Own the control so an item press can close the popover before acting.
  const control = useDialogControl();
  return (
    <Popover control={control}>
      <PopoverTrigger label="More">
        {({ props }) => (
          <FrostedIconButton
            size="sm"
            onPress={props.onPress}
            accessibilityLabel={props.accessibilityLabel}
            icon={
              <DotGrid3x1_Stroke2_Corner0_Rounded
                size="md"
                fill={onImage ? ON_IMAGE_TEXT : undefined}
              />
            }
          />
        )}
      </PopoverTrigger>
      <PopoverContent label="More actions" placement="bottom-end">
        {items.map((action) => (
          <Item
            key={action.accessibilityLabel}
            title={action.accessibilityLabel}
            leading={action.icon}
            density="compact"
            disabled={action.disabled}
            onPress={() => control.close(() => action.onPress())}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Trailing icon `actions`: the first {@link DIALOG_HEADER_MAX_INLINE_ACTIONS}
 * render inline as frosted circles; any surplus collapses into a "more" overflow
 * that drops from the ⋯ ({@link HeaderOverflowMenu}) — never hand-rolled.
 */
function HeaderTrailingActions({
  actions,
  onImage,
}: {
  actions: NonNullable<DialogHeaderConfig['actions']>;
  onImage: boolean;
}): React.ReactElement | null {
  if (actions.length === 0) return null;
  const overflows = actions.length > DIALOG_HEADER_MAX_INLINE_ACTIONS;
  // Keep room for the "more" trigger when collapsing.
  const inline = overflows ? actions.slice(0, DIALOG_HEADER_MAX_INLINE_ACTIONS - 1) : actions;
  const overflow = overflows ? actions.slice(DIALOG_HEADER_MAX_INLINE_ACTIONS - 1) : [];
  return (
    <>
      {inline.map((action) => (
        <FrostedIconButton
          key={action.accessibilityLabel}
          size="sm"
          icon={action.icon}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={action.accessibilityLabel}
        />
      ))}
      {overflow.length > 0 ? <HeaderOverflowMenu items={overflow} onImage={onImage} /> : null}
    </>
  );
}

/**
 * A thin wizard step/progress indicator for the large-title zone. `step` is
 * 1-based; the bar fills `step / total`, clamped to [0, 1].
 */
function HeaderProgressBar({
  step,
  total,
  onImage,
}: {
  step: number;
  total: number;
  onImage: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const fraction = total > 0 ? Math.min(1, Math.max(0, step / total)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
      style={[
        styles.progressTrack,
        { backgroundColor: onImage ? 'rgba(255,255,255,0.25)' : theme.colors.border },
      ]}
    >
      <View
        style={[
          styles.progressFill,
          { width: `${Math.round(fraction * 100)}%`, backgroundColor: theme.colors.primary },
        ]}
      />
    </View>
  );
}

// --- Nav bar overlay --------------------------------------------------------

/**
 * The sticky nav bar: gradient background + left / center (collapsing title) /
 * right slots. Absolutely positioned at the top of the Dialog surface, painted
 * ABOVE the scroll content. Reads the scroll offset to cross-fade the small
 * title in as the large title scrolls under it.
 *
 * `onDismiss` is the Dialog's own close (the default right-slot close button
 * calls it) — passed explicitly rather than read from the dialog context because
 * the bar is rendered as a sibling of the scroller, outside that context on the
 * bottom-sheet path.
 */
export const DialogNavHeader = memo(function DialogNavHeader({
  controller,
  header,
  onDismiss,
  collapse = true,
  style,
}: {
  controller: DialogHeaderController;
  header: DialogHeaderConfig;
  onDismiss: () => void;
  /**
   * Whether the small title cross-fades in on scroll (paired with an in-content
   * {@link DialogLargeTitle}). Defaults to `true`. Set `false` for a surface
   * whose content owns its own scroller (no Dialog scroll offset to drive the
   * collapse): the small title is then always visible — a plain titled nav bar.
   */
  collapse?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const config = useMergedHeaderConfig(header, controller.store);
  const { scrollY, largeTitleHeight } = controller;

  // A branded `titleContent` owns the bar centre outright: it is always visible,
  // so there is nothing to collapse and no large in-content title to collapse under.
  const hasLargeTitle =
    collapse && !config.titleContent && (config.largeTitle ?? true) && !!config.title;

  const titleStyle = useAnimatedStyle(() => {
    // When there is no large title to collapse under, the bar title is always
    // shown (a plain, non-collapsing nav bar). Otherwise it cross-fades in as the
    // large title scrolls up under the bar.
    if (!hasLargeTitle) return { opacity: 1, transform: [{ translateY: 0 }] };
    const threshold = largeTitleHeight.value > 0 ? largeTitleHeight.value : 44;
    const start = threshold * 0.35;
    const end = threshold * 0.9;
    return {
      opacity: interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, [start, end], [10, 0], Extrapolation.CLAMP) },
      ],
    };
    // Reanimated on RN-Web has no worklets plugin: every shared value the mapper
    // reads MUST be in the deps array or it freezes on the first frame.
  }, [scrollY, largeTitleHeight, hasLargeTitle]);

  // Over media (`tone: 'onImage'`) the scrim strengthens and the default title +
  // icon buttons flip to light content so they stay legible.
  const onImage = config.tone === 'onImage';
  const iconFill = onImage ? ON_IMAGE_TEXT : undefined;
  const titleColor = onImage ? ON_IMAGE_TEXT : theme.colors.text;
  const subtitleColor = onImage ? ON_IMAGE_SUBTEXT : theme.colors.textSecondary;

  const closeButton = (
    <FrostedIconButton
      onPress={onDismiss}
      accessibilityLabel="Close"
      icon={<TimesLarge_Stroke2_Corner0_Rounded size="md" fill={iconFill} />}
    />
  );

  // Trailing edge: a custom `right` wins; else the rich trailing (icon actions +
  // the single primary CTA); else the default close affordance.
  const hasRichTrailing = !config.right && !!(config.actions?.length || config.primaryAction);

  const right = config.right ?? (
    hasRichTrailing ? (
      <View style={styles.trailing}>
        {config.actions?.length ? (
          <HeaderTrailingActions actions={config.actions} onImage={onImage} />
        ) : null}
        {config.primaryAction ? (
          <Button
            variant="primary"
            size="small"
            onPress={config.primaryAction.onPress}
            disabled={config.primaryAction.disabled || config.primaryAction.loading}
            loading={config.primaryAction.loading}
            accessibilityLabel={config.primaryAction.label}
          >
            {config.primaryAction.label}
          </Button>
        ) : null}
      </View>
    ) : config.showClose !== false ? (
      closeButton
    ) : null
  );

  // Leading edge: a custom `left` wins; else the back button; else — when the
  // trailing edge is taken by the rich CTA and there is no back — the close
  // affordance moves here so there is always exactly one dismiss control.
  const left =
    config.left ??
    (config.onBack ? (
      <FrostedIconButton
        onPress={config.onBack}
        accessibilityLabel="Go back"
        icon={<ChevronLeft_Stroke2_Corner0_Rounded size="md" fill={iconFill} />}
      />
    ) : hasRichTrailing && config.showClose !== false ? (
      closeButton
    ) : null);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, style]}
    >
      {/* Opaque (surface bg) at the top → transparent at the bottom, so scrolled
          content fades out under the bar. `onImage` swaps to a dark scrim so the
          chrome reads over media. Pure NativeWind — no SVG dependency. */}
      <View
        pointerEvents="none"
        className={
          onImage
            ? 'bg-gradient-to-b from-black/60 to-transparent'
            : 'bg-gradient-to-b from-bg to-transparent'
        }
        style={[StyleSheet.absoluteFill, { height: DIALOG_HEADER_OVERLAY_HEIGHT }]}
      />
      <View pointerEvents="box-none" style={styles.navRow}>
        <View style={styles.side}>{left}</View>
        <Animated.View
          pointerEvents="none"
          testID="dialog-nav-title"
          style={[styles.centerTitle, titleStyle]}
        >
          {config.titleContent ?? null}
          {!config.titleContent && config.title ? (
            <Text numberOfLines={1} style={[styles.smallTitle, { color: titleColor }]}>
              {config.title}
            </Text>
          ) : null}
          {/* The subtitle rides along ONLY in the static (non-collapsing) bar —
              own-scroller screens whose subtitle is a short count. A large-title
              screen keeps a clean single-line collapsed title, and a branded
              `titleContent` bar carries no supporting copy at all. */}
          {!hasLargeTitle && !config.titleContent && config.subtitle ? (
            <Text numberOfLines={1} style={[styles.smallSubtitle, { color: subtitleColor }]}>
              {config.subtitle}
            </Text>
          ) : null}
        </Animated.View>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
});

// --- In-content large title -------------------------------------------------

/**
 * The large collapsing title, rendered at the TOP of the Dialog's scroll content
 * (before the screen body). Owns the content top inset (so the title starts
 * below the gradient overlay) and measures its own text height into the
 * controller so the nav bar knows when to cross-fade the small title in.
 */
export const DialogLargeTitle = memo(function DialogLargeTitle({
  controller,
  header,
}: {
  controller: DialogHeaderController;
  header: DialogHeaderConfig;
}) {
  const theme = useTheme();
  const config = useMergedHeaderConfig(header, controller.store);
  const { largeTitleHeight } = controller;

  // A branded `titleContent` lives in the bar and never collapses, so the
  // surface starts flush under the bar with no large title above it.
  const hasLargeTitle = !config.titleContent && (config.largeTitle ?? true) && !!config.title;
  // The large-title zone also hosts search / segments / progress. These require a
  // scrolling surface (they live here, not in the fixed bar) and collapse with the
  // title on scroll (iOS `.searchable` style).
  const hasExtras = !!(config.search || config.segments || config.progress);
  const onImage = config.tone === 'onImage';

  const onLayout = (e: LayoutChangeEvent) => {
    largeTitleHeight.value = e.nativeEvent.layout.height;
  };

  if (!hasLargeTitle && !hasExtras) {
    // Pure content (no header chrome to render in-flow). Under `tone: 'onImage'`
    // the content is media (a banner / photo canvas), so it slides UP under the
    // translucent nav bar — the bar FLOATS over the media, immersive at rest (the
    // standard iOS large-title-over-photo / Material collapsing-toolbar pattern).
    // Default tone keeps the nav-bar-height inset so content clears the bar.
    return onImage ? null : <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />;
  }

  return (
    <>
      {/* Clear the whole gradient overlay so the block starts below the bar. */}
      <View style={{ height: DIALOG_HEADER_CONTENT_TOP }} />
      <View onLayout={onLayout} testID="dialog-large-title" style={styles.largeTitleBlock}>
        {hasLargeTitle ? (
          <>
            <H1 style={[styles.largeTitle, { color: onImage ? ON_IMAGE_TEXT : theme.colors.text }]}>
              {config.title}
            </H1>
            {config.subtitle ? (
              <Text
                style={[
                  styles.largeSubtitle,
                  { color: onImage ? ON_IMAGE_SUBTEXT : theme.colors.textSecondary },
                ]}
              >
                {config.subtitle}
              </Text>
            ) : null}
          </>
        ) : null}
        {config.search ? (
          <View style={hasLargeTitle ? styles.extraRow : undefined}>
            <Search
              value={config.search.value}
              onChangeText={config.search.onChangeText}
              label={config.search.placeholder ?? 'Search'}
              onSubmitEditing={config.search.onSubmit}
              onClearText={() => config.search?.onChangeText('')}
            />
          </View>
        ) : null}
        {config.segments ? (
          <View style={hasLargeTitle || config.search ? styles.extraRow : undefined}>
            <SegmentedControl
              label={config.title ?? 'View'}
              type="tabs"
              size="small"
              value={config.segments.value}
              onChange={config.segments.onChange}
            >
              {config.segments.items.map((item) => (
                <SegmentedControlItem key={item.key} value={item.key}>
                  <SegmentedControlItemText>{item.label}</SegmentedControlItemText>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </View>
        ) : null}
        {config.progress ? (
          <View style={hasLargeTitle || config.search || config.segments ? styles.extraRow : undefined}>
            <HeaderProgressBar
              step={config.progress.step}
              total={config.progress.total}
              onImage={onImage}
            />
          </View>
        ) : null}
      </View>
    </>
  );
});

/**
 * The nav-bar-height content inset for a header-mode surface whose content owns
 * its own scroll (`scrollable: false`) — the account dialog or an own-scroller
 * like the media picker. Under `tone: 'onImage'` it COLLAPSES to nothing so the
 * media (photo grid / banner) slides UP under the floating translucent nav bar,
 * edge-to-edge (Apple/Material immersive photo grid); otherwise it insets the
 * content below the bar. Reads the merged (base + runtime-override) tone, since
 * `tone` is contributed by the mounted screen through the override store.
 */
export const DialogNavBarSpacer = memo(function DialogNavBarSpacer({
  controller,
  header,
}: {
  controller: DialogHeaderController;
  header: DialogHeaderConfig;
}) {
  const config = useMergedHeaderConfig(header, controller.store);
  if (config.tone === 'onImage') return null;
  return <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />;
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: DIALOG_HEADER_OVERLAY_HEIGHT,
    zIndex: 10,
  },
  navRow: {
    height: DIALOG_NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HEADER_H_PADDING - 4,
  },
  side: {
    minWidth: NAV_BUTTON_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  /** Trailing row: icon actions + the primary CTA, right-aligned. */
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  smallSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
  },
  largeTitleBlock: {
    paddingHorizontal: HEADER_H_PADDING,
    paddingBottom: 4,
  },
  largeTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  largeSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  /** Spacing between the large title and each large-title-zone extra. */
  extraRow: {
    marginTop: 12,
  },
  /** Thin wizard progress bar in the large-title zone. */
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
