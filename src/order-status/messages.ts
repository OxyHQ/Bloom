import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { OrderStatusStepState } from './types';

/**
 * Every fixed string the order-status family announces, in each Bloom
 * language. `done` is the common word (`COMMON_MESSAGES.done`). A caller's
 * `stateLabels` and `accessibilityLabel` still win.
 */
export interface OrderStatusMessages {
  /** What a screen reader says for each state, before the step's own label. */
  states: Record<Exclude<OrderStatusStepState, 'done'>, string>;
  /** Names the timeline as a whole. */
  status: string;
}

export const ORDER_STATUS_MESSAGES: MessageCatalog<OrderStatusMessages> =
  defineMessages<OrderStatusMessages>('ORDER_STATUS_MESSAGES', {
    states: { current: 'In progress', upcoming: 'Not yet', failed: 'Failed' },
    status: 'Status',
  });
