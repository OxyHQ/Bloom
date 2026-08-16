import React from 'react';
import { Text, Pressable } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import {
  useAmbientTheme,
  ambientTheme,
  __flushAmbientForTests,
  __resetAmbientForTests,
} from '../theme/ambient-store';
import { buildThemeFromSeed } from '../theme/build-theme-from-seed';
import { buildTheme } from '../theme/build-theme';

const OXY_PRESET_PRIMARY = buildTheme('oxy', 'light', false).colors.primary;
const RED_SEED = '#ff0000';
const RED_SEED_PRIMARY = buildThemeFromSeed(RED_SEED, 'light').colors.primary;

function PrimaryProbe() {
  const theme = useTheme();
  return <Text testID="primary">{theme.colors.primary}</Text>;
}

function AmbientDriver({ debounceMs }: { debounceMs?: number }) {
  const { seed, setAmbient, clearAmbient } = useAmbientTheme({ debounceMs });
  return (
    <>
      <Text testID="ambient-seed">{seed ?? 'null'}</Text>
      <Pressable testID="set" onPress={() => setAmbient(RED_SEED)} />
      <Pressable testID="clear" onPress={() => clearAmbient()} />
    </>
  );
}

describe('ambient theme store', () => {
  beforeEach(() => {
    __resetAmbientForTests();
  });
  afterEach(() => {
    __resetAmbientForTests();
  });

  it('starts empty and returns a stable snapshot ref while unchanged', () => {
    const { getByTestId } = render(
      <BloomThemeProvider>
        <AmbientDriver debounceMs={0} />
      </BloomThemeProvider>,
    );
    expect(getByTestId('ambient-seed').props.children).toBe('null');
  });

  it('debounces setAmbient and coalesces rapid calls', () => {
    ambientTheme.setAmbient('#111111');
    ambientTheme.setAmbient('#222222');
    ambientTheme.setAmbient(RED_SEED);
    // Nothing committed yet — still debouncing.
    expect(ambientTheme.getState().seed).toBeNull();
    act(() => {
      __flushAmbientForTests();
    });
    // Only the LAST call wins.
    expect(ambientTheme.getState().seed).toBe(RED_SEED);
  });

  it('applies debounceMs: 0 synchronously', () => {
    const { getByTestId } = render(
      <BloomThemeProvider>
        <AmbientDriver debounceMs={0} />
      </BloomThemeProvider>,
    );
    act(() => {
      fireEvent.press(getByTestId('set'));
    });
    expect(getByTestId('ambient-seed').props.children).toBe(RED_SEED);
  });
});

describe('BloomThemeProvider ambient override / restore', () => {
  beforeEach(() => {
    __resetAmbientForTests();
  });
  afterEach(() => {
    __resetAmbientForTests();
  });

  it('overrides the preset while ambient is set and restores it on clear', () => {
    const { getByTestId } = render(
      <BloomThemeProvider>
        <PrimaryProbe />
        <AmbientDriver debounceMs={0} />
      </BloomThemeProvider>,
    );
    // Baseline: the oxy preset.
    expect(getByTestId('primary').props.children).toBe(OXY_PRESET_PRIMARY);

    act(() => {
      fireEvent.press(getByTestId('set'));
    });
    // Ambient seed themes the whole app from the red seed.
    expect(getByTestId('primary').props.children).toBe(RED_SEED_PRIMARY);
    expect(RED_SEED_PRIMARY).not.toBe(OXY_PRESET_PRIMARY);

    act(() => {
      fireEvent.press(getByTestId('clear'));
    });
    // Cleared → back to the preset.
    expect(getByTestId('primary').props.children).toBe(OXY_PRESET_PRIMARY);
  });

  it('ambient overrides even a static seed prop, then restores it on clear', () => {
    const staticSeed = '#00ff00';
    const staticPrimary = buildThemeFromSeed(staticSeed, 'light').colors.primary;

    const { getByTestId } = render(
      <BloomThemeProvider seed={staticSeed}>
        <PrimaryProbe />
        <AmbientDriver debounceMs={0} />
      </BloomThemeProvider>,
    );
    // Static seed prop is active.
    expect(getByTestId('primary').props.children).toBe(staticPrimary);

    act(() => {
      fireEvent.press(getByTestId('set'));
    });
    // Ambient wins over the static seed prop.
    expect(getByTestId('primary').props.children).toBe(RED_SEED_PRIMARY);

    act(() => {
      fireEvent.press(getByTestId('clear'));
    });
    // Restored to the static seed prop, NOT the preset.
    expect(getByTestId('primary').props.children).toBe(staticPrimary);
  });
});

// The debounce releases its timer handle so a pending commit can't hold a jest
// worker open — but ONLY Node hands back a handle that can be released. React
// Native and the browser return an opaque number. Both shapes are exercised
// here because jest only ever supplies the first one, which is exactly why the
// second went unnoticed.
describe('ambient debounce timer handle', () => {
  const realSetTimeout = globalThis.setTimeout;

  beforeEach(() => {
    __resetAmbientForTests();
  });
  afterEach(() => {
    Object.defineProperty(globalThis, 'setTimeout', {
      value: realSetTimeout,
      configurable: true,
      writable: true,
    });
    jest.restoreAllMocks();
    __resetAmbientForTests();
  });

  it('unrefs a Node timer handle so a pending debounce holds nothing open', () => {
    const handles: ReturnType<typeof setTimeout>[] = [];
    jest.spyOn(globalThis, 'setTimeout').mockImplementation((...args: Parameters<typeof setTimeout>) => {
      const handle = realSetTimeout(...args);
      handles.push(handle);
      return handle;
    });

    ambientTheme.setAmbient(RED_SEED);

    expect(handles).toHaveLength(1);
    const handle = handles[0];
    // Positive control on the fixture itself: a handle that never had `hasRef`
    // would make the assertion below vacuous.
    expect(typeof handle?.hasRef).toBe('function');
    expect(handle?.hasRef()).toBe(false);
  });

  it('does not touch unref on a host whose setTimeout returns a number', () => {
    // React Native and the browser. `'unref' in 42` THROWS, so dropping any
    // clause of the guard fails here rather than in a consumer's app.
    Object.defineProperty(globalThis, 'setTimeout', {
      value: () => 42,
      configurable: true,
      writable: true,
    });

    expect(() => ambientTheme.setAmbient(RED_SEED)).not.toThrow();
    // The commit is still pending behind the (never-firing) fake timer, so the
    // schedule really did run rather than bailing out early.
    expect(ambientTheme.getState().seed).toBeNull();
    __flushAmbientForTests();
    expect(ambientTheme.getState().seed).toBe(RED_SEED);
  });
});
