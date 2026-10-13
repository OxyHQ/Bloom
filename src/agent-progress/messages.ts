import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string `AgentProgress` draws or announces, in each Bloom
 * language. A caller's `labels` and `steps` props still win over these.
 */
export interface AgentProgressMessages {
  stepsLeft: (remaining: number) => string;
  allCompleted: string;
  minimize: string;
  expand: string;
  /** The demo coding workflow shown when no `steps` are passed. */
  defaultSteps: readonly string[];
  /** `AgentProgressPlan`'s title when none is passed. */
  planTitle: string;
  approve: string;
  reject: string;
  /** The plan's status once approved. */
  approved: string;
  /** The plan's status once rejected. */
  rejected: string;
  /** Names the group holding the approve and reject buttons. */
  planDecision: string;
}

export const AGENT_PROGRESS_MESSAGES: MessageCatalog<AgentProgressMessages> =
  defineMessages<AgentProgressMessages>('AGENT_PROGRESS_MESSAGES', {
    stepsLeft: (n) => plural('en', n, { one: '{n} step left', other: '{n} steps left' }),
    allCompleted: 'All steps completed',
    minimize: 'Minimize steps',
    expand: 'Expand steps',
    defaultSteps: [
      'Read project files',
      'Update and install light mode tokens',
      'Implement dark mode tokens',
      'Add reusable registered theme toggle',
      'Run registry, lint and production build',
    ],
    planTitle: 'Proposed plan',
    approve: 'Approve',
    reject: 'Reject',
    approved: 'Approved',
    rejected: 'Rejected',
    planDecision: 'Plan decision',
  });
