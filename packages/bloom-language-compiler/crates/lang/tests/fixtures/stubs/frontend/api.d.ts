/** A TS module whose functions return promises (they may reject). */
export declare function fetchCount(id: string): Promise<number>;
export declare function ping(): Promise<void>;
/** A TS function with a rest parameter. */
export declare function joinClasses(base: string, ...names: string[]): string;
/** A TS value of no known type. */
export declare function readSetting(key: string): unknown;
/** A TS `as const` list of strings. */
export declare const MODES: readonly ["mixed", "tab", "hidden"];
/** A TS value Bloom does not type. */
export declare const PRESETS: Array<{ id: string }> & { extra?: true };
/** TS taking a function that returns a promise (a rejection is its error state). */
export declare function useQuery<T>(options: { queryKey: string[]; queryFn: () => Promise<T> }): { data: T | undefined };
export declare function useQueryOf(options: { queryKey: string[]; queryFn: () => Promise<number> }): { data: number | undefined };
export declare function onRefresh(handler: () => Promise<void>): void;
