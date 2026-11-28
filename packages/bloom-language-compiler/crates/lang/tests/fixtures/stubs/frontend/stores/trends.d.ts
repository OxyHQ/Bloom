/** A zustand store as zustand 5 declares one: a hook called with a selector. */
export interface Trend {
  id: string;
  title: string;
}
export interface TrendsState {
  trends: Trend[];
  pinned: readonly Trend[];
  recent: ReadonlyArray<string>;
  loaded: boolean;
}
type UseBoundStore<S> = {
  (): S;
  <U>(selector: (state: S) => U): U;
  getState(): S;
};
export declare const useTrendsStore: UseBoundStore<TrendsState>;
export declare function trendIds(): string[];
export declare function pinnedTrends(): readonly Trend[];
export declare function recentTitles(): ReadonlyArray<string>;
