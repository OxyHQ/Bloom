// A hook typed only by what it returns, and one whose result TS alone knows.
export function useInsets() {
  return { top: 1, bottom: 2 };
}
export function useMods(id: string) {
  return { data: [{ id, name: id }] as { id: string; name: string }[] | undefined };
}
export function useList() {
  return { title: '' as string | undefined, count: 0 };
}
