import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import type {
  EntryOrExitLayoutType,
  LayoutAnimation,
} from 'react-native-reanimated';

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
  ScreenTransition,
  ShrinkAndPop,
} from '../motion';

// The reanimated mock resolves `withTiming(v)` -> v, `withDelay(d, v)` -> v and
// `withSequence(...v)` -> last, so the builder output is deterministic.

/**
 * The presets are typed as reanimated's `entering`/`exiting` union so the two
 * platform files present ONE contract and nothing can depend on the mechanism.
 * These tests are about the native mechanism specifically, so they narrow back
 * down through a runtime check rather than a cast: a predefined builder is a
 * class (it carries the `createInstance` static), a custom worklet builder is a
 * plain function.
 */
const isWorkletBuilder = (
  preset: EntryOrExitLayoutType,
): preset is () => LayoutAnimation =>
  // A predefined builder is a class and carries the `createInstance` static; a
  // custom worklet builder is a plain nullary function.
  typeof preset === 'function' &&
  !('createInstance' in preset) &&
  preset.length === 0;

const runNativeBuilder = (preset: EntryOrExitLayoutType): LayoutAnimation => {
  if (!isWorkletBuilder(preset)) {
    throw new Error('expected the native preset to be a custom worklet builder');
  }
  return preset();
};

describe('motion presets', () => {
  it('ScaleAndFadeIn enters from 70% scale and transparent', () => {
    const { initialValues, animations } = runNativeBuilder(ScaleAndFadeIn);
    expect(initialValues).toEqual({ opacity: 0, transform: [{ scale: 0.7 }] });
    expect(animations).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
  });

  it('ScaleAndFadeOut exits to 70% scale and transparent', () => {
    const { initialValues, animations } = runNativeBuilder(ScaleAndFadeOut);
    expect(initialValues).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
    expect(animations).toEqual({ opacity: 0, transform: [{ scale: 0.7 }] });
  });

  it('ShrinkAndPop overshoots to 110% before leaving', () => {
    const { initialValues, animations } = runNativeBuilder(ShrinkAndPop);
    expect(initialValues).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
    // withSequence resolves to its final keyframe (the 1.1 overshoot) in the mock.
    expect(animations.transform).toEqual([{ scale: 1.1 }]);
  });
});

describe('ScreenTransition', () => {
  it('carries a displayName', () => {
    expect(ScreenTransition.displayName).toBe('ScreenTransition');
  });

  it('renders its children for a forward transition', () => {
    const { getByText } = render(
      <ScreenTransition direction="forward">
        <Text>Screen body</Text>
      </ScreenTransition>,
    );
    expect(getByText('Screen body')).toBeTruthy();
  });

  it('renders its children for a backward transition', () => {
    const { getByText } = render(
      <ScreenTransition direction="backward" enabledWeb>
        <Text>Back</Text>
      </ScreenTransition>,
    );
    expect(getByText('Back')).toBeTruthy();
  });
});
