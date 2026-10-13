import { defineMessages, type MessageCatalog } from '../locale/messages';

/** Every fixed string `AgentPlan` draws or announces, in each Bloom language. */
export interface AgentPlanMessages {
  /** The title when none is passed. */
  title: string;
  approve: string;
  reject: string;
  /** The status once approved. */
  approved: string;
  /** The status once rejected. */
  rejected: string;
  /** Names the group holding the approve and reject buttons. */
  decision: string;
}

export const AGENT_PLAN_MESSAGES: MessageCatalog<AgentPlanMessages> =
  defineMessages<AgentPlanMessages>('AGENT_PLAN_MESSAGES', {
    title: 'Proposed plan',
    approve: 'Approve',
    reject: 'Reject',
    approved: 'Approved',
    rejected: 'Rejected',
    decision: 'Plan decision',
  });
