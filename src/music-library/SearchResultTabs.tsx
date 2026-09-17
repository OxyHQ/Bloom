import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { resolveAccentColors } from '../theme/accent-colors';
import { pressedSurface } from '../theme/press-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { IS_WEB, MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID, resolveMusicLibraryPaint } from './shared';
import type { SearchResultTab, SearchResultTabsProps } from './types';

/**
 * The result-type pills under the search field: "All, Songs, Artists, …".
 *
 *   pill      32 tall, full pill, 12 side padding, 8 apart, body-medium
 *   rest      the neutral subtle pair (`resolveAccentColors(default, subtle)`),
 *             the same paint an unselected `Chip` takes
 *   selected  the primary subtle pair, as a selected `Chip`
 *   hover     the pressed surface of the rest pair (colour only)
 *
 * The row scrolls sideways (hidden scrollbar on web) when it does not fit.
 *
 * Semantics: `role="tablist"`, each pill a `tab` with `aria-selected`. On web
 * the row is one tab stop (the selected pill); ArrowLeft / ArrowRight / Home /
 * End move focus, Enter and Space select.
 */

const PILL_HEIGHT = 32;

interface PillProps {
  tab: SearchResultTab;
  selected: boolean;
  tabbable: boolean;
  onSelect: (value: string) => void;
  onKey: (value: string, event: { key: string; preventDefault: () => void }) => void;
  register: (value: string, node: View | null) => void;
  testID?: string;
}

function Pill({ tab, selected, tabbable, onSelect, onKey, register, testID }: PillProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const colors = useMemo(
    () => resolveAccentColors(theme.colors, selected ? 'primary' : 'default', 'subtle'),
    [theme.colors, selected],
  );
  const hoverFill = useMemo(
    () => pressedSurface(theme.colors, colors.background, colors.foreground),
    [theme.colors, colors],
  );
  const style: WebCssStyle = {
    height: PILL_HEIGHT,
    borderRadius: borderRadius.full,
    paddingLeft: 12,
    paddingRight: 12,
    justifyContent: 'center',
    backgroundColor: hovered ? hoverFill : colors.background,
    flexShrink: 0,
    '--bloom-music-ring': paint.ring,
  };
  return (
    <Pressable
      ref={(node) => register(tab.value, node)}
      {...webDataSet({ bloomMusicFocusable: '' })}
      {...(IS_WEB
        ? {
            tabIndex: tabbable ? 0 : -1,
            onKeyDown: (event: { key: string; preventDefault: () => void }) => onKey(tab.value, event),
          }
        : null)}
      role="tab"
      accessibilityLabel={tab.label}
      aria-selected={selected}
      onPress={() => onSelect(tab.value)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}
      testID={testID}
    >
      <Text variant="body-medium" numberOfLines={1} style={{ color: colors.foreground }}>
        {tab.label}
      </Text>
    </Pressable>
  );
}

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
    <ScrollView
      {...webDataSet({ bloomMusicScrollX: '' })}
      horizontal
      showsHorizontalScrollIndicator={false}
      role="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexGrow: 0 }, style]}
      contentContainerStyle={{ gap: 8, paddingTop: 2, paddingBottom: 2 }}
      testID={testID}
    >
      {tabs.map((tab, index) => (
        <Pill
          key={tab.value}
          tab={tab}
          selected={tab.value === value}
          tabbable={hasSelection ? tab.value === value : index === 0}
          onSelect={onValueChange}
          onKey={onKey}
          register={register}
          testID={testID ? `${testID}-${tab.value}` : undefined}
        />
      ))}
    </ScrollView>
  );
}

export const SearchResultTabs = memo(SearchResultTabsComponent);
SearchResultTabs.displayName = 'SearchResultTabs';
