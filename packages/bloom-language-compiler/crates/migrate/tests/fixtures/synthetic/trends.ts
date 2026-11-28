export type TrendKind = 'hashtag' | 'topic' | 'entity';
export interface Trend {
  type: TrendKind;
  name: string;
  direction: 'up' | 'down' | 'flat';
  authorCount?: number;
}
export interface TrendingTopic {
  type: string;
  name: string;
  host?: string;
}
export declare function formatCount(n: number): string;
export declare function rows(trends: Trend[]): void;
export declare function hosts(ids: string[]): void;
export declare const t: (key: string, options?: { defaultValue?: string; number?: number }) => string;
