import type React from 'react';
import {
  createContext,
  memo,
  useContext,
  useLayoutEffect,
  useMemo,
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

import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { PageHeader } from '../page-header';
import { HeaderDockProvider } from '../layout/header-dock';
import { Button } from '../button';
import { Search } from '../search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Item } from '../item';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { H1, Subtitle } from '../typography';
import type { DialogHeaderConfig } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { DIALOG_MESSAGES } from './messages';

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

type PrimaryAction = NonNullable<DialogHeaderConfig['primaryAction']>;
type HeaderAction = NonNullable<DialogHeaderConfig['actions']>[number];
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

function actionsEqual(a: HeaderAction[] | undefined, b: HeaderAction[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) return false;
    // `icon` is a memoized node (compared by identity); `onPress` is ignored.
    if (
      x.accessibilityLabel !== y.accessibilityLabel ||
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
    a.titleLayout === b.titleLayout &&
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
  return useMemo(() => ({ scrollY, largeTitleHeight, store }), [scrollY, largeTitleHeight, store]);
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
    return () => store.setOverride(null);
    // Slot nodes are compared by identity; callers memoize them.
  }, [
    store,
    config?.title,
    config?.titleContent,
    config?.subtitle,
    config?.largeTitle,
    config?.titleLayout,
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
function useMergedHeaderConfig(base: DialogHeaderConfig, store: HeaderStore): DialogHeaderConfig {
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
}: {
  items: NonNullable<DialogHeaderConfig['actions']>;
}): React.ReactElement {
  // Own the open state so an item press can close the popover before acting.
  const [open, setOpen] = useState(false);
  const common = useCommonMessages();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild label={common.more}>
        <ButtonGroupItem iconOnly leadingIcon={RiMoreFill} accessibilityLabel={common.more} />
      </PopoverTrigger>
      <PopoverContent label={common.moreActions} align="end">
        {items.map((action) => (
          <Item
            key={action.accessibilityLabel}
            title={action.accessibilityLabel}
            leading={<action.icon />}
            density="compact"
            disabled={action.disabled}
            onPress={() => {
              setOpen(false);
              action.onPress();
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Trailing icon `actions`: the first {@link DIALOG_HEADER_MAX_INLINE_ACTIONS}
 * render inline in one shared action island; any surplus collapses into a "more" overflow
 * that drops from the ⋯ ({@link HeaderOverflowMenu}) — never hand-rolled.
 */
function HeaderTrailingActions({
  actions,
  closeButton,
}: {
  actions: NonNullable<DialogHeaderConfig['actions']>;
  closeButton?: React.ReactNode;
}): React.ReactElement | null {
  if (actions.length === 0 && !closeButton) return null;
  const overflows = actions.length > DIALOG_HEADER_MAX_INLINE_ACTIONS;
  // Keep room for the "more" trigger when collapsing.
  const inline = overflows ? actions.slice(0, DIALOG_HEADER_MAX_INLINE_ACTIONS - 1) : actions;
  const overflow = overflows ? actions.slice(DIALOG_HEADER_MAX_INLINE_ACTIONS - 1) : [];
  return (
    <ButtonGroup testID={actions.length ? 'dialog-nav-action-group' : 'dialog-nav-close-group'}>
      {inline.map((action) => (
        <ButtonGroupItem
          key={action.accessibilityLabel}
          iconOnly
          leadingIcon={action.icon}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={action.accessibilityLabel}
        />
      ))}
      {overflow.length > 0 ? <HeaderOverflowMenu items={overflow} /> : null}
      {closeButton}
    </ButtonGroup>
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
  const common = useCommonMessages();
  const fraction = total > 0 ? Math.min(1, Math.max(0, step / total)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      // The FLAT `aria-value*` props: react-native-web drops the
      // `accessibilityValue` object entirely, so the wizard step announced a
      // progressbar with no step count. React Native folds these back into
      // `accessibilityValue`, so native is unchanged.
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={step}
      // The NAME, which the value props do not supply and which `progressbar`
      // never computes from contents: unnamed, the bar announced a bare "2 of
      // 5" with no subject. This one Bloom can answer itself — the bar always
      // means the same thing — so unlike `Slider` it takes
      // no prop. `aria-valuetext` carries the reading, since the raw number is
      // announced as a percentage otherwise.
      accessibilityLabel={common.progress}
      aria-valuetext={common.stepOf(step, total)}
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
  const surfaceFill = useSurfaceFill();
  const common = useCommonMessages();
  const config = useMergedHeaderConfig(header, controller.store);
  const { scrollY, largeTitleHeight } = controller;

  // A branded `titleContent` owns the bar centre outright: it is always visible,
  // so there is nothing to collapse and no large in-content title to collapse under.
  const hasLargeTitle =
    collapse &&
    !config.titleContent &&
    (config.titleLayout ? config.titleLayout === 'large' : (config.largeTitle ?? true)) &&
    !!config.title;
  const heroTitle = collapse && config.titleLayout === 'hero' && !config.titleContent;
  const revealOffset = useDerivedValue(
    () => (heroTitle ? 96 : (largeTitleHeight.value || 44) * 0.35),
    [largeTitleHeight, heroTitle],
  );
  const revealDistance = useDerivedValue(
    () => (largeTitleHeight.value || 44) * 0.55,
    [largeTitleHeight],
  );
  const onImage = config.tone === 'onImage';
  const closeButton =
    config.showClose !== false ? (
      <ButtonGroupItem
        iconOnly
        leadingIcon={RiCloseLine}
        onPress={onDismiss}
        accessibilityLabel={common.close}
      />
    ) : null;

  // A custom right slot owns its controls. Otherwise the close affordance
  // stays with the icon actions, even when back or a primary action is present.
  const right = config.right ?? (
    <View style={styles.trailing}>
      {config.primaryAction ? (
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
      ) : null}
      <HeaderTrailingActions actions={config.actions ?? []} closeButton={closeButton} />
    </View>
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
  const { largeTitleHeight } = controller;

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
            <H1 style={[styles.largeTitle, { color: onImage ? ON_IMAGE_TEXT : theme.colors.text }]}>
              {config.title}
            </H1>
            {config.subtitle ? (
              <Subtitle
                style={[
                  styles.largeSubtitle,
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
