import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type {
  ApplicationItemStatus,
  ExchangeMode,
  MortgageCalculatorLabels,
  RentalStatus,
  SaleStatus,
} from './types';

/**
 * Every fixed string the listing-actions family draws or announces, in each
 * Bloom language. Prices and amounts arrive formatted from the app; a caller's
 * `*Label` / `labels` props still win over any entry here.
 */
export interface ListingActionsMessages {
  /** `RentalActionCard`'s default price unit, drawn "/ month". */
  month: string;
  rentalStatus: Record<RentalStatus, string>;
  rentalStatusMessage: Record<Exclude<RentalStatus, 'available'>, string>;
  saleStatus: Record<SaleStatus, string>;
  saleStatusMessage: Record<Exclude<SaleStatus, 'available'>, string>;
  requestViewing: string;
  apply: string;
  contactAgent: string;
  requestVisit: string;
  makeOffer: string;
  /** `ExchangeProposalCard`. */
  yourHome: string;
  theirHome: string;
  dates: string;
  guests: string;
  addDates: string;
  addGuests: string;
  proposeSwap: string;
  exchangeModes: Record<ExchangeMode, string>;
  /** `ViewingScheduler`. */
  scheduleViewing: string;
  noTimesLeft: string;
  noteForLandlord: string;
  day: string;
  time: string;
  submitViewing: string;
  inPerson: string;
  videoCall: string;
  viewingType: string;
  /** `ApplicationChecklist`. */
  yourApplication: string;
  applicationProgress: string;
  progressReady: (done: number, total: number) => string;
  applicationStatus: Record<ApplicationItemStatus, string>;
  applicationAction: { upload: string; view: string; replace: string };
  /** An item's action button's name: "Upload Proof of identity". */
  itemAction: (action: string, title: string) => string;
  /** `MortgageCalculator`. */
  mortgage: MortgageCalculatorLabels;
  /** A term chip's name: "25 years". */
  termYears: (years: number) => string;
  mortgageDisclaimer: string;
}

export const LISTING_ACTIONS_MESSAGES: MessageCatalog<ListingActionsMessages> =
  defineMessages<ListingActionsMessages>('LISTING_ACTIONS_MESSAGES', {
    month: 'month',
    rentalStatus: { available: 'Available', reserved: 'Reserved', rented: 'Rented' },
    rentalStatusMessage: {
      reserved: 'Another applicant is finalising a contract. New viewings are paused.',
      rented: 'This home has been rented and no longer takes requests.',
    },
    saleStatus: { available: 'For sale', reserved: 'Reserved', sold: 'Sold' },
    saleStatusMessage: {
      reserved: 'An offer has been accepted. The agent is not arranging visits for now.',
      sold: 'This home has been sold.',
    },
    requestViewing: 'Request a viewing',
    apply: 'Apply',
    contactAgent: 'Contact agent',
    requestVisit: 'Request a visit',
    makeOffer: 'Make an offer',
    yourHome: 'Your home',
    theirHome: 'Their home',
    dates: 'Dates',
    guests: 'Guests',
    addDates: 'Add dates',
    addGuests: 'Add guests',
    proposeSwap: 'Propose a swap',
    exchangeModes: { swap: 'Reciprocal swap', host: 'Guest points', both: 'Either' },
    scheduleViewing: 'Schedule a viewing',
    noTimesLeft: 'No times left on this day',
    noteForLandlord: 'Note for the landlord',
    day: 'Day',
    time: 'Time',
    submitViewing: 'Request viewing',
    inPerson: 'In person',
    videoCall: 'Video call',
    viewingType: 'Viewing type',
    yourApplication: 'Your application',
    applicationProgress: 'Application progress',
    progressReady: (done, total) => `${done} of ${total} ready`,
    applicationStatus: {
      missing: 'Missing',
      uploaded: 'In review',
      verified: 'Verified',
      rejected: 'Rejected',
    },
    applicationAction: { upload: 'Upload', view: 'View', replace: 'Replace' },
    itemAction: (action, title) => `${action} ${title}`,
    mortgage: {
      title: 'Mortgage calculator',
      price: 'Property price',
      downPayment: 'Down payment',
      downPaymentPercent: 'Down payment percent',
      percent: 'Percent',
      term: 'Loan term',
      years: 'years',
      rate: 'Interest rate',
      monthlyPayment: 'Monthly payment',
      principal: 'Principal',
      interest: 'Interest',
      loanAmount: 'Loan amount',
      totalInterest: 'Total interest',
      totalCost: 'Total cost',
    },
    termYears: (n) => plural('en', n, { one: '{n} year', other: '{n} years' }),
    mortgageDisclaimer:
      'An estimate, not an offer. It leaves out fees, taxes and insurance, and assumes a fixed rate for the whole term.',
  });
