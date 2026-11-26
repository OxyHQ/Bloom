/** A TS module whose functions return promises (they may reject). */
export declare function fetchCount(id: string): Promise<number>;
export declare function ping(): Promise<void>;
/** A TS function with a rest parameter. */
export declare function joinClasses(base: string, ...names: string[]): string;
