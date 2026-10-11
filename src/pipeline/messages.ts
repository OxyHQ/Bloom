import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { DealHealth } from './types';

/**
 * Every fixed string the pipeline family draws or announces, in each Bloom
 * language. A caller's `healthLabel`, `moveLabel`, `emptyLabel`,
 * `loadMoreLabel` and `accessibilityLabel` still win.
 */
export interface PipelineMessages {
  /** Each health's word. */
  health: Record<DealHealth, string>;
  /** The stalled signal with its pre-formatted duration: "Stalled for 14 days". */
  stalledFor: (duration: string) => string;
  /** The move action's name: "Move Acme renewal". */
  move: (title: string) => string;
  /** Names the tab row of the `single` layout. */
  stages: string;
  /** A stage tab's name with its count: "Qualified, 3 deals". */
  stageWithCount: (name: string, count: number) => string;
  /** What an empty column says. */
  empty: string;
  loadMore: string;
}

export const PIPELINE_MESSAGES: MessageCatalog<PipelineMessages> = defineMessages<PipelineMessages>(
  'PIPELINE_MESSAGES',
  {
    health: { 'on-track': 'On track', 'at-risk': 'At risk', stalled: 'Stalled' },
    stalledFor: (duration) => `Stalled for ${duration}`,
    move: (title) => `Move ${title}`,
    stages: 'Pipeline stages',
    stageWithCount: (name, n) =>
      `${name}, ${plural('en', n, { one: '{n} deal', other: '{n} deals' })}`,
    empty: 'No deals in this stage',
    loadMore: 'Load more',
  },
);
