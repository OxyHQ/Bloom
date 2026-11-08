import type React from 'react';
import {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';

// Per glyph, not through `../icons`. The barrel is a flat re-export of every
// Remix module, and Metro does not tree-shake — so importing three names through
// it put all 461 glyphs into every app that renders a Dialog, which is the cost
// `./icons/Ri*` was added to remove. An app cannot opt out of what Bloom's own
// components import, so the barrel has no place inside a shipped one.

import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { PageHeader } from '../page-header/PageHeader';
import { HeaderDockProvider } from '../layout/header-dock';
import { Button } from '../button';
import { Search } from '../search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { H1, Subtitle, TYPE_SCALE } from '../typography';
import type { DialogHeaderConfig } from './types';
import type { HeaderAction, HeaderActionsProps } from '../page-header/types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { DIALOG_MESSAGES } from './messages';
import { Meter } from '../stat-bar';

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
export const DIALOG_NAV_BAR_HEIGHT = 56;

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

type PrimaryAction = NonNullable<DialogHeaderConfig['primaryAction']>;
type DialogAction = NonNullable<DialogHeaderConfig['actions']>[number];
type HeaderSearch = NonNullable<DialogHeaderConfig['search']>;
type HeaderSegments = NonNullable<DialogHeaderConfig['segments']>;
type HeaderProgress = NonNullable<DialogHeaderConfig['progress']>;

function primaryActionEqual(a: PrimaryAction | undefined, b: PrimaryAction | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  // `onPress` is a fresh closure each render — its identity never changes what the
  // button renders, so compare only the render-affecting scalars.
  return a.label === b.label && !!a.disabled === !!b.disabled && !!a.loading === !!b.loading;
}

function actionsEqual(a: DialogAction[] | undefined, b: DialogAction[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) return false;
    // `icon` is a memoized node (compared by identity); `onPress` is ignored.
    if (
      ('label' in x ? x.label : x.accessibilityLabel) !==
        ('label' in y ? y.label : y.accessibilityLabel) ||
      x.id !== y.id ||
      x.busy !== y.busy ||
      x.selected !== y.selected ||
      x.priority !== y.priority ||
      x.essential !== y.essential ||
      x.overflow !== y.overflow ||
      x.visible !== y.visible ||
      x.group !== y.group ||
      x.labelVisibility !== y.labelVisibility ||
      !!x.disabled !== !!y.disabled ||
      x.icon !== y.icon
    ) {
      return false;
    }
  }
  return true;
}

function searchEqual(a: HeaderSearch | undefined, b: HeaderSearch | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.value === b.value && a.placeholder === b.placeholder;
}

function segmentsEqual(a: HeaderSegments | undefined, b: HeaderSegments | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.value !== b.value || a.items.length !== b.items.length) return false;
  for (let i = 0; i < a.items.length; i += 1) {
    const ai = a.items[i];
    const bi = b.items[i];
    if (!ai || !bi || ai.key !== bi.key || ai.label !== bi.label) return false;
  }
  return true;
}

function progressEqual(a: HeaderProgress | undefined, b: HeaderProgress | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.step === b.step && a.total === b.total;
}

function configsEqual(a: DialogHeaderConfig | null, b: DialogHeaderConfig | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.title === b.title &&
    a.titleContent === b.titleContent &&
    a.subtitle === b.subtitle &&
    a.largeTitle === b.largeTitle &&
    a.largeTitleAlign === b.largeTitleAlign &&
    a.largeTitleVariant === b.largeTitleVariant &&
    a.titleLayout === b.titleLayout &&
    a.titleReveal === b.titleReveal &&
    a.left === b.left &&
    a.right === b.right &&
    // `onBack` legitimately gets a fresh closure each render; its identity never
    // changes what the header renders, so compare by PRESENCE, never identity —
    // treating a new ref as "changed" is exactly what drives the update loop.
    !!a.onBack === !!b.onBack &&
    a.showClose === b.showClose &&
    // Rich fields — compared by VALUE (render-affecting scalars only). A caller
    // passing an inline `primaryAction`/`actions`/… object (a fresh reference
    // every render) must NOT force a store update: that is React error #185.
    a.tone === b.tone &&
    primaryActionEqual(a.primaryAction, b.primaryAction) &&
    actionsEqual(a.actions, b.actions) &&
    searchEqual(a.search, b.search) &&
    segmentsEqual(a.segments, b.segments) &&
    progressEqual(a.progress, b.progress)
  );
}

