import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { chipRowOverflow, type ChipRowScroll } from './shared';
import type { ChipRowProps } from './types';

/**
 * A row of pills that scrolls sideways, with a fade at whichever edge has more
 * behind it.
 *
 * The fade is the thing worth sharing. Without it a clipped pill just stops
 * mid-glyph and reads as a rendering fault rather than as "there is more"; the
 * row `category-bar` draws is the only place in the library that had one, and
 * five filter rows were scrolling without it. The gradient resolves into
 * `fadeColor` — the surface BEHIND the row, which the row cannot know — so a
 * caller on a card must say so or the fade will blend into the page instead.
 *
 * Web only, and deliberately: the fade is painted with a CSS gradient, and on
 * native a scroll row already shows its own bounce. The row scrolls on both.
 *
 * `ringInset` keeps room on every side for a pill's focus ring and takes it
 * back out with negative margins, so the row still lines up with the heading
 * above it — a ring clipped by its own scroller is the usual way a focus
 * outline half-disappears.
 *
 * Semantics belong to the CALLER: pass `role` and `accessibilityLabel` that
 * match what the pills are (`group` of toggles, `radiogroup`, `tablist`). The
 * row draws nothing of its own that assistive technology should see.
 */

const IS_WEB = Platform.OS === 'web';

/** Width of each edge's fade. */
export const CHIP_ROW_EDGE = 40;

const STYLE_ID = 'bloom-chip-row-web-css';
const TRACK = '[data-bloom-chip-row-track]';

const BLOOM_CHIP_ROW_CSS = `
${TRACK} {
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
${TRACK}::-webkit-scrollbar {
  display: none;
}
`;

function ChipRowComponent({
  children,
  gap = 8,
  contentInset = 0,
  fadeColor,
  ringInset = 4,
  role = 'group',
  accessibilityLabel,
  disabled,
  style,
  contentContainerStyle,
  testID,
}: ChipRowProps) {
  const theme = useTheme();
  React.useEffect(() => {
    adoptStyleSheet(STYLE_ID, BLOOM_CHIP_ROW_CSS);
  }, []);

  const [scroll, setScroll] = useState<ChipRowScroll>({ x: 0, viewport: 0, content: 0 });
  const overflow = useMemo(() => chipRowOverflow(scroll), [scroll]);
  const fade = fadeColor ?? theme.colors.background;

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    setScroll({ x: contentOffset.x, viewport: layoutMeasurement.width, content: contentSize.width });
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setScroll((previous) => (previous.viewport === width ? previous : { ...previous, viewport: width }));
  }, []);

  const onContentSizeChange = useCallback((width: number) => {
    setScroll((previous) => (previous.content === width ? previous : { ...previous, content: width }));
  }, []);

  // The fade has to cover the SCROLLER, which sits `ringInset` outside the
  // wrapper on every side (the negative margins above). Pinned to the wrapper's
  // own edge instead, it leaves exactly that much uncovered, and a chip clipped
  // by those few pixels reads as a hard cut with a fade beside it — measured in
  // Chrome at 4px, which is enough to see.
  const edgeStyle = (side: 'left' | 'right'): WebCssStyle => ({
    position: 'absolute',
    top: -ringInset,
    bottom: -ringInset,
    ...(side === 'left' ? { left: -ringInset } : { right: -ringInset }),
    width: CHIP_ROW_EDGE,
    backgroundImage: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${fade} 0%, ${fade} 40%, transparent 100%)`,
  });

  return (
    // The ROLE and the name go on the wrapper, not the scroller: the wrapper is
    // the element a caller's `testID` lands on, and a group whose semantics
    // hide one node deeper is a group every consumer's test misses.
    <View
      role={role}
      accessibilityLabel={accessibilityLabel}
      aria-disabled={disabled || undefined}
      // `minWidth: 0` is not decoration: a flex item's automatic minimum size is
      // its CONTENT's width, so a row of pills wider than the screen widens the
      // COLUMN it sits in and the page scrolls sideways instead of the row.
      // Measured at a 390 viewport: a parent 1552px wide. It belongs here
      // rather than at each call site — every consumer of a sideways scroller
      // inherits the same trap, and three of them had already worked around it.
      style={[{ position: 'relative', minWidth: 0 }, style]}
      testID={testID}
    >
      <ScrollView
        {...(IS_WEB ? ({ dataSet: { bloomChipRowTrack: '' } } as Record<string, unknown>) : {})}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        // The ring room, and the same amount taken back out, so a focus outline
        // is not clipped by the scroller and the row still lines up.
        style={{
          flexGrow: 0,
          minWidth: 0,
          marginTop: -ringInset,
          marginBottom: -ringInset,
          marginLeft: -ringInset,
          marginRight: -ringInset,
        }}
        contentContainerStyle={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap,
            paddingTop: ringInset,
            paddingBottom: ringInset,
            paddingLeft: contentInset + ringInset,
            paddingRight: contentInset + ringInset,
          },
          contentContainerStyle,
        ]}
        testID={testID ? `${testID}-track` : undefined}
      >
        {children}
      </ScrollView>
      {IS_WEB && overflow.previous ? (
        <View pointerEvents="none" style={edgeStyle('left')} testID={testID ? `${testID}-fade-start` : undefined} />
      ) : null}
      {IS_WEB && overflow.next ? (
        <View pointerEvents="none" style={edgeStyle('right')} testID={testID ? `${testID}-fade-end` : undefined} />
      ) : null}
    </View>
  );
}

export const ChipRow = memo(ChipRowComponent);
ChipRow.displayName = 'ChipRow';
