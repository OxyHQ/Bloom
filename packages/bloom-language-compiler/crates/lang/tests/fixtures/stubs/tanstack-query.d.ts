// A stand-in for `@tanstack/react-query`'s `useQuery`, whose real overloads take mapped option
// types Bloom does not read: a binding module declares it (`emit/corpus_followups.bloom`).
export declare function useQuery<T>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
}): { data: T | undefined; isLoading: boolean };
