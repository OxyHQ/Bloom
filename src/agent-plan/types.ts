import type { Ref } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

/** Where the plan stands. Owned by the caller: it knows when the answer landed. */
export type AgentPlanDecision = 'pending' | 'approved' | 'rejected';

export interface AgentPlanProps {
  /** Heading above the steps. "Proposed plan" in English. */
  title?: string;
  /** The steps the agent proposes, in order. */
  steps: readonly string[];
  /**
   * Controlled. `pending` shows Approve and Reject; once `approved` or
   * `rejected` they are replaced by a status badge, and nothing else changes
   * the plan. Default `'pending'`.
   */
  decision?: AgentPlanDecision;
  onApprove?: () => void;
  onReject?: () => void;
  /** Overrides "Approve". */
  approveLabel?: string;
  /** Overrides "Reject". */
  rejectLabel?: string;
  /** Blocks both buttons. */
  disabled?: boolean;
  /** A decision is being sent: both buttons block and the one pressed shows a spinner. */
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  ref?: Ref<View>;
}
