export function usePlayer() {
  return { loop: false, time: 0 };
}
export function useTask(run: () => Promise<string>): void {
  void run;
}
