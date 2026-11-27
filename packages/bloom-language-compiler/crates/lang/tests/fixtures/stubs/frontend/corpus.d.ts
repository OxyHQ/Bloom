// The TS the Mention corpus follow-ups read (R1–R6 of phase D).
import type { ReactNode } from 'react';

export interface RetryProps {
  onRetry?: () => Promise<void> | void;
  children?: ReactNode;
}
export declare function Retry(props: RetryProps): ReactNode;
export declare function refetch(): Promise<unknown>;
export type Tab = 'videos' | 'following';
export interface Selected {
  label?: string;
}
/** An API's figures: an absent one is `null` (Mention's API types). */
export interface Stats {
  boosts: number | null;
}
export declare function useStats(): Stats;
