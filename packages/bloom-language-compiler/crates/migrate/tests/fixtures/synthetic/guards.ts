export interface GuardAuthor { id: string; name: string }
export interface GuardPost { id: string; authors: GuardAuthor[]; tags: string[] }
export declare function pathOf(): string;
