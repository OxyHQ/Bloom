// A callback TS types `(url: string) => Promise<unknown>` (Allo's `openInAllo` options).
export interface OpenOptions {
  openWebUrl: (url: string) => Promise<unknown>;
}
export declare function openIn(link: string, options: OpenOptions): Promise<boolean>;
export declare function openExternal(url: string): Promise<void>;
