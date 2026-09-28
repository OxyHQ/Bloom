import { RiCalendarLine } from '../icons/remix/RiCalendarLine';
import { RiCloseCircleLine } from '../icons/remix/RiCloseCircleLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiHome4Line } from '../icons/remix/RiHome4Line';
import { RiInformationLine } from '../icons/remix/RiInformationLine';
import { RiShieldCheckLine } from '../icons/remix/RiShieldCheckLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import type { AccentFill, AccentTone } from '../theme/accent-colors';
import type { HousingIcon } from '../tenancy/types';
import { EVICTION_MESSAGES } from './messages';
import type { EvictionEventKind, EvictionStatus } from './types';

/**
 * The status badge: tone, fill and English word. The card draws the word in
 * the locale (`EVICTION_MESSAGES`); `label` stays for callers that read it.
 */
export const EVICTION_STATUS: Record<EvictionStatus, { tone: AccentTone; fill: AccentFill; label: string }> = {
  scheduled: { tone: 'warning', fill: 'subtle', label: EVICTION_MESSAGES.en.status.scheduled },
  postponed: { tone: 'info', fill: 'subtle', label: EVICTION_MESSAGES.en.status.postponed },
  suspended: { tone: 'success', fill: 'subtle', label: EVICTION_MESSAGES.en.status.suspended },
  executed: { tone: 'default', fill: 'solid', label: EVICTION_MESSAGES.en.status.executed },
  cancelled: { tone: 'default', fill: 'subtle', label: EVICTION_MESSAGES.en.status.cancelled },
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
