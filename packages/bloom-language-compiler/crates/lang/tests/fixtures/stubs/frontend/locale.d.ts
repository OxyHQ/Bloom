// The shapes of `@oxy.so/bloom/locale`: an optional parameter, and a hook that may give none.
export declare function formatRelativeTime(at: Date | number, locale?: string, now?: number): string;
export declare function formatDay(at: number, locale: string): string;
export declare function useBloomLocale(): string | undefined;
