// The app's router hook (Mention's `@/lib/navigation/router`), as a menu's actions read it.
export function useRouter() {
  return {
    push(path: string) {
      void path;
    },
  };
}
