import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View, type TextStyle } from 'react-native';

import { GlyphButton } from '../button';
import { Chip, ChipRow } from '../chip';
import { webDataSet } from '../styles/web-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiBookShelfLine } from '../icons/remix/RiBookShelfLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiContractLeftRightLine } from '../icons/remix/RiContractLeftRightLine';
import { RiExpandLeftRightLine } from '../icons/remix/RiExpandLeftRightLine';
import { RiLayoutGridLine } from '../icons/remix/RiLayoutGridLine';
import { RiListUnordered } from '../icons/remix/RiListUnordered';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { LibraryItem } from './LibraryItem';
import {
  DEFAULT_LIBRARY_LABELS,
  IS_WEB,
  LIBRARY_FILTERS,
  MUSIC_LIBRARY_CSS,
  MUSIC_LIBRARY_STYLE_ID,
  filterLibraryItems,
  gridColumns,
  resolveMusicLibraryPaint,
  sortLibraryItems,
  useControllable,
} from './shared';
import type {
  LibraryFilter,
  LibraryPanelLabels,
  LibraryPanelProps,
  LibrarySort,
  LibraryView,
} from './types';

/**
 * The left-hand library.
 *
 *   surface   8 radius, the page background 3% toward the text colour (dark 5%)
 *   header    16/8 padding · the library glyph + "Your Library" (headline-bold;
 *             a rail toggle when `onCollapsedChange` is set) · + · expand toggle
 *   chips     × (clear, while a filter is on) · Playlists · Artists · Albums ·
 *             Podcasts · Audiobooks · Downloaded — `Chip`s (`xl`, 32 tall) in a
 *             `ChipRow`, scrolling sideways with an edge fade
 *   toolbar   search glyph (opens a 32 field in place) · "Recents" + the view
 *             glyph, opening one menu of sort and view radio rows
 *   list      `LibraryItem`s in the chosen view; grid columns from the width
 *   rail      `collapsed`: 72 wide, the library toggle, +, and covers alone
 *             (tooltips on web)
 *
 * Filter, Downloaded, sort, view and query are each controlled when their
 * prop is set and kept internally otherwise; the change callback fires either
 * way. Pinned entries always lead (`sortLibraryItems`).
 */

const SORTS: readonly LibrarySort[] = ['recents', 'recently-added', 'alphabetical', 'creator'];
const VIEWS: readonly LibraryView[] = ['compact', 'list', 'grid'];
const VIEW_GLYPH = { compact: RiMenuLine, list: RiListUnordered, grid: RiLayoutGridLine } as const;
const RAIL_WIDTH = 72;
const GRID_MIN_TILE = 132;
const SEARCH_TYPE = TYPE_SCALE['body-2-regular'];

const searchInputStyle: TextStyle = {
  flex: 1,
  minWidth: 0,
  fontFamily: SANS_FONT_FAMILY,
  fontSize: SEARCH_TYPE.fontSize,
  lineHeight: SEARCH_TYPE.lineHeight,
  fontWeight: SEARCH_TYPE.fontWeight,
  height: 32,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderWidth: 0,
  backgroundColor: 'transparent',
};

function mergeLabels(labels: LibraryPanelProps['labels']): LibraryPanelLabels {
  const d = DEFAULT_LIBRARY_LABELS;
  if (!labels) return d;
  return {
    ...d,
    ...labels,
    filter: { ...d.filter, ...labels.filter },
    sort: { ...d.sort, ...labels.sort },
    view: { ...d.view, ...labels.view },
    kind: { ...d.kind, ...labels.kind },
  };
}

