import React, { useState } from 'react';
import { View } from 'react-native';

import { TripCard } from '../../src/booking';
import { Button } from '../../src/button';
import { SavedSearchCard } from '../../src/home-search';
import { RiChat3Line, RiMapPinLine } from '../../src/icons/remix';
import { WishlistCard } from '../../src/listing-card';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
import { SAVED_SEARCHES, TRIPS, WISHLISTS } from './data';
import { HousingFooter, HousingFrame, HousingHeader, PageColumn, useHousingLayout, useHousingNav } from './HousingHeader';

const noop = () => undefined;

function Section({ title, description, children, testID }: { title: string; description?: string; children: React.ReactNode; testID?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 16 }} testID={testID}>
      <View style={{ gap: 2 }}>
        <Text role="heading" aria-level={2} variant="title-3-semibold" style={{ color: theme.colors.text }}>
          {title}
        </Text>
        {description ? (
          <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Saved searches with their alerts, wishlists, and upcoming trips and swaps. */
export function SavedPage() {
  const theme = useTheme();
  const go = useHousingNav();
  const { width, md, lg, gutter } = useHousingLayout();
  const [searches, setSearches] = useState(SAVED_SEARCHES);

  const column = Math.min(width, 1120 + gutter * 2) - gutter * 2;
  const wishlistColumns = lg ? 4 : md ? 3 : 2;
  const wishlistGap = 16;
  const wishlistWidth = Math.floor((column - wishlistGap * (wishlistColumns - 1)) / wishlistColumns);

  return (
    <HousingFrame testID="housing-saved">
      <HousingHeader />
      <PageColumn maxWidth={1120} style={{ paddingTop: md ? 32 : 20, paddingBottom: 64, gap: 40 }}>
        <Text role="heading" aria-level={1} variant="title-1-semibold" style={{ color: theme.colors.text }}>
          Saved
        </Text>

        <View style={{ flexDirection: lg ? 'row' : 'column', gap: 40, alignItems: 'flex-start' }}>
          <View style={{ flex: lg ? 1 : undefined, width: lg ? undefined : '100%', minWidth: 0 }}>
            <Section title="Saved searches" description="We let you know when new homes match." testID="housing-saved-searches">
              <View style={{ gap: 12 }}>
                {searches.map(({ id, ...search }) => (
                  <SavedSearchCard
                    key={id}
                    {...search}
                    onPress={() => go('explore')}
                    onEdit={noop}
                    onDelete={() => setSearches((list) => list.filter((s) => s.id !== id))}
                    testID={`housing-saved-search-${id}`}
                  />
                ))}
              </View>
            </Section>
          </View>
          <View style={{ flex: lg ? 1 : undefined, width: lg ? undefined : '100%', minWidth: 0 }}>
            <Section title="Upcoming trips and swaps" testID="housing-trips">
              <View style={{ gap: 12 }}>
                {TRIPS.map(({ id, ...trip }) => (
                  <TripCard
                    key={id}
                    {...trip}
                    onPress={() => go(id === 'swap' ? 'swap' : 'stay')}
                    actions={
                      <>
                        <Button variant="secondary" size="small" leadingIcon={RiChat3Line} onPress={noop}>
                          Message
                        </Button>
                        <Button variant="ghost" size="small" leadingIcon={RiMapPinLine} onPress={noop}>
                          Directions
                        </Button>
                      </>
                    }
                  />
                ))}
              </View>
            </Section>
          </View>
        </View>

        <Section title="Wishlists" testID="housing-wishlists">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wishlistGap }}>
            {WISHLISTS.map(({ id, ...list }) => (
              <WishlistCard key={id} {...list} onPress={() => go('explore')} style={{ width: wishlistWidth }} />
            ))}
          </View>
        </Section>
      </PageColumn>
      <HousingFooter />
    </HousingFrame>
  );
}
