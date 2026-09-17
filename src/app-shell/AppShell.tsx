import React, { memo, useEffect } from 'react';
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
import type { AppShellProps } from './types';

/**
 * The page frame: a starter shell and a dashboard shell, combined into one
 * component.
 *
 *   root       row, full height, background-full, overflow hidden
 *   lg and up  the sidebar in flow (from `sm` for `variant: 'rail'`, whose
 *              drawer below `sm` opens the panel); `overlay` pads the whole frame 12 with a
 *              16 gap, `reveal` sits the rail 12 from the top-left
 *   main       scrolls — on web the DOCUMENT (see `scroll`), elsewhere its own
 *              ScrollView; the content column is centred, max 1300, gap 10:
 *              header (breadcrumb + title row), then the content (gap 16,
 *              16 below). `overlay` insets the column 12 from the top at `sm`,
 *              `reveal` pads the page 12 (24 on top at `sm`)
 *   below lg   the header grows a hamburger. `overlay` opens the rail as a
 *              drawer (12 inset) over a 40% black backdrop; `reveal` slides
 *              the page 272 right and rounds it to 32 while the rail, flat
 *              beneath it, scales up from 0.94 and fades in (325ms,
 *              cubic-bezier(0.42, 0, 0.58, 1)); pressing the page (a 10% black
 *              / 5% white veil) closes it
 */

const REVEAL_EASE = Easing.bezier(0.42, 0, 0.58, 1);
const REVEAL_MS = 325;
const REVEAL_OFFSET = 272;

/**
 * The page's scroller. In `document` mode it is a plain box and the page grows
 * the document; otherwise a `ScrollView` filling the frame.
 */
function Scroller({
  document: inDocument,
  style,
  contentStyle,
  children,
}: {
  document: boolean;
  style: WebCssStyle;
  contentStyle: WebCssStyle;
  children: React.ReactNode;
}) {
  if (inDocument) return <View style={[style, contentStyle]}>{children}</View>;
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
  // Native has no document; `scroll` only chooses on web.
  const doc = Platform.OS === 'web' && scroll === 'document';
  const small = width >= BREAKPOINTS.sm;
  // The rail is narrow enough to stay in flow from `sm`; the panel needs `lg`.
  const rail = sidebar?.variant === 'rail';
  const wide = rail ? small : width >= BREAKPOINTS.lg;
  // The drawer always opens the full panel, whatever the in-flow variant.
  const drawerSidebar = sidebar ? { ...sidebar, variant: 'panel' as const } : undefined;
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useControllableState<boolean>({
    value: drawerOpen,
    defaultValue: false,
    onChange: onDrawerOpenChange,
  });
  const isOpen = open && !wide;

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

  const headerNode =
    header ??
    (title != null ? (
      <AppShellHeader
        title={title}
        breadcrumb={breadcrumb}
        actions={actions}
        menuOpen={isOpen}
        onMenuPress={sidebar && !wide ? () => setOpen(!open) : undefined}
        testID={testID ? `${testID}-header` : undefined}
      />
    ) : null);

  const column = (
    <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 10 }}>
      {headerNode}
      <View style={{ width: '100%', gap: 16, paddingBottom: drawer === 'overlay' ? 16 : 0 }}>{children}</View>
    </View>
  );

  if (drawer === 'reveal') {
    return (
      <View
        testID={testID}
        style={[doc ? revealDocumentRoot : { flex: 1, height: '100%', overflow: 'hidden' }, { flexDirection: 'row', backgroundColor: background }, style]}
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
          style={[{ flex: 1, minWidth: 0, overflow: doc ? WEB_OVERFLOW_CLIP : 'hidden', backgroundColor: background }, wide ? null : pageStyle]}
        >
          <Scroller document={doc} style={{}} contentStyle={{ padding: 12, paddingTop: small ? 24 : 12 }}>
            {column}
          </Scroller>
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
    );
  }

  return (
    <View
      testID={testID}
      style={[
        doc ? documentRoot : { flex: 1, height: '100%', overflow: 'hidden' },
        { flexDirection: 'row', gap: 16, padding: 12, backgroundColor: background },
        style,
      ]}
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
        document={doc}
        style={{ flex: 1, minWidth: 0, backgroundColor: background }}
        contentStyle={{ paddingTop: small ? 12 : 0 }}
      >
        {column}
      </Scroller>
      {overlay}
    </View>
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
// The page slides 272 right under `reveal`; `clip` keeps that from widening the
// document with a horizontal scrollbar, without becoming a scroll container.
const revealDocumentRoot: WebCssStyle = { ...documentRoot, overflow: WEB_OVERFLOW_CLIP };

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
