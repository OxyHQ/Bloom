import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type {
  LeasePaymentStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStage,
  RentPaymentStatus,
  TenancyDocumentStatus,
  TenancyTimelineEventState,
} from './types';

/**
 * Every fixed string the tenancy family draws or announces, in each Bloom
 * language. A caller's `*Label` props, `statusLabels`, `stageLabels`,
 * `columnLabels` and formatter props still win over any entry here.
 */
export interface TenancyMessages {
  /** `LeaseSummaryCard`'s next-payment badge. */
  leasePaymentStatus: Record<LeasePaymentStatus, string>;
  /** `RentPaymentList`'s row badge. */
  rentPaymentStatus: Record<RentPaymentStatus, string>;
  maintenanceCategory: Record<MaintenanceCategory, string>;
  maintenancePriority: Record<MaintenancePriority, string>;
  maintenanceStage: Record<MaintenanceStage, string>;
  documentStatus: Record<TenancyDocumentStatus, string>;
  /** A timeline marker's name, by state. */
  timelineState: Record<TenancyTimelineEventState, string>;
  leasePeriod: string;
  monthlyRent: string;
  deposit: string;
  nextPayment: string;
  paidThisYear: string;
  outstanding: string;
  noPayments: string;
  columns: { month: string; dueDate: string; method: string; amount: string; status: string };
  /** The receipt button's name, after the payment's month ("March 2026"). */
  downloadReceipt: (month: string) => string;
  /** The narrow row's meta line, from a pre-formatted date. */
  dueOn: (date: string) => string;
  comments: (count: number) => string;
  /** A maintenance photo's name without alt text. */
  photo: (position: number, total: number) => string;
  /** A maintenance photo's name after its alt text. */
  photoWithAlt: (alt: string, position: number, total: number) => string;
  sign: string;
  signDocument: (name: string) => string;
  viewDocument: (name: string) => string;
  downloadDocument: (name: string) => string;
  noDocuments: string;
}

export const TENANCY_MESSAGES: MessageCatalog<TenancyMessages> = defineMessages<TenancyMessages>('TENANCY_MESSAGES', {
  leasePaymentStatus: { upcoming: 'Upcoming', due: 'Due soon', overdue: 'Overdue', paid: 'Paid' },
  rentPaymentStatus: { paid: 'Paid', pending: 'Pending', overdue: 'Overdue', partial: 'Partial' },
  maintenanceCategory: {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    appliances: 'Appliances',
    heating: 'Heating',
    other: 'Other',
  },
  maintenancePriority: { low: 'Low priority', medium: 'Medium priority', high: 'High priority', urgent: 'Urgent' },
  maintenanceStage: { reported: 'Reported', acknowledged: 'Acknowledged', scheduled: 'Scheduled', resolved: 'Resolved' },
  documentStatus: { signed: 'Signed', pending: 'Pending signature', expired: 'Expired' },
  timelineState: { complete: 'Done', current: 'In progress', upcoming: 'Not yet' },
  leasePeriod: 'Lease period',
  monthlyRent: 'Monthly rent',
  deposit: 'Deposit',
  nextPayment: 'Next payment',
  paidThisYear: 'Paid this year',
  outstanding: 'Outstanding',
  noPayments: 'No payments yet',
  columns: { month: 'Month', dueDate: 'Due date', method: 'Method', amount: 'Amount', status: 'Status' },
  downloadReceipt: (month) => `Download receipt for ${month}`,
  dueOn: (date) => `Due ${date}`,
  comments: (n) => plural('en', n, { one: '{n} comment', other: '{n} comments' }),
  photo: (position, total) => `Photo ${position} of ${total}`,
  photoWithAlt: (alt, position, total) => `${alt}, photo ${position} of ${total}`,
  sign: 'Sign',
  signDocument: (name) => `Sign ${name}`,
  viewDocument: (name) => `View ${name}`,
  downloadDocument: (name) => `Download ${name}`,
  noDocuments: 'No documents',
});
