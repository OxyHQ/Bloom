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
/** A post's author (Mention's `PostUser`): its absent fields are `null`. */
export interface PostAuthor {
  id: string;
  avatar: string | null;
  name: { displayName: string | null };
}
/** A conditional type Bloom does not read (so a value of it is `Foreign`); TS's `string | null`. */
type Nullable = object extends string ? never : string | null;
export declare function useAuthUser(): {
  id: string;
  avatar: Nullable;
  name: { displayName: Nullable };
};
export declare function authorLabel(author: PostAuthor): string;
/** An item type Bloom does not read (a conditional type), as `useQuery`'s data is `Foreign`. */
type Opaque<T> = object extends string ? never : T;
export interface Account {
  id: string;
  name: string;
}
export declare function useAccounts(): { data: Opaque<Account>[] | undefined };
export declare function AccountList(props: { accounts: Account[] }): ReactNode;
