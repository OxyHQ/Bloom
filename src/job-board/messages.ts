import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { JobBoardSort, JobOfferState } from './types';

/**
 * Every fixed string the job board and its cards draw or announce, in each
 * Bloom language. `labels` has the shape of `JOB_BOARD_LABELS` (the English
 * entry); a caller's `labels` / `emptyTitle` / `accessibilityLabel` still win.
 */
export interface JobBoardMessages {
  labels: {
    take: string;
    pass: string;
    distance: string;
    duration: string;
    window: string;
    pickup: string;
    dropoff: string;
    state: Record<Exclude<JobOfferState, 'open'>, string>;
    showPay: string;
    hidePay: string;
    /** Kept for the `labels.payDetails` override; the default name is `payDetailsFor`. */
    payDetails: string;
    sort: string;
    filtersToggle: string;
    filtersActive: (count: number) => string;
    sortOptions: Record<JobBoardSort, string>;
    filters: { distance: string; pay: string; when: string; vehicle: string };
    clearFilters: string;
    refresh: string;
    count: (count: number) => string;
    loading: string;
  };
  emptyTitle: string;
  emptyDescription: string;
  /** Names the board. */
  list: string;
  /** Names a card's pay-breakdown toggle, as one phrase per language. */
  payDetailsFor: (load: string) => string;
  /** Names the pick-up/drop-off pair, joined the language's way. */
  route: (pickup: string, dropoff: string) => string;
  /** The default filter bands' words. */
  bands: {
    anyDistance: string;
    underKm: (km: number) => string;
    anyTime: string;
    withinHour: string;
    nextHours: (hours: number) => string;
    today: string;
  };
}

export const JOB_BOARD_MESSAGES: MessageCatalog<JobBoardMessages> =
  defineMessages<JobBoardMessages>('JOB_BOARD_MESSAGES', {
    labels: {
      take: 'Take the job',
      pass: 'Pass',
      distance: 'Distance',
      duration: 'Time',
      window: 'Window',
      pickup: 'Pick-up',
      dropoff: 'Drop-off',
      state: { taken: 'Taken', expired: 'Expired' },
      showPay: 'Show what it pays',
      hidePay: 'Hide what it pays',
      payDetails: 'Pay for',
      sort: 'Sort jobs',
      filtersToggle: 'Filters',
      filtersActive: (n) => `${n} applied`,
      sortOptions: {
        pay: 'Best paid',
        distance: 'Nearest',
        soonest: 'Starting soonest',
        expiring: 'Closing soonest',
      },
      filters: { distance: 'Distance', pay: 'Pay', when: 'When', vehicle: 'Vehicle' },
      clearFilters: 'Clear filters',
      refresh: 'Refresh the board',
      count: (n) => plural('en', n, { one: '{n} job', other: '{n} jobs' }),
      loading: 'Loading jobs',
    },
    emptyTitle: 'No jobs right now',
    emptyDescription:
      'Nothing matches what you are looking for. Widen a filter, or pull the board again in a minute.',
    list: 'Jobs',
    payDetailsFor: (load) => `Pay for ${load}`,
    route: (pickup, dropoff) => `${pickup} and ${dropoff}`,
    bands: {
      anyDistance: 'Any distance',
      underKm: (km) => `Under ${km} km`,
      anyTime: 'Any time',
      withinHour: 'Within the hour',
      nextHours: (hours) => `Next ${hours} hours`,
      today: 'Today',
    },
  });
