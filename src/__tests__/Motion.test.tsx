import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
  ScreenTransition,
  ShrinkAndPop,
} from '../motion';

// The reanimated mock resolves `withTiming(v)` -> v, `withDelay(d, v)` -> v and
// `withSequence(...v)` -> last, so the builder output is deterministic.

describe('motion presets', () => {
  it('ScaleAndFadeIn enters from 70% scale and transparent', () => {
    const { initialValues, animations } = ScaleAndFadeIn();
    expect(initialValues).toEqual({ opacity: 0, transform: [{ scale: 0.7 }] });
    expect(animations).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
  });

  it('ScaleAndFadeOut exits to 70% scale and transparent', () => {
    const { initialValues, animations } = ScaleAndFadeOut();
    expect(initialValues).toEqual({ opacity: 1, transform: [{ scale: 1 }] });
    expect(animations).toEqual({ opacity: 0, transform: [{ scale: 0.7 }] });
  });

  it('ShrinkAndPop overshoots to 110% before leaving', () => {
    const { initialValues, animations } = ShrinkAndPop();
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
