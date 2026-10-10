import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { PlaceBusyTrend, PlaceTransitMode } from './types';

/**
 * Every fixed string the place-details family draws or announces, in each
 * Bloom language. "Copy" is `COMMON_MESSAGES`'; a caller's `*Label` and
 * `labels` props still win.
 */
export interface PlaceDetailsMessages {
  /** What pressing a `PlaceInfoList` row does, said at the end of its name. */
  infoActions: { call: string; open: string; directions: string };
  /** The trend sentence for the current hour. */
  busy: Readonly<Record<PlaceBusyTrend, string>>;
  /** A stop's kind, for its announced name. */
  transitModes: Readonly<Record<PlaceTransitMode, string>>;
  /** `PlaceAmenities`. */
  notAvailable: string;
  amenities: string;
  /** `PlaceHours`. */
  today: string;
  closed: string;
  openingHours: string;
  /** `PlacePopularTimes`: the day switch's name, the empty day, and the chart's sentence. */
  day: string;
  noDataForDay: string;
  chartNoData: (day: string) => string;
  chartClosed: (day: string) => string;
  chartPeak: (day: string, hour: string) => string;
  chartNow: (hour: string) => string;
  /** `PlaceTransit`. */
  live: string;
  noDepartures: string;
  nearbyTransit: string;
  lines: string;
  line: (name: string) => string;
  towards: (headsign: string) => string;
}

export const PLACE_DETAILS_MESSAGES: MessageCatalog<PlaceDetailsMessages> =
  defineMessages<PlaceDetailsMessages>('PLACE_DETAILS_MESSAGES', {
    infoActions: { call: 'Call', open: 'Open website', directions: 'Directions' },
    busy: {
      busier: 'Busier than usual',
      typical: 'As busy as it usually is',
      quieter: 'Quieter than usual',
    },
    transitModes: {
      bus: 'Bus stop',
      metro: 'Metro station',
      train: 'Train station',
      tram: 'Tram stop',
      ferry: 'Ferry terminal',
    },
    notAvailable: 'Not available',
    amenities: 'Amenities',
    today: 'Today',
    closed: 'Closed',
    openingHours: 'Opening hours',
    day: 'Day',
    noDataForDay: 'No data for this day',
    chartNoData: (day) => `${day}, no data`,
    chartClosed: (day) => `${day}, closed all day`,
    chartPeak: (day, hour) => `${day}, busiest at ${hour}`,
    chartNow: (hour) => `now ${hour}`,
    live: 'live',
    noDepartures: 'No departures right now',
    nearbyTransit: 'Nearby transit',
    lines: 'Lines',
    line: (name) => `Line ${name}`,
    towards: (headsign) => `to ${headsign}`,
  });
