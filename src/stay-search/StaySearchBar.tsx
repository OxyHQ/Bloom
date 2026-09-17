import React, { memo, useMemo } from 'react';

import { HOME_SEARCH_SEGMENTS } from '../home-search/constants';
import { HomeSearchBar } from '../home-search/HomeSearchBar';
import type { HomeSearchSegment } from '../home-search/types';
import { DEFAULT_STAY_SEARCH_BAR_LABELS } from './constants';
import type { StaySearchBarProps, StaySearchSegment } from './types';

/**
 * Bloom's wide stay search: the stays preset of `HomeSearchBar`
 * (`@oxy.so/bloom/home-search`), which draws the pill, the segments, the
 * search button and the panel.
 *
 * `split` dates mode shows Where · Check in · Check out · Who; `single` folds
 * the two dates into one When segment. The destination segment becomes a text
 * field while open when `onDestinationQueryChange` is set. Everything else —
 * the look, dismissal, panel alignment — is `HomeSearchBar`'s.
 */

/** The single-mode "When" segment's width. */
const SINGLE_DATES_FLEX = 1.4;

function StaySearchBarComponent({
  activeSegment,
  onActiveSegmentChange,
  destination,
  dates,
  guests,
  datesMode = 'split',
  labels: labelOverrides,
  onSearch,
  destinationQuery,
  onDestinationQueryChange,
  panel,
  dismissible = true,
  style,
  testID,
}: StaySearchBarProps) {
  const labels = useMemo(
    () => ({ ...DEFAULT_STAY_SEARCH_BAR_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const datesSummary =
    dates?.summary ??
    (dates?.checkIn && dates?.checkOut
      ? `${dates.checkIn} – ${dates.checkOut}`
      : dates?.checkIn ?? dates?.checkOut);

  const [where, checkIn, checkOut, who] = HOME_SEARCH_SEGMENTS.stays;
  const segments: HomeSearchSegment<StaySearchSegment>[] = [
    { ...where!, label: labels.where, placeholder: labels.destinationPlaceholder, value: destination },
    ...(datesMode === 'single'
      ? [{ key: 'dates' as const, label: labels.when, placeholder: labels.datesPlaceholder, value: datesSummary, flex: SINGLE_DATES_FLEX }]
      : [
          { ...checkIn!, label: labels.checkIn, placeholder: labels.datesPlaceholder, value: dates?.checkIn },
          { ...checkOut!, label: labels.checkOut, placeholder: labels.datesPlaceholder, value: dates?.checkOut },
        ]),
    { ...who!, label: labels.who, placeholder: labels.guestsPlaceholder, value: guests },
  ];

  return (
    <HomeSearchBar<StaySearchSegment>
      segments={segments}
      activeSegment={activeSegment}
      onActiveSegmentChange={onActiveSegmentChange}
      onSearch={onSearch}
      searchLabel={labels.search}
      query={destinationQuery}
      onQueryChange={onDestinationQueryChange}
      panel={panel}
      dismissible={dismissible}
      style={style}
      testID={testID}
    />
  );
}

export const StaySearchBar = memo(StaySearchBarComponent);
StaySearchBar.displayName = 'StaySearchBar';