function LibraryPanelComponent({
  items,
  filter: filterProp,
  onFilterChange,
  downloadedOnly: downloadedProp,
  onDownloadedOnlyChange,
  sort: sortProp,
  onSortChange,
  view: viewProp,
  onViewChange,
  query: queryProp,
  onQueryChange,
  filters = LIBRARY_FILTERS as LibraryFilter[],
  hideDownloadedFilter = false,
  collapsed = false,
  onCollapsedChange,
  expanded = false,
  onExpandedChange,
  onCreatePress,
  selectedId,
  nowPlayingId,
  paused = false,
  onItemPress,
  renderContextMenu,
  labels: labelsProp,
  emptyState,
  style,
  testID,
}: LibraryPanelProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MUSIC_LIBRARY_STYLE_ID, MUSIC_LIBRARY_CSS);
  }, []);
  const paint = useMemo(() => resolveMusicLibraryPaint(theme), [theme]);
  const labels = useMemo(() => mergeLabels(labelsProp), [labelsProp]);

  const [filter, setFilter] = useControllable<LibraryFilter | null>(filterProp, null, onFilterChange);
  const [downloadedOnly, setDownloadedOnly] = useControllable(downloadedProp, false, onDownloadedOnlyChange);
  const [sort, setSort] = useControllable<LibrarySort>(sortProp, 'recents', onSortChange);
  const [view, setView] = useControllable<LibraryView>(viewProp, 'list', onViewChange);
  const [query, setQuery] = useControllable(queryProp, '', onQueryChange);
  const [searchOpen, setSearchOpen] = useState(false);
  const [listWidth, setListWidth] = useState(0);
  const searchRef = useRef<TextInput>(null);
  const showSearch = searchOpen || query.length > 0;

  const shown = useMemo(
    () => sortLibraryItems(filterLibraryItems(items, { filter, downloadedOnly, query }), sort),
    [items, filter, downloadedOnly, query, sort],
  );

  const pid = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);
  const ViewGlyph = VIEW_GLYPH[view];

  const surfaceStyle: WebCssStyle = {
    backgroundColor: paint.surface,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 0,
  };

  const titleToggleStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: 8,
    flexShrink: 1,
    '--bloom-music-ring': paint.ring,
  };

  const sortTriggerStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 16,
    '--bloom-music-ring': paint.ring,
  };

  const renderItem = (item: (typeof shown)[number], variant: 'rail' | LibraryView) => (
    <LibraryItem
      key={item.id}
      item={item}
      variant={variant}
      selected={item.id === selectedId}
      nowPlaying={item.id === nowPlayingId}
      paused={paused}
      onPress={onItemPress}
      contextMenu={renderContextMenu?.(item)}
      kindLabels={labels.kind}
      testID={pid(`item-${item.id}`)}
    />
  );

  // -------------------------------------------------------------------------
  //  Rail
  // -------------------------------------------------------------------------

  if (collapsed) {
    return (
      <View
        role="region"
        accessibilityLabel={labels.title}
        style={[surfaceStyle, { width: RAIL_WIDTH }, style]}
        testID={testID}
      >
        <View style={{ alignItems: 'center', gap: 4, paddingTop: 12, paddingBottom: 8 }}>
          <GlyphButton
            accessibilityLabel={labels.expandRail}
            size={40}
            icon={RiBookShelfLine}
            glyphSize={24}
            color={paint.textMuted}
            hoverColor={paint.textMuted}
            fill="transparent"
            hoverFill={paint.hover}
            ring={paint.ring}
            onPress={onCollapsedChange ? () => onCollapsedChange(false) : undefined}
            testID={pid('rail-toggle')}
          />
          {onCreatePress ? (
            <GlyphButton
              accessibilityLabel={labels.create}
              size={40}
              icon={RiAddLine}
              glyphSize={22}
              color={paint.text}
              hoverColor={paint.text}
              fill={paint.hover}
              hoverFill={paint.selected}
              ring={paint.ring}
              onPress={onCreatePress}
              testID={pid('create')}
            />
          ) : null}
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          role="list"
        >
          {shown.map((item) => (
            <View key={item.id} role="listitem">
              {renderItem(item, 'rail')}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  //  Full panel
  // -------------------------------------------------------------------------

  const anyFilter = filter !== null || downloadedOnly;
  const columns = gridColumns(listWidth - 16, expanded ? GRID_MIN_TILE + 28 : GRID_MIN_TILE, 0);
  const tileWidth = listWidth > 0 ? Math.floor((listWidth - 16) / columns) : undefined;

  const titleContent = (
    <>
      <RiBookShelfLine width={24} height={24} fill={paint.textMuted} />
      <Text variant="headline-bold" numberOfLines={1} role="heading" style={{ color: paint.text }}>
        {labels.title}
      </Text>
    </>
  );

  return (
    <View role="region" accessibilityLabel={labels.title} style={[surfaceStyle, style]} testID={testID}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingTop: 12,
          paddingBottom: 4,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        {onCollapsedChange ? (
          <Pressable
            {...webDataSet({ bloomMusicFocusable: '' })}
            role="button"
            accessibilityLabel={labels.collapseRail}
            onPress={() => onCollapsedChange(true)}
            style={titleToggleStyle}
            testID={pid('rail-toggle')}
          >
            {titleContent}
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, flexShrink: 1 }}>
            {titleContent}
          </View>
        )}
        <View style={{ flexGrow: 1 }} />
        {onCreatePress ? (
          <GlyphButton
            accessibilityLabel={labels.create}
            size={32}
            icon={RiAddLine}
            glyphSize={20}
            color={paint.text}
            hoverColor={paint.text}
            fill={paint.hover}
            hoverFill={paint.selected}
            ring={paint.ring}
            onPress={onCreatePress}
            testID={pid('create')}
          />
        ) : null}
        {onExpandedChange ? (
          <GlyphButton
            accessibilityLabel={expanded ? labels.collapse : labels.expand}
            size={32}
            icon={expanded ? RiContractLeftRightLine : RiExpandLeftRightLine}
            glyphSize={20}
            color={paint.textMuted}
            hoverColor={paint.textMuted}
            fill="transparent"
            hoverFill={paint.hover}
            ring={paint.ring}
            onPress={() => onExpandedChange(!expanded)}
            testID={pid('expand')}
          />
        ) : null}
      </View>

      {/* Filter chips. The pills used to carry `{ paddingLeft: 12, paddingRight:
          12 }` over a base spelling it `paddingHorizontal` — inert on web, 12 on
          native. The `xl` rung is that padding, on both. */}
      <ChipRow
        contentInset={16 - 4}
        ringInset={4}
        // The row sits on the PANEL, not the page, and the row cannot know that.
        fadeColor={paint.surface}
        accessibilityLabel={labels.filters}
        style={{ marginTop: 8, marginBottom: 8 }}
        testID={pid('filters')}
      >
        {anyFilter ? (
          <Chip
            size="xl"
            onPress={() => {
              setFilter(null);
              setDownloadedOnly(false);
            }}
            startIcon={<RiCloseLine width={16} height={16} fill={theme.colors.textSecondary} />}
            accessibilityLabel={labels.clearFilters}
            testID={pid('filter-clear')}
          />
        ) : null}
        {filters.map((key) => (
          <Chip
            key={key}
            size="xl"
            selected={filter === key}
            onPress={() => setFilter(filter === key ? null : key)}
            accessibilityLabel={labels.filter[key]}
            testID={pid(`filter-${key}`)}
          >
            {labels.filter[key]}
          </Chip>
        ))}
        {hideDownloadedFilter ? null : (
          <Chip
            size="xl"
            selected={downloadedOnly}
            onPress={() => setDownloadedOnly(!downloadedOnly)}
            accessibilityLabel={labels.downloaded}
            testID={pid('filter-downloaded')}
          >
            {labels.downloaded}
          </Chip>
        )}
      </ChipRow>

      {/* Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 4,
          minHeight: 40,
        }}
      >
        {showSearch ? (
          <View
            style={{
              flex: 1,
              minWidth: 0,
              height: 32,
              borderRadius: 4,
              backgroundColor: paint.placeholder,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 8,
              paddingRight: 2,
            }}
          >
            <RiSearchLine width={16} height={16} fill={paint.textMuted} />
            <TextInput
              ref={searchRef}
              {...webDataSet({ bloomMusicInput: '' })}
              autoFocus={searchOpen && query.length === 0}
              value={query}
              onChangeText={setQuery}
              onBlur={() => {
                if (query.length === 0) setSearchOpen(false);
              }}
              {...(IS_WEB
                ? {
                    onKeyPress: (event: { nativeEvent: { key: string } }) => {
                      if (event.nativeEvent.key === 'Escape') {
                        setQuery('');
                        setSearchOpen(false);
                      }
                    },
                  }
                : null)}
              placeholder={labels.searchPlaceholder}
              placeholderTextColor={paint.textMuted}
              accessibilityLabel={labels.search}
              role="searchbox"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance={theme.isDark ? 'dark' : 'light'}
              style={[searchInputStyle, { color: paint.text }]}
              testID={pid('search-input')}
            />
            {query.length > 0 ? (
              <GlyphButton
                accessibilityLabel={labels.clearSearch}
                size={28}
                icon={RiCloseLine}
                glyphSize={16}
                color={paint.textMuted}
                hoverColor={paint.textMuted}
                fill="transparent"
                hoverFill={paint.selected}
                ring={paint.ring}
                onPress={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                testID={pid('search-clear')}
              />
            ) : null}
          </View>
        ) : (
          <>
            <GlyphButton
              accessibilityLabel={labels.search}
              size={32}
              icon={RiSearchLine}
              glyphSize={18}
              color={paint.textMuted}
              hoverColor={paint.textMuted}
              fill="transparent"
              hoverFill={paint.hover}
              ring={paint.ring}
              onPress={() => setSearchOpen(true)}
              testID={pid('search')}
            />
            <View style={{ flexGrow: 1 }} />
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild label={labels.sortAndView}>
            <Pressable
              {...webDataSet({ bloomMusicFocusable: '' })}
              role="button"
              accessibilityLabel={`${labels.sortAndView}: ${labels.sort[sort]}, ${labels.view[view]}`}
              style={sortTriggerStyle}
              testID={pid('sort')}
            >
              <Text variant="body-2-medium" numberOfLines={1} style={{ color: paint.textMuted }}>
                {labels.sort[sort]}
              </Text>
              <ViewGlyph width={16} height={16} fill={paint.textMuted} />
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" label={labels.sortAndView} minWidth={200} testID={pid('sort-menu')}>
            <DropdownMenuLabel>{labels.sortBy}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={(next) => setSort(next as LibrarySort)}>
              {SORTS.map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={key}
                  indicator={<RiCheckLine width={16} height={16} fill={paint.accent} />}
                  indicatorPosition="trailing"
                  testID={pid(`sort-${key}`)}
                >
                  {labels.sort[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{labels.viewAs}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={view} onValueChange={(next) => setView(next as LibraryView)}>
              {VIEWS.map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={key}
                  indicator={<RiCheckLine width={16} height={16} fill={paint.accent} />}
                  indicatorPosition="trailing"
                  testID={pid(`view-${key}`)}
                >
                  {labels.view[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 8 }}
        onLayout={(event) => setListWidth(Math.floor(event.nativeEvent.layout.width))}
        testID={pid('list')}
      >
        {shown.length === 0 ? (
          <View style={{ paddingTop: 24, paddingBottom: 24, alignItems: 'center' }}>
            {emptyState ?? (
              <Text variant="body-2-regular" style={{ color: paint.textMuted }}>
                {labels.empty}
              </Text>
            )}
          </View>
        ) : view === 'grid' ? (
          <View role="list" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {shown.map((item) => (
              <View key={item.id} role="listitem" style={tileWidth !== undefined ? { width: tileWidth } : undefined}>
                {renderItem(item, 'grid')}
              </View>
            ))}
          </View>
        ) : (
          <View role="list">
            {shown.map((item) => (
              <View key={item.id} role="listitem">
                {renderItem(item, view)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export const LibraryPanel = memo(LibraryPanelComponent);
LibraryPanel.displayName = 'LibraryPanel';
