import { RiDropLine } from '../icons/remix/RiDropLine';
import { RiFilePdf2Line } from '../icons/remix/RiFilePdf2Line';
import { RiFileImageLine } from '../icons/remix/RiFileImageLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiFileWord2Line } from '../icons/remix/RiFileWord2Line';
import { RiFlashlightLine } from '../icons/remix/RiFlashlightLine';
import { RiFridgeLine } from '../icons/remix/RiFridgeLine';
import { RiTempHotLine } from '../icons/remix/RiTempHotLine';
import { RiToolsLine } from '../icons/remix/RiToolsLine';
import type { AccentTone } from '../theme/accent-colors';
import type {
  HousingIcon,
  LeasePaymentStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStage,
  RentPaymentStatus,
  TenancyDocumentStatus,
  TenancyDocumentType,
} from './types';

interface StatusInfo {
  tone: AccentTone;
  label: string;
}

/** `LeaseSummaryCard`'s next-payment badge. */
export const LEASE_PAYMENT_STATUS: Record<LeasePaymentStatus, StatusInfo> = {
  upcoming: { tone: 'info', label: 'Upcoming' },
  due: { tone: 'warning', label: 'Due soon' },
  overdue: { tone: 'error', label: 'Overdue' },
  paid: { tone: 'success', label: 'Paid' },
};

/** `RentPaymentList`'s row badge. */
export const RENT_PAYMENT_STATUS: Record<RentPaymentStatus, StatusInfo> = {
  paid: { tone: 'success', label: 'Paid' },
  pending: { tone: 'warning', label: 'Pending' },
  overdue: { tone: 'error', label: 'Overdue' },
  partial: { tone: 'info', label: 'Partial' },
};

/** `MaintenanceRequestCard`'s category icon and word. */
export const MAINTENANCE_CATEGORY: Record<MaintenanceCategory, { icon: HousingIcon; label: string }> = {
  plumbing: { icon: RiDropLine, label: 'Plumbing' },
  electrical: { icon: RiFlashlightLine, label: 'Electrical' },
  appliances: { icon: RiFridgeLine, label: 'Appliances' },
  heating: { icon: RiTempHotLine, label: 'Heating' },
  other: { icon: RiToolsLine, label: 'Other' },
};

/** `MaintenanceRequestCard`'s priority chip. */
export const MAINTENANCE_PRIORITY: Record<MaintenancePriority, StatusInfo> = {
  low: { tone: 'default', label: 'Low priority' },
  medium: { tone: 'info', label: 'Medium priority' },
  high: { tone: 'warning', label: 'High priority' },
  urgent: { tone: 'error', label: 'Urgent' },
};

/** The stages in order, with the status badge each draws while it is the latest. */
export const MAINTENANCE_STAGES: readonly MaintenanceStage[] = ['reported', 'acknowledged', 'scheduled', 'resolved'];

export const MAINTENANCE_STAGE: Record<MaintenanceStage, StatusInfo> = {
  reported: { tone: 'warning', label: 'Reported' },
  acknowledged: { tone: 'info', label: 'Acknowledged' },
  scheduled: { tone: 'primary', label: 'Scheduled' },
  resolved: { tone: 'success', label: 'Resolved' },
};

/** `DocumentList`'s status badge. */
export const TENANCY_DOCUMENT_STATUS: Record<TenancyDocumentStatus, StatusInfo> = {
  signed: { tone: 'success', label: 'Signed' },
  pending: { tone: 'warning', label: 'Pending signature' },
  expired: { tone: 'error', label: 'Expired' },
};

export const TENANCY_DOCUMENT_ICON: Record<TenancyDocumentType, HousingIcon> = {
  pdf: RiFilePdf2Line,
  image: RiFileImageLine,
  document: RiFileWord2Line,
  other: RiFileTextLine,
};

/** Width breakpoints of the `auto` layouts. */
export const LEASE_CARD_WIDE_MIN_WIDTH = 520;
export const RENT_PAYMENT_LIST_WIDE_MIN_WIDTH = 640;
export const DOCUMENT_LIST_WIDE_MIN_WIDTH = 560;
