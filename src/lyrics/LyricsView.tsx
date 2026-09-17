import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { webDataSet } from '../checkbox/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { LyricsLineRow, LyricsPill, type LyricLineState } from './LyricsParts';
import {
  DEFAULT_EMPTY_TEXT,
  IS_WEB,
  LYRICS_CSS,
  LYRICS_STYLE_ID,
  activeLyricIndex,
  lyricLineVariant,
  lyricsScrollTarget,
  lyricsSizeForWidth,
  normalizeLyricLines,
  resolveLyricsPalette,
} from './shared';
import type { LyricsSize, LyricsViewProps } from './types';

/**
 * Synced lyrics that follow playback.
 *
 *   size     line type                          gap   padding top / sides
 *   large    display-4 (32/44) semibold · bold  12    32 / 32
 *   medium   title-1 (24/34) semibold · bold    8     20 / 24
 *   small    title-2 (20/26) semibold · bold    8     20 / 20
 *
 *   past      the text colour mixed toward the background (≥ 3:1)
 *   active    the full text colour, bold
 *   upcoming  mixed less (≥ 4.5:1)
 *
 * `size` defaults by width: `large` from 720, `medium` from 480, `small` below. Only colour and weight change
 * with playback — no line grows, moves or scales.
 *
 * Auto-scroll keeps the active line's centre `anchor` (1/3) down the view. A
 * user scroll (drag, wheel or any scroll the view did not start) pauses it
 * for `resumeDelay` ms and shows a "Back to current line" pill; pressing it,
 * or the delay passing, scrolls back. Reduced motion jumps instead of
 * animating. The bottom is padded by the rest of the view's height so the last
 * line can reach the anchor too.
 *
 * Lines without times draw as plain text in the full colour: nothing scrolls
 * and nothing seeks.
 *
 * Accessibility: a `region` named "Lyrics". With `onSeekLine`, each synced
 * line is a `button` named by its words; the active line carries
 * `aria-current` on web.
 */

/** How long a programmatic scroll's own scroll events are ignored, in ms. */
const PROGRAMMATIC_WINDOW_MS = 1000;

