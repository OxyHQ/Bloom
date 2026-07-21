import React, {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  Pressable,
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

import { getSvgModule } from '../avatar/svg-module';
import {
  ChevronLeft_Stroke2_Corner0_Rounded,
  TimesLarge_Stroke2_Corner0_Rounded,
} from '../icons';
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
    a.subtitle === b.subtitle &&
    a.largeTitle === b.largeTitle &&
    a.left === b.left &&
    a.right === b.right &&
    a.onBack === b.onBack &&
    a.showClose === b.showClose
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
    config?.subtitle,
    config?.largeTitle,
    config?.left,
    config?.right,
    config?.onBack,
    config?.showClose,
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

// --- Gradient ---------------------------------------------------------------

/**
 * Vertical gradient behind the nav bar: opaque `color` at the top → transparent
 * at the bottom, so scrolled content fades out under the bar. Rendered with
 * `react-native-svg` (the same cross-platform gradient primitive the avatar ring
 * uses); when svg is unavailable it degrades to a solid opaque bar (no fade).
 */
const HeaderGradient = memo(function HeaderGradient({
  color,
  height,
}: {
  color: string;
  height: number;
}) {
  const id = useMemo(() => `bloom-dialog-header-grad-${headerGradientId++}`, []);
  const svg = getSvgModule();

  if (!svg) {
    // No svg: cover only the interactive bar with a solid fill so content below
    // still shows (a full-height opaque fallback would hide the fade region).
    return (
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { height: DIALOG_NAV_BAR_HEIGHT, backgroundColor: color }]}
      />
    );
  }

  const { default: Svg, Defs, LinearGradient, Stop, Rect } = svg;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset={String(DIALOG_NAV_BAR_HEIGHT / height)} stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
});

let headerGradientId = 0;

// --- Default affordances ----------------------------------------------------

function NavIconButton({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.navButton,
        { backgroundColor: theme.colors.card, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
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

  const hasLargeTitle = collapse && (config.largeTitle ?? true) && !!config.title;

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

  const left =
    config.left ??
    (config.onBack ? (
      <NavIconButton onPress={config.onBack} accessibilityLabel="Go back">
        <ChevronLeft_Stroke2_Corner0_Rounded size="md" fill={theme.colors.text} />
      </NavIconButton>
    ) : null);

  const right =
    config.right ??
    (config.showClose !== false ? (
      <NavIconButton onPress={onDismiss} accessibilityLabel="Close">
        <TimesLarge_Stroke2_Corner0_Rounded size="md" fill={theme.colors.text} />
      </NavIconButton>
    ) : null);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, style]}
    >
      <HeaderGradient color={theme.colors.background} height={DIALOG_HEADER_OVERLAY_HEIGHT} />
      <View pointerEvents="box-none" style={styles.navRow}>
        <View style={styles.side}>{left}</View>
        <Animated.View
          pointerEvents="none"
          testID="dialog-nav-title"
          style={[styles.centerTitle, titleStyle]}
        >
          {config.title ? (
            <Text numberOfLines={1} style={[styles.smallTitle, { color: theme.colors.text }]}>
              {config.title}
            </Text>
          ) : null}
          {/* The subtitle rides along ONLY in the static (non-collapsing) bar —
              own-scroller screens whose subtitle is a short count. A large-title
              screen keeps a clean single-line collapsed title. */}
          {!hasLargeTitle && config.subtitle ? (
            <Text
              numberOfLines={1}
              style={[styles.smallSubtitle, { color: theme.colors.textSecondary }]}
            >
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

  const hasLargeTitle = (config.largeTitle ?? true) && !!config.title;

  const onLayout = (e: LayoutChangeEvent) => {
    largeTitleHeight.value = e.nativeEvent.layout.height;
  };

  if (!hasLargeTitle) {
    // No large title: just inset the content below the nav bar.
    return <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />;
  }

  return (
    <>
      <View style={{ height: DIALOG_HEADER_CONTENT_TOP }} />
      <View onLayout={onLayout} testID="dialog-large-title" style={styles.largeTitleBlock}>
        <H1 style={[styles.largeTitle, { color: theme.colors.text }]}>{config.title}</H1>
        {config.subtitle ? (
          <Text style={[styles.largeSubtitle, { color: theme.colors.textSecondary }]}>
            {config.subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );
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
  navButton: {
    width: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
    borderRadius: NAV_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
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
});
