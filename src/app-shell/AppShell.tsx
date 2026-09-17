import React, { memo, useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { resolveButtonRamps, mixColor } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { Sidebar } from '../sidebar';
import { BREAKPOINTS } from '../styles/breakpoints';
import {
  WEB_OVERFLOW_CLIP,
  WEB_POSITION_FIXED,
  WEB_POSITION_STICKY,
  WEB_VIEWPORT_HEIGHT,
  webViewportHeightMinus,
  type WebCssStyle,
} from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { AppShellHeader } from './AppShellHeader';
import { AppShellProvider } from './context';
import type { AppShellProps } from './types';

/**
 * The page frame: a starter shell and a dashboard shell, combined into one
 * component.
 *
 *   root       row, background-full; one screen tall at least (document
 *              scroll), exactly (`fixed`), or its parent's height (`container`)
 *   lg and up  the sidebar in flow (from `sm` for `variant: 'rail'`, whose
 *              drawer below `sm` opens the panel); `overlay` pads the whole frame 12 with a
 *              16 gap, `reveal` sits the rail 12 from the top-left
 *   main       scrolls — on web the DOCUMENT (see `scroll`), elsewhere its own
 *              ScrollView; the content column is centred, max 1300, gap 10:
 *              header (breadcrumb + title row), then the content (gap 16,
 *              16 below). `overlay` insets the column 12 from the top at `sm`,
 *              `reveal` pads the page 12 (24 on top at `sm`)
 *   aside      optional right column, `asideWidth` (320) wide from `asideFrom`
 *              (xl), pinned like the rail; below it stacked after the content
 *   below lg   the header grows a hamburger (also with no title — see
 *              `useAppShell` / `AppShellMenuButton`). `overlay` opens the rail as a
 *              drawer (12 inset) over a 40% black backdrop; `reveal` slides
 *              the page 272 right and rounds it to 32 while the rail, flat
 *              beneath it, scales up from 0.94 and fades in (325ms,
 *              cubic-bezier(0.42, 0, 0.58, 1)); pressing the page (a 10% black
 *              / 5% white veil) closes it
 */

const REVEAL_EASE = Easing.bezier(0.42, 0, 0.58, 1);
const REVEAL_MS = 325;
const REVEAL_OFFSET = 272;

type ScrollMode = 'document' | 'container' | 'fixed';

/**
 * The page's scroller. `document`: a plain box, the page grows the document.
 * `fixed`: a plain box that fills the frame's height and never scrolls — the
 * page owns its scrolling. `container`: a `ScrollView` filling the frame.
 */
function Scroller({
  mode,
  style,
  contentStyle,
  children,
}: {
  mode: ScrollMode;
  style: WebCssStyle;
  contentStyle: WebCssStyle;
  children: React.ReactNode;
}) {
  if (mode === 'document') return <View style={[style, contentStyle]}>{children}</View>;
  if (mode === 'fixed') {
    return <View style={[{ flex: 1, minHeight: 0 }, style, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView style={[{ flex: 1 }, style]} contentContainerStyle={contentStyle}>
      {children}
    </ScrollView>
  );
}

const AppShellComponent: React.FC<AppShellProps> = ({
  sidebar,
  drawer = 'overlay',
  title,
  breadcrumb,
  actions,
  header,
  aside,
  asideWidth = 320,
  asideFrom = 'xl',
  asideCollapse = 'stack',
  children,
  contentMaxWidth = 1300,
  overlay,
  drawerOpen,
  onDrawerOpenChange,
  scroll = 'document',
  style,
  testID,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // Native has no document: `document` falls back to `container` there.
  const mode: ScrollMode = scroll === 'document' && Platform.OS !== 'web' ? 'container' : scroll;
  const doc = mode === 'document';
  const fixed = mode === 'fixed';
  const small = width >= BREAKPOINTS.sm;
  // The rail is narrow enough to stay in flow from `sm`; the panel needs `lg`.
  const rail = sidebar?.variant === 'rail';
  const wide = rail ? small : width >= BREAKPOINTS.lg;
  const asideBeside = aside != null && width >= BREAKPOINTS[asideFrom];
  const asideStacked = aside != null && !asideBeside && asideCollapse === 'stack';
  // The drawer always opens the full panel, whatever the in-flow variant.
  const drawerSidebar = sidebar ? { ...sidebar, variant: 'panel' as const } : undefined;
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useControllableState<boolean>({
    value: drawerOpen,
    defaultValue: false,
    onChange: onDrawerOpenChange,
  });
  const drawerAvailable = !!sidebar && !wide;
  const isOpen = open && drawerAvailable;

  const shell = useMemo(
    () => ({
      drawerAvailable,
      drawerOpen: isOpen,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      toggleDrawer: () => setOpen(!isOpen),
    }),
    [drawerAvailable, isOpen, setOpen],
  );

  const { neutral: n } = resolveButtonRamps(theme);
  const background = theme.isDark ? mixColor(n[900], n[950], 0.4) : theme.colors.card;

  const reveal = useSharedValue(isOpen ? 1 : 0);
  useEffect(() => {
    const target = isOpen && drawer === 'reveal' ? 1 : 0;
    reveal.value = reducedMotion ? target : withTiming(target, { duration: REVEAL_MS, easing: REVEAL_EASE });
  }, [isOpen, drawer, reducedMotion, reveal]);
  const railStyle = useAnimatedStyle(
    () => ({ opacity: reveal.value, transform: [{ scale: 0.94 + 0.06 * reveal.value }] }),
    [reveal],
  );
  const pageStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: REVEAL_OFFSET * reveal.value }], borderRadius: 32 * reveal.value }),
    [reveal],
  );
  const veilStyle = useAnimatedStyle(() => ({ opacity: reveal.value }), [reveal]);

  // The default header renders whenever it has something to show — a menu
  // button alone counts, so a page without a title can still open the drawer.
  const headerNode =
    header ??
    (title != null || breadcrumb != null || actions != null || drawerAvailable ? (
      <AppShellHeader
        title={title}
        breadcrumb={breadcrumb}
        actions={actions}
        menuOpen={isOpen}
        onMenuPress={drawerAvailable ? shell.toggleDrawer : undefined}
        testID={testID ? `${testID}-header` : undefined}
      />
    ) : null);

  const fill = fixed ? { flex: 1, minHeight: 0 } : null;
  const column = (
    <View style={[{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 10 }, fill]}>
      {headerNode}
      <View style={[{ width: '100%', gap: 16, paddingBottom: drawer === 'overlay' ? 16 : 0 }, fill]}>
        {children}
        {asideStacked ? <View testID={testID ? `${testID}-aside` : undefined}>{aside}</View> : null}
      </View>
    </View>
  );

  // Beside the content: sticky and self-scrolling with document scroll, a
  // full-height scroller otherwise.
  const asideColumn = (inset: WebCssStyle) =>
    asideBeside ? (
      <View
        testID={testID ? `${testID}-aside` : undefined}
        style={[
          { width: asideWidth, flexShrink: 0 },
          doc ? { ...stickyRail(12), width: asideWidth } : { alignSelf: 'stretch' },
          inset,
        ]}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {aside}
        </ScrollView>
      </View>
    ) : null;

  const frame = doc ? documentRoot : fixed ? fixedRoot : containerRoot;

  if (drawer === 'reveal') {
    return (
      <AppShellProvider value={shell}>
        <View
          testID={testID}
          style={[frame, doc ? { overflow: WEB_OVERFLOW_CLIP } : null, { flexDirection: 'row', backgroundColor: background }, style]}
        >
          {sidebar && wide ? (
            <View style={[{ paddingTop: 12, paddingBottom: 12, paddingLeft: 12, flexShrink: 0 }, doc ? stickyRail(0) : null]}>
              <Sidebar {...sidebar} />
            </View>
          ) : null}
          {sidebar && !wide ? (
            <View
              aria-hidden={!isOpen}
              pointerEvents={isOpen ? 'auto' : 'none'}
              // Fixed on web in document mode: the rail waits beneath the VIEWPORT,
              // wherever the page is scrolled to.
              style={{ position: doc ? WEB_POSITION_FIXED : 'absolute', top: 0, bottom: 0, left: 0, width: 272, paddingTop: 12, paddingBottom: 12, paddingLeft: 6 }}
            >
              <Animated.View style={[{ height: '100%', width: 260, transformOrigin: 'left center' }, railStyle]}>
                <Sidebar {...drawerSidebar} mobile flat onClose={() => setOpen(false)} />
              </Animated.View>
            </View>
          ) : null}
          <Animated.View
            style={[
              { flex: 1, minWidth: 0, flexDirection: 'row', overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background },
              wide ? null : pageStyle,
            ]}
          >
            {/*
              Basis 0 and shrink 1: with only `flexGrow` the column's basis is its
              content's max-content width (react-native-web defaults `flexShrink`
              to 0), so one long unwrapped line of text pushed the page past a
              phone's edge in document mode.
            */}
            <Scroller mode={mode} style={{ flex: doc ? undefined : 1, flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }} contentStyle={{ padding: 12, paddingTop: small ? 24 : 12 }}>
              {column}
            </Scroller>
            {asideColumn({ paddingTop: small ? 24 : 12, paddingBottom: 12, paddingRight: 12 })}
            {!wide ? (
              <Animated.View
                pointerEvents={isOpen ? 'auto' : 'none'}
                style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, veilStyle]}
              >
                <Pressable
                  role="button"
                  accessibilityLabel="Close navigation"
                  focusable={isOpen}
                  onPress={() => setOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                  testID={testID ? `${testID}-veil` : undefined}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
          {overlay}
        </View>
      </AppShellProvider>
    );
  }

  return (
    <AppShellProvider value={shell}>
      <View
        testID={testID}
        style={[frame, { flexDirection: 'row', gap: 16, padding: 12, backgroundColor: background }, style]}
      >
        {sidebar && wide ? (
          doc ? (
            <View style={stickyRail(12)}>
              <Sidebar {...sidebar} />
            </View>
          ) : (
            <Sidebar {...sidebar} />
          )
        ) : null}
        {sidebar && isOpen ? (
          <Portal>
            <OverlayRoot>
              <Backdrop
                onPress={() => setOpen(false)}
                blurIntensity={0}
                dimOpacity={0.4}
                accessibilityLabel="Close navigation"
              />
              <View
                pointerEvents="box-none"
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row', padding: 12 }}
              >
                <View pointerEvents="auto" style={{ height: '100%' }}>
                  <Sidebar {...drawerSidebar} mobile onClose={() => setOpen(false)} />
                </View>
              </View>
            </OverlayRoot>
          </Portal>
        ) : null}
        <Scroller
          mode={mode}
          style={{ flex: 1, minWidth: 0, backgroundColor: background }}
          contentStyle={{ paddingTop: small ? 12 : 0 }}
        >
          {column}
        </Scroller>
        {asideColumn({})}
        {overlay}
      </View>
    </AppShellProvider>
  );
};