function createHeaderStore(): HeaderStore {
  let override: DialogHeaderConfig | null = null;
  let latest: DialogHeaderConfig | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => override,
    setOverride: (next) => {
      latest = next;
      if (configsEqual(override, next)) return;
      // Keep handlers current without publishing a new render snapshot for an
      // inline closure. Stable IDs also preserve dispatch across action reorder.
      override = next
        ? {
            ...next,
            onBack: next.onBack ? () => latest?.onBack?.() : undefined,
            primaryAction: next.primaryAction
              ? {
                  ...next.primaryAction,
                  onPress: () => latest?.primaryAction?.onPress(),
                }
              : undefined,
            actions: next.actions?.map((action, index) => ({
              ...action,
              onPress: () => {
                const current = action.id
                  ? latest?.actions?.find((candidate) => candidate.id === action.id)
                  : latest?.actions?.[index];
                current?.onPress();
              },
            })),
            search: next.search
              ? {
                  ...next.search,
                  onValueChange: (value) => latest?.search?.onValueChange(value),
                }
              : undefined,
            segments: next.segments
              ? {
                  ...next.segments,
                  onChange: (value) => latest?.segments?.onChange(value),
                }
              : undefined,
          }
        : null;
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
  largeTitleBottom: SharedValue<number>;
  store: HeaderStore;
}

/** Create the header controller for one Dialog. Stable for the Dialog's life. */
export function useDialogHeaderController(): DialogHeaderController {
  const scrollY = useSharedValue(0);
  const largeTitleHeight = useSharedValue(0);
  const largeTitleBottom = useSharedValue(0);
  const store = useMemo(() => createHeaderStore(), []);
  return useMemo(
    () => ({ scrollY, largeTitleHeight, largeTitleBottom, store }),
    [scrollY, largeTitleHeight, largeTitleBottom, store],
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
  return <DialogHeaderContext.Provider value={controller}>{children}</DialogHeaderContext.Provider>;
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: Track contribution fields rather than an inline config object identity.
  useLayoutEffect(() => {
    if (!store) return;
    store.setOverride(config ?? null);
    // Slot nodes are compared by identity; callers memoize them.
  }, [
    store,
    config?.title,
    config?.titleContent,
    config?.subtitle,
    config?.largeTitle,
    config?.largeTitleAlign,
    config?.largeTitleVariant,
    config?.titleLayout,
    config?.titleReveal,
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
  // Clear only on contributor unmount/store change. Clearing during every
  // callback-only update would defeat render equality and notify twice.
  useLayoutEffect(() => () => store?.setOverride(null), [store]);
}

/** Read the merged (base + runtime-override) header config, reactively. */
function useMergedHeaderConfig(base: DialogHeaderConfig, store: HeaderStore): DialogHeaderConfig {
  const override = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return useMemo(() => (override ? { ...base, ...override } : base), [base, override]);
}

// --- Rich header sub-parts --------------------------------------------------

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
  const common = useCommonMessages();
  return (
    <Meter
      role="progressbar"
      value={step}
      max={total}
      height={4}
      track={onImage ? 'rgba(255,255,255,0.25)' : theme.colors.border}
      // The NAME and the reading: the bar always means the same thing, so Bloom
      // supplies both itself rather than taking a prop for them.
      accessibilityLabel={common.progress}
      valueText={common.stepOf(step, total)}
    />
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
  Actions,
  onDismiss,
  collapse = true,
  style,
}: {
  controller: DialogHeaderController;
  header: DialogHeaderConfig;
  Actions: React.ComponentType<HeaderActionsProps>;
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
  const surfaceFill = useSurfaceFill();
  const common = useCommonMessages();
  const config = useMergedHeaderConfig(header, controller.store);
  const { scrollY, largeTitleHeight, largeTitleBottom } = controller;

  // A branded `titleContent` owns the bar centre outright: it is always visible,
  // so there is nothing to collapse and no large in-content title to collapse under.
  const hasLargeTitle =
    collapse &&
    !config.titleContent &&
    (config.titleLayout ? config.titleLayout === 'large' : (config.largeTitle ?? true)) &&
    !!config.title;
  const heroTitle = collapse && config.titleLayout === 'hero' && !config.titleContent;
  const afterTitle = hasLargeTitle && config.titleReveal === 'afterTitle';
  const revealOffset = useDerivedValue(
    () =>
      afterTitle
        ? largeTitleBottom.value || Number.MAX_SAFE_INTEGER
        : heroTitle
          ? 96
          : (largeTitleHeight.value || 44) * 0.35,
    [largeTitleHeight, largeTitleBottom, heroTitle, afterTitle],
  );
  const revealDistance = useDerivedValue(
    () => (afterTitle ? 1 : (largeTitleHeight.value || 44) * 0.55),
    [largeTitleHeight, afterTitle],
  );
  const onImage = config.tone === 'onImage';
  const actions: HeaderAction[] = (config.actions ?? []).map((action, index) => ({
    ...action,
    id: action.id ?? `legacy-dialog-action-${index}`,
    label: 'label' in action ? action.label : action.accessibilityLabel,
    labelVisibility: action.labelVisibility ?? 'hidden',
  }));
  if (config.showClose !== false)
    actions.push({
      id: 'bloom-dialog-close',
      label: common.close,
      icon: RiCloseLine,
      onPress: onDismiss,
      essential: true,
      labelVisibility: 'hidden',
    });
  const right = config.right ?? (
    <Actions
      actions={actions}
      testID={config.actions?.length ? 'dialog-nav-action' : 'dialog-nav-close'}
      persistentActions={
        config.primaryAction ? (
          <Button
            size="sm"
            onPress={config.primaryAction.onPress}
            disabled={config.primaryAction.disabled || config.primaryAction.loading}
            loading={config.primaryAction.loading}
            accessibilityLabel={config.primaryAction.label}
            appearance="solid"
            tone="accent"
          >
            {config.primaryAction.label}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <HeaderDockProvider scrollY={scrollY}>
      <PageHeader
        testID="dialog-nav"
        title={config.titleContent ?? config.title}
        subtitle={!hasLargeTitle && !config.titleContent ? config.subtitle : undefined}
        titleAlign="center"
        headingLevel={2}
        titleRevealOffset={hasLargeTitle || heroTitle ? revealOffset : undefined}
        titleRevealDistance={hasLargeTitle || heroTitle ? revealDistance : undefined}
        scrollY={scrollY}
        leading={config.left}
        onBack={config.left ? undefined : config.onBack}
        backLabel={common.goBack}
        actions={right}
        tone={config.tone}
        scrim={heroTitle ? 'auto' : 'always'}
        transparent={heroTitle}
        scrimColor={onImage ? '#000000' : (surfaceFill ?? theme.colors.background)}
        border="none"
        placement="overlay"
        sticky={false}
        safeArea={false}
        style={style}
      />
    </HeaderDockProvider>
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
  const common = useCommonMessages();
  const { messages } = useMessages(DIALOG_MESSAGES);
  const config = useMergedHeaderConfig(header, controller.store);
  const { largeTitleHeight, largeTitleBottom } = controller;
  const titleGeometry = useRef({ blockY: 0, headingBottom: 0 });

  // A branded `titleContent` lives in the bar and never collapses, so the
  // surface starts flush under the bar with no large title above it.
  const hasLargeTitle =
    !config.titleContent &&
    (config.titleLayout ? config.titleLayout === 'large' : (config.largeTitle ?? true)) &&
    !!config.title;
  // The large-title zone also hosts search / segments / progress. These require a
  // scrolling surface (they live here, not in the fixed bar) and collapse with the
  // title on scroll (iOS `.searchable` style).
  const hasExtras = !!(config.search || config.segments || config.progress);
  const onImage = config.tone === 'onImage';

  const onLayout = (e: LayoutChangeEvent) => {
    largeTitleHeight.value = e.nativeEvent.layout.height;
    titleGeometry.current.blockY = e.nativeEvent.layout.y;
    if (titleGeometry.current.headingBottom) {
      largeTitleBottom.value = titleGeometry.current.blockY + titleGeometry.current.headingBottom;
    }
  };
  const onTitleLayout = (e: LayoutChangeEvent) => {
    titleGeometry.current.headingBottom = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
    largeTitleBottom.value = titleGeometry.current.blockY + titleGeometry.current.headingBottom;
  };

  if (!hasLargeTitle && !hasExtras) {
    // Pure content (no header chrome to render in-flow). Under `tone: 'onImage'`
    // the content is media (a banner / photo canvas), so it slides UP under the
    // translucent nav bar — the bar FLOATS over the media, immersive at rest (the
    // standard iOS large-title-over-photo / Material collapsing-toolbar pattern).
    // Default tone keeps the nav-bar-height inset so content clears the bar.
    return onImage || config.titleLayout === 'hero' ? null : (
      <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />
    );
  }

  return (
    <>
      {/* All large titles clear the navigation row and its gradient tail. */}
      <View
        testID="dialog-large-title-inset"
        style={{
          height: DIALOG_HEADER_CONTENT_TOP,
        }}
      />
      <View onLayout={onLayout} testID="dialog-large-title" style={styles.largeTitleBlock}>
        {hasLargeTitle ? (
          <>
            <View onLayout={onTitleLayout} testID="dialog-heading-anchor">
              <H1
                style={[
                  config.largeTitleVariant
                    ? TYPE_SCALE[config.largeTitleVariant]
                    : styles.largeTitle,
                  {
                    color: onImage ? ON_IMAGE_TEXT : theme.colors.text,
                    textAlign: config.largeTitleAlign ?? 'left',
                  },
                ]}
              >
                {config.title}
              </H1>
            </View>
            {config.subtitle ? (
              <Subtitle
                style={[
                  styles.largeSubtitle,
                  { textAlign: config.largeTitleAlign ?? 'left' },
                  { color: onImage ? ON_IMAGE_SUBTEXT : theme.colors.textSecondary },
                ]}
              >
                {config.subtitle}
              </Subtitle>
            ) : null}
          </>
        ) : null}
        {config.search ? (
          <View style={hasLargeTitle ? styles.extraRow : undefined}>
            <Search
              value={config.search.value}
              onValueChange={config.search.onValueChange}
              label={config.search.placeholder ?? common.search}
              onSubmitEditing={config.search.onSubmit}
              onClearText={() => config.search?.onValueChange('')}
            />
          </View>
        ) : null}
        {config.segments ? (
          <View style={hasLargeTitle || config.search ? styles.extraRow : undefined}>
            <SegmentedControl
              label={config.title ?? messages.view}
              type="tabs"
              size="sm"
              // The segmented control sizes to its segments; the header tabs span the row.
              style={{ alignSelf: 'stretch' }}
              value={config.segments.value}
              onValueChange={config.segments.onChange}
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
          <View
            style={hasLargeTitle || config.search || config.segments ? styles.extraRow : undefined}
          >
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
  if (config.tone === 'onImage' || config.titleLayout === 'hero') return null;
  return <View style={{ height: DIALOG_NAV_BAR_HEIGHT }} />;
});

const styles = StyleSheet.create({
  /** Trailing row: icon actions + the primary CTA, right-aligned. */
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    // `H1` now carries shadcn's `text-center`. A dialog's large title is a
    // leading-aligned page heading, so it states its own alignment rather than
    // inheriting the variant's.
    textAlign: 'left',
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
});
