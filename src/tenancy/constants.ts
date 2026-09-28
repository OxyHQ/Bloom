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
import { TENANCY_MESSAGES } from './messages';
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
  /** The English word. The components draw the locale's (`TENANCY_MESSAGES`). */
  label: string;
}

const EN = TENANCY_MESSAGES.en;

/** `LeaseSummaryCard`'s next-payment badge. */
export const LEASE_PAYMENT_STATUS: Record<LeasePaymentStatus, StatusInfo> = {
  upcoming: { tone: 'info', label: EN.leasePaymentStatus.upcoming },
  due: { tone: 'warning', label: EN.leasePaymentStatus.due },
  overdue: { tone: 'error', label: EN.leasePaymentStatus.overdue },
  paid: { tone: 'success', label: EN.leasePaymentStatus.paid },
};

/** `RentPaymentList`'s row badge. */
export const RENT_PAYMENT_STATUS: Record<RentPaymentStatus, StatusInfo> = {
  paid: { tone: 'success', label: EN.rentPaymentStatus.paid },
  pending: { tone: 'warning', label: EN.rentPaymentStatus.pending },
  overdue: { tone: 'error', label: EN.rentPaymentStatus.overdue },
  partial: { tone: 'info', label: EN.rentPaymentStatus.partial },
};

/** `MaintenanceRequestCard`'s category icon and word. */
export const MAINTENANCE_CATEGORY: Record<MaintenanceCategory, { icon: HousingIcon; label: string }> = {
  plumbing: { icon: RiDropLine, label: EN.maintenanceCategory.plumbing },
  electrical: { icon: RiFlashlightLine, label: EN.maintenanceCategory.electrical },
  appliances: { icon: RiFridgeLine, label: EN.maintenanceCategory.appliances },
  heating: { icon: RiTempHotLine, label: EN.maintenanceCategory.heating },
  other: { icon: RiToolsLine, label: EN.maintenanceCategory.other },
};

/** `MaintenanceRequestCard`'s priority chip. */
export const MAINTENANCE_PRIORITY: Record<MaintenancePriority, StatusInfo> = {
  low: { tone: 'default', label: EN.maintenancePriority.low },
  medium: { tone: 'info', label: EN.maintenancePriority.medium },
  high: { tone: 'warning', label: EN.maintenancePriority.high },
  urgent: { tone: 'error', label: EN.maintenancePriority.urgent },
};

/** The stages in order, with the status badge each draws while it is the latest. */
export const MAINTENANCE_STAGES: readonly MaintenanceStage[] = ['reported', 'acknowledged', 'scheduled', 'resolved'];

export const MAINTENANCE_STAGE: Record<MaintenanceStage, StatusInfo> = {
  reported: { tone: 'warning', label: EN.maintenanceStage.reported },
  acknowledged: { tone: 'info', label: EN.maintenanceStage.acknowledged },
  scheduled: { tone: 'primary', label: EN.maintenanceStage.scheduled },
  resolved: { tone: 'success', label: EN.maintenanceStage.resolved },
};

/** `DocumentList`'s status badge. */
export const TENANCY_DOCUMENT_STATUS: Record<TenancyDocumentStatus, StatusInfo> = {
  signed: { tone: 'success', label: EN.documentStatus.signed },
  pending: { tone: 'warning', label: EN.documentStatus.pending },
  expired: { tone: 'error', label: EN.documentStatus.expired },
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
