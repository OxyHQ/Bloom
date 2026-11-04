/**
 * The viewer's preferences: persisted in the theme's storage and namespace, and
 * honoured by the components that read them (haptics, video and GIF autoplay)
 * without the app wiring either.
 */
import { act, render, waitFor } from '@testing-library/react-native';

import { BloomHapticsProvider, useHaptics } from '../hooks/use-haptics';
import { BloomPreferencesProvider, useBloomPreferences, useMediaAutoplay } from '../preferences';
import type { BloomPreferencesContextValue } from '../preferences';
import {
  useVideoPlayback,
  VideoPlaybackProvider,
  VideoViewabilityProvider,
} from '../video-playback';

const impactAsync = jest.fn(async () => undefined);
jest.mock('../hooks/haptics-module', () => ({
  loadHaptics: () => ({
    impactAsync,
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  }),
  warnHapticsUnavailable: jest.fn(),
}));
jest.mock('../screen/use-screen-visible', () => ({ useScreenVisible: () => true }));

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: async (key: string) => items.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      items.set(key, value);
    },
  };
}

let prefs: BloomPreferencesContextValue | undefined;
let autoplay: boolean | undefined;
let shouldPlay: boolean | undefined;
let haptic: ((s?: 'light') => void) | undefined;
function Probe() {
  prefs = useBloomPreferences();
  autoplay = useMediaAutoplay();
  haptic = useHaptics();
  shouldPlay = useVideoPlayback({ id: 'a', viewabilityKey: 'a' }).shouldPlay;
  return null;
}

function App({ storage }: { storage: ReturnType<typeof memoryStorage> }) {
  return (
    <BloomPreferencesProvider storage={storage} persistKey="app">
      <BloomHapticsProvider>
        <VideoPlaybackProvider>
          <VideoViewabilityProvider viewableKeys={new Set(['a'])}>
            <Probe />
          </VideoViewabilityProvider>
        </VideoPlaybackProvider>
      </BloomHapticsProvider>
    </BloomPreferencesProvider>
  );
}

describe('Bloom preferences', () => {
  it('persists under the theme namespace and is honoured by video and haptics', async () => {
    const storage = memoryStorage();
    const first = render(<App storage={storage} />);
    expect(shouldPlay).toBe(true);

    act(() => prefs?.setPreference('videoAutoplay', 'never'));
    act(() => prefs?.setPreference('haptics', false));
    expect(autoplay).toBe(false);
    expect(shouldPlay).toBe(false);
    act(() => haptic?.());
    expect(impactAsync).not.toHaveBeenCalled();
    expect(JSON.parse(storage.items.get('app:preferences') ?? '{}')).toEqual({
      haptics: false,
      videoAutoplay: 'never',
    });
    first.unmount();

    render(<App storage={storage} />);
    await waitFor(() => expect(prefs?.preferences.videoAutoplay).toBe('never'));
    expect(shouldPlay).toBe(false);
  });

  it('ignores a stored record it cannot read, and keeps a choice made before hydration', async () => {
    const storage = memoryStorage({ 'app:preferences': '{"videoAutoplay":"sometimes"}' });
    render(<App storage={storage} />);
    act(() => prefs?.setPreference('haptics', false));
    await waitFor(() => expect(storage.items.get('app:preferences')).toContain('"haptics":false'));
    expect(prefs?.preferences).toEqual({ haptics: false, videoAutoplay: 'always' });
  });
});
