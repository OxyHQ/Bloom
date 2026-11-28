export type Reporter = (event: 'impression' | 'press', position: number) => void;
export declare function report(event: 'impression' | 'press', position: number): void;
export declare const logger: { warn(message: string): void };
export type OnUpdated = (id: string, change: { cleared: boolean }) => void;