function LyricsViewComponent({
  lines: linesProp,
  text,
  currentTime,
  onSeekLine,
  artworkColor,
  providerText,
  footer,
  emptyText = DEFAULT_EMPTY_TEXT,
  backToCurrentLabel = 'Back to current line',
  resumeDelay = 3000,
  anchor = 1 / 3,
  size: sizeProp,
  accessibilityLabel = 'Lyrics',
  style,
  testID,
}: LyricsViewProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(LYRICS_STYLE_ID, LYRICS_CSS);
  }, []);
  const reducedMotion = useReducedMotion();
  const palette = useMemo(() => resolveLyricsPalette(theme, artworkColor), [theme, artworkColor]);
  const { lines, synced } = useMemo(() => normalizeLyricLines(linesProp, text), [linesProp, text]);
  const active = synced ? activeLyricIndex(lines, currentTime) : -1;

  const [width, setWidth] = useState(0);
  const [viewport, setViewport] = useState(0);
  const size: LyricsSize = sizeProp ?? lyricsSizeForWidth(width);
  const large = size === 'large';
  const gap = large ? 12 : 8;
  const paddingH = large ? 32 : size === 'medium' ? 24 : 20;
  const paddingTop = large ? 32 : 20;

  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef(new Map<number, { y: number; height: number }>());
  const offset = useRef(0);
  const content = useRef(0);
  const programmaticUntil = useRef(0);
  const expected = useRef<number | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detached, setDetached] = useState(false);

  const scrollToActive = useCallback(
    (animated: boolean) => {
      if (active < 0 || viewport <= 0) return;
      const layout = layouts.current.get(active);
      if (!layout) return;
      const target = lyricsScrollTarget({
        lineTop: layout.y,
        lineHeight: layout.height,
        viewport,
        content: content.current,
        anchor,
      });
      if (Math.abs(target - offset.current) < 1) return;
      const animate = animated && !reducedMotion;
      programmaticUntil.current = Date.now() + (animate ? PROGRAMMATIC_WINDOW_MS : 100);
      expected.current = target;
      scrollRef.current?.scrollTo({ y: target, animated: animate });
    },
    [active, viewport, anchor, reducedMotion],
  );

  // Follow the active line while attached. The first placement never animates.
  const placed = useRef(false);
  useEffect(() => {
    if (detached) return;
    scrollToActive(placed.current);
    if (layouts.current.has(active) && viewport > 0) placed.current = true;
  }, [active, detached, scrollToActive, viewport]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const attach = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = null;
    setDetached(false);
  }, []);

  const noteUserScroll = useCallback(() => {
    if (!synced) return;
    programmaticUntil.current = 0;
    expected.current = null;
    setDetached(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      resumeTimer.current = null;
      setDetached(false);
    }, resumeDelay);
  }, [synced, resumeDelay]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      offset.current = y;
      if (Date.now() < programmaticUntil.current) return;
      if (expected.current !== null && Math.abs(y - expected.current) < 2) return;
      noteUserScroll();
    },
    [noteUserScroll],
  );

  const onLineLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      layouts.current.set(index, { y, height });
      if (index === active && !detached) scrollToActive(placed.current);
      if (index === active) placed.current = true;
    },
    [active, detached, scrollToActive],
  );

  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setWidth(w);
    setViewport(h);
  }, []);

  const gapHeight = Math.max(16, TYPE_SCALE[lyricLineVariant(size, false)].lineHeight / 2);
  const empty = lines.length === 0;

  const rootStyle: WebCssStyle = {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: palette.background,
    '--bloom-lyrics-ring': palette.ring,
  };

  const footerNode =
    footer ??
    (providerText ? (
      <Text variant="caption-1-regular" style={{ color: palette.muted }}>
        {providerText}
      </Text>
    ) : null);

  return (
    <View
      role="region"
      accessibilityLabel={accessibilityLabel}
      onLayout={onRootLayout}
      style={[rootStyle, style]}
      testID={testID}
    >
      {empty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text variant="title-3-semibold" style={{ color: palette.upcoming, textAlign: 'center' }}>
            {emptyText}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          {...webDataSet({ bloomLyricsScroll: '' })}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onScrollBeginDrag={noteUserScroll}
          // Web: a wheel or touch drag is the user's even while an animated
          // auto-scroll's own events are still being ignored.
          {...(IS_WEB ? { onWheel: noteUserScroll, onTouchMove: noteUserScroll } : null)}
          onContentSizeChange={(_w, h) => {
            content.current = h;
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap,
            paddingTop,
            paddingLeft: paddingH,
            paddingRight: paddingH,
            paddingBottom: synced ? Math.max(paddingTop, viewport * (1 - anchor)) : paddingTop,
          }}
          testID={testID ? `${testID}-scroll` : undefined}
        >
          {lines.map((line, index) => {
            const state: LyricLineState = !synced
              ? 'plain'
              : index === active
                ? 'active'
                : index < active
                  ? 'past'
                  : 'upcoming';
            return (
              <LyricsLineRow
                key={line.key ?? index}
                line={line}
                index={index}
                state={state}
                variant={lyricLineVariant(size, synced && index === active)}
                palette={palette}
                onSeekLine={synced ? onSeekLine : undefined}
                onLineLayout={synced ? onLineLayout : undefined}
                gapHeight={gapHeight}
                testID={testID ? `${testID}-line-${index}` : undefined}
              />
            );
          })}
          {footerNode ? <View style={{ marginTop: large ? 32 : 24 }}>{footerNode}</View> : null}
        </ScrollView>
      )}
      {detached && synced && active >= 0 ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' }}
        >
          <LyricsPill
            label={backToCurrentLabel}
            palette={palette}
            onPress={() => {
              attach();
              scrollToActive(true);
            }}
            testID={testID ? `${testID}-back` : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

export const LyricsView = memo(LyricsViewComponent);
LyricsView.displayName = 'LyricsView';
