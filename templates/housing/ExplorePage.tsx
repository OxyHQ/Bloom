import React, { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { CategoryBar } from '../../src/category-bar';
import { useDialogControl } from '../../src/dialog';
import { SaveSearchButton, type HomeSearchMode } from '../../src/home-search';
import { RiListUnordered, RiMap2Line } from '../../src/icons/remix';
import { ListingCard, ListingCardGrid } from '../../src/listing-card';
import { MapAreaCircle, MapListingPreview, MapPriceMarker, type MapMarkerState } from '../../src/map-marker';
import { EnergyBadge } from '../../src/property-insights';
import { FilterTriggerButton } from '../../src/stay-filters';
import { WEB_POSITION_FIXED, webViewportHeightMinus, type WebCssStyle } from '../../src/styles/web-view-style';
import { Z_INDEX } from '../../src/styles/z-index';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import {
  CATEGORIES,
  HOMES,
  LISTING_PAGE_FOR_MODE,
  RESULT_HEADINGS,
  appliedFilterCount,
  noFilters,
  type Filters,
  type Home,
} from './data';
import { FiltersDialog } from './HousingFilters';
import {
  HousingFooter,
  HousingFrame,
  HousingHeader,
  IS_WEB,
  PageColumn,
  useHousingLayout,
  useHousingNav,
  webSticky,
} from './HousingHeader';
import { DesktopModeTabs, DesktopSearchBar, MobileModeTabs, MobileSearch, useHomeSearch } from './HousingSearch';

// ---------------------------------------------------------------------------
//  Cards
// ---------------------------------------------------------------------------

function cardProps(home: Home) {
  const { id: _id, mode: _mode, short: _short, map: _map, saved: _saved, label, energy, approximate: _approximate, ...card } = home;
  return {
    ...card,
    badge: energy ? <EnergyBadge rating={energy} size="small" /> : label,
  };
}

function useFavourites() {
  const [saved, setSaved] = useState<Set<string>>(() => new Set(HOMES.filter((h) => h.saved).map((h) => h.id)));
  const toggle = (id: string, next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  return { saved, toggle };
}

type Favourites = ReturnType<typeof useFavourites>;

function Results({ homes, favourites, columns }: { homes: Home[]; favourites: Favourites; columns?: number }) {
  const go = useHousingNav();
  return (
    <ListingCardGrid columns={columns} testID="housing-results">
      {homes.map((home) => (
        <ListingCard
          key={home.id}
          {...cardProps(home)}
          favorite={favourites.saved.has(home.id)}
          onFavoriteChange={(next) => favourites.toggle(home.id, next)}
          onPress={() => go(LISTING_PAGE_FOR_MODE[home.mode])}
          testID={`housing-card-${home.id}`}
        />
      ))}
    </ListingCardGrid>
  );
}

// ---------------------------------------------------------------------------
//  The mock map
// ---------------------------------------------------------------------------

const centred = (x: number, y: number) =>
  ({ position: 'absolute', left: x, top: y, transform: [{ translateX: '-50%' }, { translateY: '-50%' }] }) as const;

function MockMap({
  homes,
  favourites,
  style,
}: {
  homes: Home[];
  favourites: Favourites;
  style?: WebCssStyle;
}) {
  const theme = useTheme();
  const go = useHousingNav();
  const { neutral: n } = resolveButtonRamps(theme);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const road = theme.isDark ? n[800] : n[50];
  const water = theme.isDark ? n[700] : n[300];
  const current = homes.find((home) => home.id === active);
  const area = homes.find((home) => home.approximate);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const open = (id: string) => {
    if (active && active !== id) setVisited((v) => new Set(v).add(active));
    setActive(id);
  };

  const state = (id: string): MapMarkerState => (active === id ? 'active' : visited.has(id) ? 'visited' : 'default');
  const previewWidth = Math.min(327, size.width - 24);
  const { width: w, height: h } = size;

  return (
    <View
      onLayout={onLayout}
      style={[
        { borderRadius: 16, overflow: 'hidden', backgroundColor: theme.isDark ? n[900] : n[200], position: 'relative' },
        style,
      ]}
      accessibilityLabel="Map of results"
      testID="housing-map"
    >
      {w > 0 ? (
        <>
          {/* A river and a park, then the streets. */}
          <View style={{ position: 'absolute', left: -40, right: -40, top: h * 0.56, height: 36, backgroundColor: water, transform: [{ rotate: '-8deg' }] }} />
          <View style={{ position: 'absolute', left: w * 0.08, top: h * 0.08, width: w * 0.22, height: h * 0.18, borderRadius: 12, backgroundColor: theme.isDark ? n[800] : n[300], opacity: 0.6 }} />
          {[0.18, 0.4, 0.66, 0.86].map((top) => (
            <View key={`h${top}`} style={{ position: 'absolute', left: 0, right: 0, top: h * top, height: 6, backgroundColor: road }} />
          ))}
          {[0.14, 0.36, 0.58, 0.8].map((left) => (
            <View key={`v${left}`} style={{ position: 'absolute', top: 0, bottom: 0, left: w * left, width: 6, backgroundColor: road }} />
          ))}
          {area ? (
            <View style={centred(area.map.x * w, area.map.y * h)}>
              <MapAreaCircle radius={56} accessibilityLabel={`Approximate location of ${area.title}`} testID="housing-map-area" />
            </View>
          ) : null}
          {homes.map((home) => (
            <View key={home.id} style={[centred(home.map.x * w, home.map.y * h), { zIndex: active === home.id ? 2 : 1 }]}>
              <MapPriceMarker
                price={home.short}
                size={w < 520 ? 'compact' : 'default'}
                saved={favourites.saved.has(home.id)}
                state={state(home.id)}
                onPress={() => open(home.id)}
                accessibilityLabel={`${home.short}, ${home.title}`}
                testID={`housing-marker-${home.id}`}
              />
            </View>
          ))}
          {current ? (
            // Under its marker, or over it when the marker sits low: the map can be
            // taller than what is on screen, so never pin it to the map's bottom.
            <View
              style={{
                position: 'absolute',
                left: (w - previewWidth) / 2,
                top: current.map.y < 0.5 ? current.map.y * h + 28 : 16,
                zIndex: 3,
              }}
            >
              <MapListingPreview
                layout={w < 520 ? 'compact' : 'vertical'}
                width={previewWidth}
                image={current.photos[0]}
                title={current.title}
                subtitle={current.address ?? current.subtitle}
                rating={current.rating}
                reviewCount={current.reviewCount}
                offerings={current.offerings}
                priceLines={current.priceLines}
                facts={current.facts}
                favorite={favourites.saved.has(current.id)}
                onFavoriteChange={(next) => favourites.toggle(current.id, next)}
                onClose={() => {
                  setVisited((v) => new Set(v).add(current.id));
                  setActive(null);
                }}
                onPress={() => go(LISTING_PAGE_FOR_MODE[current.mode])}
                testID="housing-map-preview"
              />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  The page
// ---------------------------------------------------------------------------

export interface ExplorePageProps {
  initialMode?: HomeSearchMode;
  initialMap?: boolean;
}

/**
 * The marketplace: the header with the mode tabs and the search bar, the
 * category strip with filters and "Save search", the results grid, and a
 * floating pill that switches to a split list and map.
 */
export function ExplorePage({ initialMode = 'rent', initialMap = false }: ExplorePageProps) {
  const theme = useTheme();
  const { md, lg, xl } = useHousingLayout();
  const search = useHomeSearch(initialMode);
  const { mode } = search;
  const favourites = useFavourites();
  const filtersControl = useDialogControl();
  const [filters, setFilters] = useState<Record<HomeSearchMode, Filters>>(() => ({
    rent: noFilters('rent'),
    buy: noFilters('buy'),
    stays: noFilters('stays'),
    swap: noFilters('swap'),
  }));
  const [category, setCategory] = useState<Record<HomeSearchMode, string>>({ rent: 'all', buy: 'all', stays: 'trending', swap: 'all' });
  const [savedSearch, setSavedSearch] = useState<Record<HomeSearchMode, boolean>>({ rent: false, buy: true, stays: false, swap: false });
  const [showMap, setShowMap] = useState(initialMap);

  const homes = useMemo(() => HOMES.filter((home) => home.mode === mode), [mode]);
  const filterCount = appliedFilterCount(mode, filters[mode]);
  const openFilters = () => filtersControl.open();

  const saveButton = (
    <SaveSearchButton
      saved={savedSearch[mode]}
      onSavedChange={(saved) => setSavedSearch((s) => ({ ...s, [mode]: saved }))}
      testID="housing-save-search"
    />
  );

  const toolbar = (
    <View
      style={[
        { zIndex: Z_INDEX.raised, backgroundColor: theme.colors.background },
        webSticky(0),
      ]}
      testID="housing-toolbar"
    >
      <PageColumn>
        <CategoryBar
          items={CATEGORIES[mode]}
          value={category[mode]}
          onValueChange={(key) => setCategory((c) => ({ ...c, [mode]: key }))}
          accessibilityLabel="Categories"
          trailing={
            md ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FilterTriggerButton count={filterCount} onPress={openFilters} testID="housing-filters-trigger" />
                {lg ? saveButton : null}
              </View>
            ) : undefined
          }
          testID="housing-categories"
        />
      </PageColumn>
    </View>
  );

  // The split view's map sits under the sticky category strip (about 88 tall).
  const mapTop = 104;
  const split = showMap && lg;

  return (
    <HousingFrame testID="housing-explore">
      <HousingHeader
        tabs={<DesktopModeTabs search={search} />}
        search={<DesktopSearchBar search={search} />}
        compact={<MobileSearch search={search} onFilterPress={md ? undefined : openFilters} />}
        compactBelow={<MobileModeTabs search={search} />}
      />
      {toolbar}

      <PageColumn maxWidth={split ? 1920 : 1280} style={{ paddingTop: 16, paddingBottom: 96, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 36 }}>
          <Text variant="headline-semibold" style={{ color: theme.colors.text, flexShrink: 1 }} role="heading" aria-level={1}>
            {RESULT_HEADINGS[mode]}
          </Text>
          {lg ? null : saveButton}
        </View>

        {split ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Results homes={homes} favourites={favourites} columns={xl ? 2 : 1} />
            </View>
            <MockMap
              homes={homes}
              favourites={favourites}
              style={{
                width: '48%',
                ...webSticky(mapTop),
                height: IS_WEB ? webViewportHeightMinus(mapTop + 24) : 640,
              }}
            />
          </View>
        ) : showMap ? (
          <MockMap
            homes={homes}
            favourites={favourites}
            style={{ width: '100%', height: IS_WEB ? webViewportHeightMinus(300) : 560, minHeight: 420 }}
          />
        ) : (
          <Results homes={homes} favourites={favourites} />
        )}
      </PageColumn>

      <HousingFooter maxWidth={split ? 1920 : 1280} />

      {/* The list / map switch floats over the results. */}
      <View
        pointerEvents="box-none"
        style={{
          position: IS_WEB ? WEB_POSITION_FIXED : 'absolute',
          left: 0,
          right: 0,
          bottom: 24,
          alignItems: 'center',
          zIndex: Z_INDEX.floating,
        }}
      >
        <Button
          variant="inverse"
          size="large"
          leadingIcon={showMap ? RiListUnordered : RiMap2Line}
          onPress={() => setShowMap((s) => !s)}
          testID="housing-map-toggle"
        >
          {showMap ? 'Show list' : 'Show map'}
        </Button>
      </View>

      <FiltersDialog
        control={filtersControl}
        mode={mode}
        applied={filters[mode]}
        onApply={(next) => setFilters((f) => ({ ...f, [mode]: next }))}
      />
    </HousingFrame>
  );
}
