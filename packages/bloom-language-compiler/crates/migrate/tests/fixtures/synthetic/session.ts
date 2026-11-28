export interface Session {
  user?: { name: string };
  title: string;
  count: number;
  nick?: string;
}
export declare function useSession(): Session;
