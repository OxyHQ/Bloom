export type Tab = 'posts' | 'replies' | 'likes' | 'media';
export interface Poll {
  question: string;
}
export interface Draft {
  key: string;
  poll?: Poll;
  pollId?: string;
}
export declare function rows(tabs: Tab[]): void;
