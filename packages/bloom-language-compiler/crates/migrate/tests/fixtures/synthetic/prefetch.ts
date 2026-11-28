export declare function prefetch(id: string, depth: number): void;
export declare function revalidate(id: string): Promise<{ parentId?: string } | undefined>;
