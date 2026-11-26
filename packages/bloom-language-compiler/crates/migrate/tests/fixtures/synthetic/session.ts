export interface Session {
  user?: { name: string };
  title: string;
  count: number;
}
export declare function useSession(): Session;
