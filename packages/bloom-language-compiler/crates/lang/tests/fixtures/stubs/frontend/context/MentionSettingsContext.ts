// A test stub of Mention's settings router.
export interface SettingsRouter {
  push(href: string): void;
  back(): void;
}
export declare function useSettingsRouter(): SettingsRouter;
