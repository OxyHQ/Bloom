import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { RiMapPinLine } from '../icons/remix/RiMapPinLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { DISABLED_OPACITY } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { STAY_SEARCH_TILE_RADIUS, STAY_SEARCH_TILE_SIZE } from './constants';
import { useStaySearchPalette } from './palette';
import type { DestinationSuggestionsProps } from './types';

/**
 * Destination rows for a `StaySearchPanel`: a 48px rounded icon tile (radius
 * 12, neutral fill), the title (body-medium) over an optional description
 * (body-2-regular, secondary). Hover and the arrow keys move one highlight;
 * a press or Enter selects.
 *
 * A `listbox` of `option`s. The list takes focus (web) and owns the arrow
 * keys; the rows stay out of the tab order.
 *
 * A row can be `disabled` — "Use my location" while location permission is
 * off. It stays in the list rather than disappearing, because a row that
 * vanishes teaches nothing: it dims to `DISABLED_OPACITY`, carries
 * `aria-disabled`, answers no press or Enter, is never highlighted by hover, and
 * the arrow keys step OVER it. `disabledReason` replaces its description and is
 * read after the title, so the row says why.
 */

const IS_WEB = Platform.OS === 'web';
const ICON_SIZE = 22;

const STYLE_ID = 'bloom-destination-suggestions-web-css';
const CSS = `
[data-bloom-destination-list] {
  outline: none;
  border-radius: 20px;
}
[data-bloom-destination-list]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-destination-ring, currentColor);
}
`;

/**
 * The next row the arrow keys land on, stepping OVER every disabled one and
 * wrapping once. `-1` when every row is disabled — the highlight then stays
 * where it is rather than landing on a row that answers nothing. Pure.
 */
export function nextSelectable(
  items: readonly { disabled?: boolean }[],
  from: number,
  step: 1 | -1,
): number {
  const count = items.length;
  if (count === 0) return -1;
  // From "nothing highlighted", ArrowDown starts at the top and ArrowUp at the
  // bottom, which is what the list did before any row could be disabled.
  const start = from < 0 ? (step === 1 ? 0 : count - 1) : (from + step + count) % count;
  for (let i = 0; i < count; i++) {
    const index = (start + step * i + count * count) % count;
    if (!items[index]?.disabled) return index;
  }
  return -1;
}

function DestinationSuggestionsComponent({
  items,
  onSelect,
  heading,
  highlightedIndex,
  onHighlightedIndexChange,
  accessibilityLabel,
  style,
  testID,
}: DestinationSuggestionsProps) {
  const theme = useTheme();
  const palette = useStaySearchPalette();
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [internal, setInternal] = useState(-1);
  const current = highlightedIndex ?? internal;

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);

  const highlight = useCallback(
    (index: number) => {
      if (highlightedIndex === undefined) setInternal(index);
      onHighlightedIndexChange?.(index);
    },
    [highlightedIndex, onHighlightedIndexChange],
  );

  const onKeyDown = (e: { key: string; preventDefault: () => void }) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = nextSelectable(items, current, 1);
      if (next >= 0) highlight(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = nextSelectable(items, current, -1);
      if (next >= 0) highlight(next);
    } else if (e.key === 'Enter' && current >= 0 && current < items.length) {
      e.preventDefault();
      const item = items[current]!;
      if (!item.disabled) onSelect(item);
    }
  };

  // React Native's `Role` has no `listbox`, and `onKeyDown` is a DOM handler;
  // react-native-web passes both through, so they travel as web-only props.
  const webListProps: Record<string, unknown> = IS_WEB ? { role: 'listbox', tabIndex: 0, onKeyDown } : {};
  const listStyle: WebCssStyle = { gap: 2, '--bloom-destination-ring': accent[500] };
  const listName = accessibilityLabel ?? heading ?? 'Destinations';

  return (
    <View style={style}>
      {heading ? (
        <Text
          variant="caption-1-semibold"
          style={{ color: palette.textSecondary, paddingLeft: 12, paddingTop: 4, paddingBottom: 8 }}
        >
          {heading}
        </Text>
      ) : null}
      <View
        accessibilityLabel={listName}
        {...webListProps}
        {...webDataSet({ bloomDestinationList: '' })}
        testID={testID}
        style={listStyle}
      >
        {items.map((item, index) => {
          const Icon = item.icon ?? RiMapPinLine;
          const disabled = item.disabled === true;
          const selected = index === current && !disabled;
          const secondLine = disabled ? (item.disabledReason ?? item.description) : item.description;
          return (
            <Pressable
              key={item.id}
              role="option"
              accessibilityLabel={secondLine ? `${item.title}, ${secondLine}` : item.title}
              aria-selected={selected}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              focusable={false}
              onPress={() => onSelect(item)}
              onHoverIn={() => {
                if (!disabled) highlight(index);
              }}
              testID={testID ? `${testID}-${index}` : undefined}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 16,
                opacity: disabled ? DISABLED_OPACITY : 1,
                backgroundColor: selected ? palette.rowHighlight : 'transparent',
              }}
            >
              <View
                style={{
                  width: STAY_SEARCH_TILE_SIZE,
                  height: STAY_SEARCH_TILE_SIZE,
                  borderRadius: STAY_SEARCH_TILE_RADIUS,
                  backgroundColor: palette.tile,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon width={ICON_SIZE} height={ICON_SIZE} fill={palette.text} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                  {item.title}
                </Text>
                {secondLine ? (
                  <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
                    {secondLine}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const DestinationSuggestions = memo(DestinationSuggestionsComponent);
DestinationSuggestions.displayName = 'DestinationSuggestions';
