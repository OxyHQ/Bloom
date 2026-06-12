import React from 'react';
import { Text } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useBloomTheme } from '../theme/use-theme';
import type { BloomThemeStorage, PersistedThemeState } from '../theme/persistence';

function Display() {
  const ctx = useBloomTheme();
  return (
    <>
      <Text testID="mode">{ctx.mode}</Text>
      <Text testID="preset">{ctx.colorPreset}</Text>
    </>
  );
}

function createSyncStorage(initial?: PersistedThemeState): BloomThemeStorage & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = {};
  if (initial) {
    store['bloom-theme'] = JSON.stringify(initial);
  }
  return {
    store,
    getItem: (key) => (key in store ? store[key]! : null),
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

function createAsyncStorage(initial?: PersistedThemeState): BloomThemeStorage & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = {};
  if (initial) {
    store['bloom-theme'] = JSON.stringify(initial);
  }
  return {
    store,
    getItem: (key) => Promise.resolve(key in store ? store[key]! : null),
    setItem: (key, value) => {
      store[key] = value;
      return Promise.resolve();
    },
  };
}

describe('BloomThemeProvider — persistence', () => {
  it('hydrates synchronously from sync storage before first paint', () => {
    const storage = createSyncStorage({ mode: 'dark', colorPreset: 'blue' });

    const { getByTestId } = render(
      <BloomThemeProvider persistKey="bloom-theme" storage={storage}>
        <Display />
      </BloomThemeProvider>,
    );

    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('preset').props.children).toBe('blue');
  });

  it('falls back to defaults when storage is empty', () => {
    const storage = createSyncStorage();

    const { getByTestId } = render(
      <BloomThemeProvider
        persistKey="bloom-theme"
        storage={storage}
        defaultMode="light"
        defaultColorPreset="teal"
      >
        <Display />
      </BloomThemeProvider>,
    );

    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('preset').props.children).toBe('teal');
  });

  it('writes through to storage when setMode is called', async () => {
    const storage = createSyncStorage();

    function Controls() {
      const ctx = useBloomTheme();
      return <Text testID="trigger" onPress={() => ctx.setMode('dark')} />;
    }

    const { getByTestId } = render(
      <BloomThemeProvider persistKey="bloom-theme" storage={storage}>
        <Display />
        <Controls />
      </BloomThemeProvider>,
    );

    await act(async () => {
      getByTestId('trigger').props.onPress();
    });

    expect(getByTestId('mode').props.children).toBe('dark');
    expect(JSON.parse(storage.store['bloom-theme']!)).toMatchObject({ mode: 'dark' });
  });

  it('writes through to storage when setColorPreset is called', async () => {
    const storage = createSyncStorage();

    function Controls() {
      const ctx = useBloomTheme();
      return <Text testID="trigger" onPress={() => ctx.setColorPreset('purple')} />;
    }

    const { getByTestId } = render(
      <BloomThemeProvider persistKey="bloom-theme" storage={storage}>
        <Display />
        <Controls />
      </BloomThemeProvider>,
    );

    await act(async () => {
      getByTestId('trigger').props.onPress();
    });

    expect(getByTestId('preset').props.children).toBe('purple');
    expect(JSON.parse(storage.store['bloom-theme']!)).toMatchObject({ colorPreset: 'purple' });
  });

  it('hydrates asynchronously when the storage adapter is async', async () => {
    const storage = createAsyncStorage({ mode: 'dark', colorPreset: 'pink' });

    const { getByTestId } = render(
      <BloomThemeProvider
        persistKey="bloom-theme"
        storage={storage}
        awaitHydration={false}
        defaultMode="light"
        defaultColorPreset="oxy"
      >
        <Display />
      </BloomThemeProvider>,
    );

    // Before async hydration completes: defaults
    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('preset').props.children).toBe('oxy');

    // After hydration: persisted values
    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('dark');
    });
    expect(getByTestId('preset').props.children).toBe('pink');
  });

  it('gates children behind onHydrating when awaitHydration is true', async () => {
    const storage = createAsyncStorage({ mode: 'dark', colorPreset: 'pink' });

    const { queryByTestId, getByTestId } = render(
      <BloomThemeProvider
        persistKey="bloom-theme"
        storage={storage}
        awaitHydration
        onHydrating={<Text testID="loading">loading</Text>}
      >
        <Display />
      </BloomThemeProvider>,
    );

    expect(queryByTestId('loading')).not.toBeNull();
    expect(queryByTestId('mode')).toBeNull();

    await waitFor(() => {
      expect(queryByTestId('mode')).not.toBeNull();
    });
    expect(getByTestId('mode').props.children).toBe('dark');
  });

  it('ignores malformed persisted state', () => {
    const storage: BloomThemeStorage = {
      getItem: () => 'not-json',
      setItem: () => undefined,
    };

    const { getByTestId } = render(
      <BloomThemeProvider
        persistKey="bloom-theme"
        storage={storage}
        defaultMode="light"
        defaultColorPreset="teal"
      >
        <Display />
      </BloomThemeProvider>,
    );

    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('preset').props.children).toBe('teal');
  });

  it('controlled props win over persisted state', () => {
    const storage = createSyncStorage({ mode: 'dark', colorPreset: 'blue' });

    const { getByTestId } = render(
      <BloomThemeProvider
        persistKey="bloom-theme"
        storage={storage}
        mode="light"
        colorPreset="oxy"
      >
        <Display />
      </BloomThemeProvider>,
    );

    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('preset').props.children).toBe('oxy');
  });
});
