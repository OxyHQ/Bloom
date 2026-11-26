// A test stub of Mention's hook: generic over a constrained key, with an
// inferred result, as the real one is. Bloom reads its result as Foreign.
interface NotificationPreferencesDto {
  pushEnabled: boolean;
  likes: boolean;
  boosts: boolean;
  follows: boolean;
  mentions: boolean;
  replies: boolean;
  quotes: boolean;
}
interface Sections {
  notificationPreferences: NotificationPreferencesDto;
}
export function useViewerSettingsSection<K extends keyof Sections>(section: K) {
  return {
    value: {} as Partial<Sections[K]>,
    isLoading: false,
    update: async (_patch: Partial<Sections[K]>): Promise<void> => {
      void section;
    },
  };
}
