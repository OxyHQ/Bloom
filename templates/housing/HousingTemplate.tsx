import React, { useCallback, useState } from 'react';

import type { HomeSearchMode } from '../../src/home-search';
import { EvictionsPage } from './EvictionsPage';
import { ExplorePage } from './ExplorePage';
import { HousingNavProvider, HousingPageProvider, IS_WEB, type HousingPage } from './HousingHeader';
import { RentListingPage, SaleListingPage, StayListingPage, SwapListingPage } from './ListingPages';
import { MyHomePage } from './MyHomePage';
import { PublishPage } from './PublishPage';
import { SavedPage } from './SavedPage';

export interface HousingTemplateProps {
  /** The page shown first; the header, account menu and cards move between pages. */
  initialPage?: HousingPage;
  /** The Explore page's search mode. */
  initialMode?: HomeSearchMode;
  /** Opens Explore in the list-and-map view. */
  initialMap?: boolean;
}

/**
 * The housing app template: one page at a time, with a tiny in-template
 * router so the logo, the account menu, the cards and the sidebar can move
 * between them.
 */
export function HousingTemplate({ initialPage = 'explore', initialMode, initialMap }: HousingTemplateProps) {
  const [page, setPage] = useState<HousingPage>(initialPage);
  const go = useCallback((next: HousingPage) => {
    setPage(next);
    if (IS_WEB) (globalThis as { scrollTo?: (x: number, y: number) => void }).scrollTo?.(0, 0);
  }, []);

  return (
    <HousingNavProvider value={go}>
      <HousingPageProvider value={page}>
      {page === 'explore' ? <ExplorePage initialMode={initialMode} initialMap={initialMap} /> : null}
      {page === 'rent' ? <RentListingPage /> : null}
      {page === 'sale' ? <SaleListingPage /> : null}
      {page === 'stay' ? <StayListingPage /> : null}
      {page === 'swap' ? <SwapListingPage /> : null}
      {page === 'my-home' ? <MyHomePage /> : null}
      {page === 'evictions' ? <EvictionsPage /> : null}
      {page === 'publish' ? <PublishPage /> : null}
      {page === 'saved' ? <SavedPage /> : null}
      </HousingPageProvider>
    </HousingNavProvider>
  );
}
