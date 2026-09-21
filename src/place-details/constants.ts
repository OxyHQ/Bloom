import { RiBusLine } from '../icons/remix/RiBusLine';
import { RiExternalLinkLine } from '../icons/remix/RiExternalLinkLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiPencilLine } from '../icons/remix/RiPencilLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiRouteLine } from '../icons/remix/RiRouteLine';
import { RiShip2Line } from '../icons/remix/RiShip2Line';
import { RiSubwayLine } from '../icons/remix/RiSubwayLine';
import { RiTrainLine } from '../icons/remix/RiTrainLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { PlaceBusyTrend, PlaceInfoAction, PlaceTransitMode } from './types';

/**
 * The glyph each row action draws on its right — the one place a reader finds
 * out what the press will do before making it. `none` draws nothing; a row
 * that navigates keeps `SettingsListItem`'s own chevron.
 */
export const PLACE_INFO_ACTION_ICON: Readonly<
  Record<Exclude<PlaceInfoAction, 'none' | 'edit'>, BloomIconComponent>
> = {
  copy: RiFileCopyLine,
  call: RiPhoneLine,
  open: RiExternalLinkLine,
  directions: RiRouteLine,
};

/**
 * What each action does, said at the END of the row's name.
 *
 * It belongs to the NAME and not to `accessibilityHint`, which was the first
 * shape this took: **react-native-web drops `accessibilityHint` entirely** —
 * the rendered button carries no `title`, no `aria-description`, nothing — so
 * on web the row announced a fact and never said it could be pressed, while
 * native read it correctly. Same class as `accessibilityState`, same fix: the
 * one spelling that reaches both platforms.
 *
 * It goes last because the fact is what the reader is looking for. `edit` and
 * `none` say nothing: an "edit" row's own words already are the verb.
 */
export const PLACE_INFO_ACTION_LABELS: Readonly<Record<PlaceInfoAction, string>> = {
  copy: 'Copy',
  call: 'Call',
  open: 'Open website',
  directions: 'Directions',
  edit: '',
  none: '',
};

/** The English default trend sentences for the current hour. */
export const PLACE_BUSY_LABELS: Readonly<Record<PlaceBusyTrend, string>> = {
  busier: 'Busier than usual',
  typical: 'As busy as it usually is',
  quieter: 'Quieter than usual',
};

/** The glyph each kind of stop draws. */
export const PLACE_TRANSIT_MODE_ICON: Readonly<Record<PlaceTransitMode, BloomIconComponent>> = {
  bus: RiBusLine,
  metro: RiSubwayLine,
  train: RiTrainLine,
  tram: RiTrainLine,
  ferry: RiShip2Line,
};

/** The English default mode words, for a stop's announced name. */
export const PLACE_TRANSIT_MODE_LABELS: Readonly<Record<PlaceTransitMode, string>> = {
  bus: 'Bus stop',
  metro: 'Metro station',
  train: 'Train station',
  tram: 'Tram stop',
  ferry: 'Ferry terminal',
};

export interface PlaceDetailsGeometry {
  /** Between the blocks of one section. */
  blockGap: number;
  /** Between two rows of a list. */
  rowGap: number;
  /** A leading glyph. */
  glyph: number;
  /** The popular-times plot, axis labels excluded. */
  chartHeight: number;
  /** Under the plot, for the hour labels. */
  chartAxis: number;
  /** The corner of a busyness bar and of its track. */
  barRadius: number;
  /** A bar's share of its band that is GAP, per side (`barCategoryGap`). */
  barCategoryGap: number;
  /** The narrowest an hour label may sit from its neighbour before one is dropped. */
  hourLabelPitch: number;
}

/**
 * One screen, one set of numbers. The gaps are `listing-details`' own rungs
 * (12 / 16 / 24) so a place's section and a home's section stack identically;
 * only the chart has measurements of its own, because nothing else in Bloom
 * draws a day of hours.
 */
export const PLACE_DETAILS_GEOMETRY: PlaceDetailsGeometry = {
  blockGap: 16,
  rowGap: 12,
  glyph: 20,
  chartHeight: 120,
  chartAxis: 22,
  barRadius: 4,
  barCategoryGap: 0.16,
  hourLabelPitch: 34,
};
