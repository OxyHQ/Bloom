/**
 * `Rail` — a full-height, sticky desktop sidebar navigation column.
 *
 * The vertical sibling of `TabBar`: a fixed set of destinations, one active
 * at a time, a selection callback. It carries no router of its own (a
 * consumer resolves `activeId` from its own routing state, the same shape
 * `bottom-nav`-style consumers already compute for `TabBar`'s `activeIndex`)
 * and no crossfade animation — a rail is a static column a user picks a
 * destination from, not a pill that slides between taps, so each item simply
 * swaps its icon and label styling when it becomes active.
 *
 * ## Sticky positioning
 *
 * On WEB, `Rail` pins itself to the viewport with `position: sticky; top: 0;
 * height: 100vh` so it stays full-height and in view while a document-scroll
 * shell (no fixed-height app container, the window/document is the real
 * scroller) scrolls the content beside it. This is load-bearing, not
 * cosmetic: a plain flow sibling in that layout scrolls away with the
 * document past the height of one screen. Native has no document scroll to
 * defend against — a `Rail` there is already a plain flex sibling that
 * reserves its own space — so the sticky style is web-only, applied inline
 * behind a `Platform.OS` check rather than a `.web` file fork, matching
 * `Label`/`Kbd`'s single-file convention for a component whose platform
 * delta is one conditional style object, not a different render tree.
 *
 * Two RN/react-native-web gaps meet in that one style object, and they get two
 * different escape hatches on purpose:
 *
 *  - `position: 'sticky'` has no member on RN's narrow `ViewStyle['position']`
 *    union (`'absolute' | 'relative' | 'static'`), so it routes through
 *    `WEB_POSITION_STICKY`, Bloom's shared constant for this exact gap (see
 *    `styles/web-view-style.ts`) — the one documented crossing point for
 *    `position`, same as `WEB_POSITION_FIXED`.
 *  - `height: '100vh'` hits the same shape of gap — RN's `DimensionValue` is
 *    `number | 'auto' | \`${number}%\` | AnimatedNode | null`, no bare CSS unit
 *    string — but `'100vh'` has no OTHER consumer in the package the way
 *    `'fixed'`/`'sticky'` do, so it is a local, single-property
 *    `as ViewStyle['height']` cast rather than a new shared constant. Gated by
 *    `web-css-style.test.ts`'s `ALLOWED` ledger, which pins exactly this cast
 *    in this file rather than letting an inline `as ViewStyle` cast come back
 *    unnoticed anywhere else.
 */
import React, { memo } from 'react';
import { Platform, ScrollView, type ViewStyle } from 'react-native';

import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { WEB_POSITION_STICKY } from '../styles/web-view-style';
import { Text } from '../typography';
import type { RailProps } from './types';

const webStickyStyle: ViewStyle | undefined =
  Platform.OS === 'web'
    ? {
        position: WEB_POSITION_STICKY,
        top: 0,
        alignSelf: 'flex-start',
        overflow: 'hidden',
        height: '100vh' as ViewStyle['height'],
      }
    : undefined;

const DEFAULT_WIDTH = 80;

const RailComponent: React.FC<RailProps> = ({
  items,
  activeId,
  onSelect,
  width = DEFAULT_WIDTH,
  style,
  testID,
}) => {
  return (
    <StyledView
      testID={testID}
      className="h-full shrink-0"
      style={[webStickyStyle, { width }, style]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 24,
          gap: 8,
        }}
      >
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <StyledPressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              // `aria-selected` is the state ARIA defines for `role="tab"`, and
              // the one spelling react-native-web actually reads —
              // `accessibilityState` reaches native only. Same pairing
              // `TabBarButtonBody` uses. Gate: `aria-state-source-census.test.ts`.
              aria-selected={active}
              onPress={() => onSelect(item.id)}
              className="min-h-[64px] items-center rounded-[20px] py-2 active:opacity-60"
              style={{ flexDirection: 'column', gap: 5, paddingHorizontal: 0 }}
            >
              <StyledView
                className={`h-8 w-12 items-center justify-center rounded-full ${active ? 'bg-primary-subtle' : ''}`}
              >
                {active ? (item.activeIcon ?? item.icon) : item.icon}
              </StyledView>
              <Text
                className={`max-w-full text-center text-[10px] ${active ? 'font-medium text-primary-text' : 'text-muted-foreground'}`}
              >
                {item.label}
              </Text>
            </StyledPressable>
          );
        })}
      </ScrollView>
    </StyledView>
  );
};

export const Rail = memo(RailComponent);
Rail.displayName = 'Rail';
