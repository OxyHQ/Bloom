import { RiCalendarEventLine } from '../icons/remix/RiCalendarEventLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiDraftLine } from '../icons/remix/RiDraftLine';
import { RiExchangeLine } from '../icons/remix/RiExchangeLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';
import type { ActivityFeedKind } from './types';

/**
 * The glyph, the word and the tone of each kind.
 *
 * The WORD is here rather than on the entry because it is also the filter
 * chip's label and the kind mark's accessible name, and three spellings of
 * "Stage change" is how a feed and its filter row stop agreeing.
 */
export const ACTIVITY_FEED_KIND: Record<
  ActivityFeedKind,
  { icon: BloomIconComponent; label: string; tone: AccentTone }
> = {
  call: { icon: RiPhoneLine, label: 'Call', tone: 'info' },
  email: { icon: RiMailLine, label: 'Email', tone: 'primary' },
  meeting: { icon: RiCalendarEventLine, label: 'Meeting', tone: 'primary' },
  note: { icon: RiDraftLine, label: 'Note', tone: 'default' },
  'stage-change': { icon: RiExchangeLine, label: 'Stage change', tone: 'warning' },
  task: { icon: RiCheckboxCircleLine, label: 'Task completed', tone: 'success' },
};

/** Every kind, in the order a filter row offers them. */
export const ACTIVITY_FEED_KINDS: readonly ActivityFeedKind[] = [
  'call',
  'email',
  'meeting',
  'note',
  'stage-change',
  'task',
];

/** The actor's avatar, and the kind mark that sits on its corner. */
export const ACTIVITY_AVATAR_SIZE = 32;
export const ACTIVITY_KIND_MARK_SIZE = 18;

/** Between two entries, and between a day's heading and its first entry. */
export const ACTIVITY_ENTRY_GAP = 16;

/**
 * Roughly how many characters fit one clamped line at `body-2-regular` in a
 * feed column. It decides whether a body is offered a REVEAL.
 *
 * 48 is the count at ~310px of text, which is what a 390 phone leaves after the
 * page gutters and the 32-wide actor mark. A wider feed then offers the reveal
 * on a body that did fit — the cheap mistake, on purpose (below).
 *
 * It is a heuristic and says so: React Native gives no reliable "did this
 * overflow" signal on both platforms (`onTextLayout` is native-only, and a
 * measurement pass on web would land a frame after paint), so the alternatives
 * were a toggle that appears after the text settles — which moves the content
 * under the reader's eyes — or one that is occasionally offered on a body that
 * did fit and collapses to the same text. The second is the cheaper mistake.
 */
export const ACTIVITY_BODY_CHARS_PER_LINE = 48;