/**
 * Document mode: the frame is at least one viewport tall and grows with the
 * page, so the browser scrolls the document (scroll restoration, the address
 * bar collapsing, anchor links, `window.scrollTo`) exactly as it does for a
 * `ContentPanel` page. Nothing here may be a scroll container — no `hidden`
 * overflow — or the sticky rail would stick to a box that never scrolls.
 */
const documentRoot: WebCssStyle = { flexGrow: 1, minHeight: WEB_VIEWPORT_HEIGHT };
// (Under `reveal` the document root also takes `overflow: clip`: the page slides
// 272 right, and `clip` keeps that from widening the document with a horizontal
// scrollbar without becoming a scroll container.)

/** Container mode: fill the parent, scroll inside. */
const containerRoot: WebCssStyle = { flex: 1, height: '100%', overflow: 'hidden' };

/**
 * Fixed mode: exactly one screen — `100dvh` on web, the parent on native — and
 * nothing scrolls; the content fills the height left under the header.
 */
const fixedRoot: WebCssStyle =
  Platform.OS === 'web'
    ? { height: WEB_VIEWPORT_HEIGHT, overflow: 'hidden' }
    : { flex: 1, height: '100%', overflow: 'hidden' };

/** The in-flow rail, pinned to the viewport while the document scrolls under it. */
function stickyRail(inset: number): WebCssStyle {
  return {
    position: WEB_POSITION_STICKY,
    top: inset,
    height: webViewportHeightMinus(inset * 2),
    alignSelf: 'flex-start',
    flexShrink: 0,
  };
}

export const AppShell = memo(AppShellComponent);
AppShell.displayName = 'AppShell';
