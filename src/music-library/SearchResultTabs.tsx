import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

import { Chip, ChipRow } from '../chip';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID } from './shared';
import type { SearchResultTabsProps } from './types';

/**
 * The result-type pills under the search field: "All, Songs, Artists, …".
 *
 * Each pill is a `Chip` on the `xl` rung (32 tall, full pill, 12 side padding,
 * body-medium) — the rung this row used to draw by hand, with its own copy of
 * the accent recipe, its own hover fill and its own focus-ring variable. Rest
 * is the neutral subtle pair and selected the brand one, which is what
 * `Chip`'s `selected` already means.
 *
 * The row is a `ChipRow`, so it scrolls sideways with an edge fade rather than
 * a pill stopping mid-glyph at the edge.
 *
 * Semantics: `role="tablist"`, each pill a `tab` with `aria-selected` —
 * `Chip`'s `role="tab"`, which picks `aria-selected` over `aria-pressed`
 * because `aria-pressed` on a tab is invalid. On web the row is one tab stop
 * (the selected pill); ArrowLeft / ArrowRight / Home / End move focus, Enter
 * and Space select.
 */

const IS_WEB = Platform.OS === 'web';

function SearchResultTabsComponent({
  tabs,
  value,
  onValueChange,
  accessibilityLabel = 'Result types',
  style,
  testID,
}: SearchResultTabsProps) {
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const nodes = useRef(new Map<string, View>());
  const register = useCallback((key: string, node: View | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
  }, []);

  const onKey = useCallback(
    (key: string, event: { key: string; preventDefault: () => void }) => {
      const index = tabs.findIndex((tab) => tab.value === key);
      let target = -1;
      switch (event.key) {
        case 'ArrowRight':
          target = Math.min(tabs.length - 1, index + 1);
          break;
        case 'ArrowLeft':
          target = Math.max(0, index - 1);
          break;
        case 'Home':
          target = 0;
          break;
        case 'End':
          target = tabs.length - 1;
          break;
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          onValueChange(key);
          return;
        default:
          return;
      }
      event.preventDefault();
      const next = tabs[target];
      if (next) nodes.current.get(next.value)?.focus();
    },
    [tabs, onValueChange],
  );

  const hasSelection = tabs.some((tab) => tab.value === value);

  return (
    <ChipRow role="tablist" accessibilityLabel={accessibilityLabel} style={style} testID={testID}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        const tabbable = hasSelection ? selected : index === 0;
        return (
          <Chip
            key={tab.value}
            ref={(node: View | null) => register(tab.value, node)}
            size="xl"
            role="tab"
            selected={selected}
            accessibilityLabel={tab.label}
            onPress={() => onValueChange(tab.value)}
            {...(IS_WEB
              ? { tabIndex: tabbable ? 0 : -1, onKeyDown: (event: { key: string; preventDefault: () => void }) => onKey(tab.value, event) }
              : null)}
            testID={testID ? `${testID}-${tab.value}` : undefined}
          >
            {tab.label}
          </Chip>
        );
      })}
    </ChipRow>
  );
}

export const SearchResultTabs = memo(SearchResultTabsComponent);
SearchResultTabs.displayName = 'SearchResultTabs';
