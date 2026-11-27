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
/** A feed slice (Mention's `FeedPostSlice`): its context is read through `Slice['context']`. */
export interface Slice {
  context?: { postId: string; total: number; actors: { id: string; name: string }[] };
}
export interface RowProps {
  context?: Slice['context'];
}
export declare function useRow(): RowProps;
export interface Person {
  id: string;
}
/** Extends `Person`, as `HydratedAuthor` extends `PostUser`. */
export interface Author extends Person {
  role: string;
}
export declare function useAuthors(): Author[] | undefined;
export declare function badges(): Opaque<import('@oxy.so/bloom-language').Child>[];
export type Decision = 'available' | 'pending';
/** A page of results whose figures Bloom does not read (as an infinite query's `lastPage`). */
export declare function usePage(): Opaque<{ page: number; totalPages: number; label: string }>;
/** A gesture's event (react-native-gesture-handler's): its figures are TS's. */
export declare function useDrag(): Opaque<{ translationY: number }>;
/** A route's parameter, read by a hook (Mention's `useRoutedProfileUsername`). */
export declare function useRoutedName(): string;
/** A hook that takes another's value (Mention's `useProfileAccount`). */
export declare function useAccountOf(name: string): { loading: boolean; name: string };
export interface IdentityHolder {
  id: string;
  name?: { displayName?: string };
}
export interface SocialContext {
  actors: IdentityHolder[];
}
export declare function mergeIdentity<T extends IdentityHolder>(
  actor: T,
  entry: { id: string } | undefined,
): T;
export interface FeedAuthor {
  id: string;
  name: string;
}
/** TS says `authors` and `onOpen` are always there; the data at run time may lack them. */
export interface FeedPost {
  id: string;
  authors: FeedAuthor[];
  tags: string[];
  user: { id: string };
  onOpen: () => void;
}
export declare function useViewPost(): FeedPost | undefined;
export declare function lookupPost(id: string): FeedPost | undefined;
