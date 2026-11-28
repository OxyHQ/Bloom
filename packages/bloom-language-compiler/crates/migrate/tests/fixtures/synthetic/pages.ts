export declare function fetchJson<T>(path: string): Promise<{ data?: { rows?: T[]; more?: boolean } }>;
export declare function query(options: { key: string; fn: () => Promise<unknown> }): { count: number };
export interface Place {
  coordinates: [number, number];
  name?: string;
}
