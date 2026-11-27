// Hooks typed only by what they return (Bloom reads the result from the body, as TS infers
// it), and ones whose result TS alone knows (`string | null`, a class).
export function useInsets() {
  return { top: 1, bottom: 2 };
}
export function useMods(id: string) {
  return { data: [{ id, name: id }] as { id: string; name: string }[] | undefined };
}
export function useList(): { title: string | null; count: number } {
  return { title: '', count: 0 };
}
declare class VideoPlayer {
  loop: boolean;
  currentTime: number;
  source: { uri: string };
}
export function usePlayer(): VideoPlayer {
  return { loop: false, currentTime: 0, source: { uri: '' } };
}
