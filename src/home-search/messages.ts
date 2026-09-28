import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { HomeSearchMode, MoveInPickerLabels } from './types';

/**
 * Every fixed string the home-search family draws or announces, in each Bloom
 * language. The stays segments come from `STAY_SEARCH_MESSAGES`; "Search",
 * "Edit" and "Delete" from `COMMON_MESSAGES`. A caller's `labels` / `*Label`
 * props still win over any entry here.
 */
export interface HomeSearchMessages {
  modes: Record<HomeSearchMode, string>;
  /** `SearchModeTabs`' tablist name. */
  searchMode: string;
  /** Segment labels and placeholders of the rent, buy and swap presets. */
  location: string;
  locationPlaceholder: string;
  moveIn: string;
  datePlaceholder: string;
  budget: string;
  budgetPlaceholder: string;
  price: string;
  pricePlaceholder: string;
  propertyType: string;
  propertyTypePlaceholder: string;
  dates: string;
  homeSize: string;
  homeSizePlaceholder: string;
  /** `BudgetPicker`. */
  minimum: string;
  maximum: string;
  budgetPresets: string;
  monthlyBudget: string;
  monthlyBudgetDescription: string;
  totalPriceDescription: string;
  /** A preset with no minimum, e.g. "Up to €800" (the amount comes formatted). */
  upTo: (amount: string) => string;
  any: string;
  /** `MoveInPicker`'s headings and chips, and its default contract lengths. */
  moveInLabels: MoveInPickerLabels;
  contractLengths: { any: string; short: string; medium: string; long: string };
  /** `SaveSearchButton`. */
  saveSearch: string;
  saved: string;
  /** `SavedSearchCard`. */
  newCount: (count: number) => string;
  alertsOff: string;
  /** A footer button's name about the search it acts on ("Edit Flats in Halden"). */
  actionOn: (action: string, subject: string) => string;
}

export const HOME_SEARCH_MESSAGES: MessageCatalog<HomeSearchMessages> = defineMessages<HomeSearchMessages>('HOME_SEARCH_MESSAGES', {
  modes: { rent: 'Rent', buy: 'Buy', stays: 'Vacation rentals', swap: 'Swap' },
  searchMode: 'Search mode',
  location: 'Location',
  locationPlaceholder: 'Search city or area',
  moveIn: 'Move-in',
  datePlaceholder: 'Add date',
  budget: 'Budget',
  budgetPlaceholder: 'Add budget',
  price: 'Price',
  pricePlaceholder: 'Any price',
  propertyType: 'Property type',
  propertyTypePlaceholder: 'Any type',
  dates: 'Dates',
  homeSize: 'Home size',
  homeSizePlaceholder: 'Any size',
  minimum: 'Minimum',
  maximum: 'Maximum',
  budgetPresets: 'Budget presets',
  monthlyBudget: 'Monthly budget',
  monthlyBudgetDescription: 'Rent per month, before bills',
  totalPriceDescription: 'Total price',
  upTo: (amount) => `Up to ${amount}`,
  any: 'Any',
  moveInLabels: { date: 'Move-in date', flexible: 'Flexible', asap: 'As soon as possible', contractLength: 'Contract length' },
  contractLengths: { any: 'Any', short: '1–6 months', medium: '6–12 months', long: '1+ year' },
  saveSearch: 'Save search',
  saved: 'Saved',
  newCount: (n) => `${n} new`,
  alertsOff: 'Alerts off',
  actionOn: (action, subject) => `${action} ${subject}`,
});
