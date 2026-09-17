import {
  RiCalendarLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiGroupLine,
  RiHome4Line,
  RiInformationLine,
  RiShieldCheckLine,
  RiTimeLine,
} from '../icons/remix';
import type { AccentFill, AccentTone } from '../theme/accent-colors';
import type { HousingIcon } from '../tenancy/types';
import type { EvictionEventKind, EvictionStatus } from './types';

/** The status badge: tone, fill and default English word. */
export const EVICTION_STATUS: Record<EvictionStatus, { tone: AccentTone; fill: AccentFill; label: string }> = {
  scheduled: { tone: 'warning', fill: 'subtle', label: 'Scheduled' },
  postponed: { tone: 'info', fill: 'subtle', label: 'Postponed' },
  suspended: { tone: 'success', fill: 'subtle', label: 'Suspended' },
  executed: { tone: 'default', fill: 'solid', label: 'Executed' },
  cancelled: { tone: 'default', fill: 'subtle', label: 'Cancelled' },
};

/** A history entry's marker. */
export const EVICTION_EVENT: Record<EvictionEventKind, { icon: HousingIcon; tone: AccentTone }> = {
  published: { icon: RiFileTextLine, tone: 'primary' },
  'date-set': { icon: RiCalendarLine, tone: 'warning' },
  postponed: { icon: RiTimeLine, tone: 'info' },
  suspended: { icon: RiShieldCheckLine, tone: 'success' },
  executed: { icon: RiHome4Line, tone: 'default' },
  cancelled: { icon: RiCloseCircleLine, tone: 'default' },
  mobilisation: { icon: RiGroupLine, tone: 'primary' },
  update: { icon: RiInformationLine, tone: 'primary' },
};
