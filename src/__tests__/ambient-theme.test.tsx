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
