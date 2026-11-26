export declare function save(id: string): Promise<void>;
export declare function load(id: string): Promise<{ data: { url: string } }>;
export declare function unsave(id: string): Promise<void>;
export declare const saveLogger: { debug(message: string): void };
