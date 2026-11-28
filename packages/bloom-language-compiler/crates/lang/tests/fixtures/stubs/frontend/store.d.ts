// A zustand-like store: a selector handed through a TS generic (`useShallow<S, U>`), whose `S`
// TS infers from the outer call; and a TS value holding a list.
export interface TrendsState {
  trends: string[];
  summary: string;
}
export declare function useTrendsStore<U>(selector: (state: TrendsState) => U): U;
export declare function useShallow<S, U>(selector: (state: S) => U): (state: S) => U;
export declare const stats: { columns: { label: string; value: number }[] };
export type DraftItem =
  | { origin: 'server'; id: string; post: { id: string } }
  | { origin: 'device'; id: string; draft: { id: string } };
