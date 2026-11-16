import { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { Cover } from './Cover';
import { MUSIC_LIBRARY_MESSAGES } from './messages';
import { MUSIC_LIBRARY_CSS, MUSIC_LIBRARY_STYLE_ID, resolveMusicLibraryPaint } from './shared';
import type { RecentSearchEntry, RecentSearchesProps } from './types';

/**
 * The recent-searches list on an empty search page.
 *
 *   heading   title-3-semibold, 8 below
 *   row       8 padding, 8 radius · 48 cover (circle when `round`) · 12 ·
 *             title body-medium over a caption meta · the × button (32 round)
 *   hover     the row fills (colour only); the × stays visible so touch and
 *             keyboard reach it too
 *   clear     a secondary small `Button`, 16 below the list
 *
 * The row and its × are SIBLING controls — a remove button nested inside the
 * row's own button is not reachable as a control of its own.
 */

export function createRecentSearches({ List }: { List: typeof import('../list/List')['List'] }) {
  function RecentSearchesComponent({
    items,
    onItemPress,
    onRemove,
    onClearAll,
    title: titleProp,
    clearAllLabel: clearAllLabelProp,
    removeLabel: removeLabelProp,
    style,
    testID,
  }: RecentSearchesProps) {
    const { messages } = useMessages(MUSIC_LIBRARY_MESSAGES);
    const title = titleProp ?? messages.recent.title;
    const clearAllLabel = clearAllLabelProp ?? messages.recent.clearAll;
    const removeLabel =
      removeLabelProp ?? ((item: RecentSearchEntry) => messages.recent.remove(item.title));
    const theme = useTheme();
    useEffect(() => {
      adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
    }, []);
    const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);

    return (
      <View style={[{ gap: 8 }, style]} testID={testID}>
        {title ? (
          <Text variant="title-3-semibold" role="heading" style={{ color: paint.text }}>
            {title}
          </Text>
        ) : null}
        <List
          items={items.map((item) => ({
            id: item.id,
            testID: testID ? `${testID}-${item.id}` : undefined,
            label: [item.title, item.meta].filter(Boolean).join(', '),
            title: item.title,
            supporting: item.meta,
            leading: (
              <View pointerEvents="none" aria-hidden>
                <Cover
                  source={item.cover}
                  size={36}
                  round={item.round}
                  kind={item.round ? 'artist' : 'song'}
                  placeholder={paint.placeholder}
                  glyphColor={paint.textMuted}
                />
              </View>
            ),
            onPress: onItemPress ? () => onItemPress(item) : undefined,
            trailing: onRemove ? (
              <Button
                icon={RiCloseLine}
                iconOnly
                tone="neutral"
                appearance="plain"
                accessibilityLabel={removeLabel(item)}
                onPress={() => onRemove(item)}
                testID={testID ? `${testID}-${item.id}-remove` : undefined}
              />
            ) : undefined,
          }))}
        />

        {onClearAll && items.length > 0 ? (
          <Button
            size="sm"
            onPress={onClearAll}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
            testID={testID ? `${testID}-clear-all` : undefined}
            tone="neutral"
            appearance="outline"
          >
            {clearAllLabel}
          </Button>
        ) : null}
      </View>
    );
  }

  const RecentSearches = memo(RecentSearchesComponent);
  RecentSearches.displayName = 'RecentSearches';

  return RecentSearches;
}
