import React from 'react';
import { render } from '@testing-library/react-native';

const mockRepeat = jest.fn((value: unknown) => value);
const mockCancel = jest.fn();
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('../../__mocks__/react-native-reanimated'),
  __esModule: true,
  withRepeat: (...args: unknown[]) => mockRepeat(args[0]),
  cancelAnimation: (...args: unknown[]) => mockCancel(...args),
}));
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: jest.fn(() => false),
}));
import { MicButton } from '../composer-panel/ComposerControls';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import type { ComposerVoiceState } from '../composer-panel/types';

const scene = (state: ComposerVoiceState) => (
  <BloomThemeProvider mode="light">
    <MicButton
      state={state}
      label="Dictate"
      transcribingLabel="Transcribing"
      onToggle={() => {}}
      palette={{ accent500: '#166534', iconPrimary: '#111111' }}
    />
  </BloomThemeProvider>
);
beforeEach(() => {
  mockRepeat.mockClear();
  mockCancel.mockClear();
  jest.mocked(usePrefersReducedMotion).mockReturnValue(false);
});
it('only runs the four equalizer clocks while recording and cancels them when hidden', () => {
  const view = render(scene('idle'));
  expect(mockRepeat).not.toHaveBeenCalled();
  view.rerender(scene('recording'));
  expect(mockRepeat).toHaveBeenCalledTimes(4);
  const cancellationCount = mockCancel.mock.calls.length;
  view.rerender(scene('idle'));
  expect(mockCancel.mock.calls.length - cancellationCount).toBe(4);
  expect(mockRepeat).toHaveBeenCalledTimes(4);
  view.rerender(scene('transcribing'));
  expect(mockRepeat).toHaveBeenCalledTimes(4);
  view.rerender(scene('recording'));
  expect(mockRepeat).toHaveBeenCalledTimes(8);
});
it('keeps recording bars static under reduced motion', () => {
  jest.mocked(usePrefersReducedMotion).mockReturnValue(true);
  render(scene('recording'));
  expect(mockRepeat).not.toHaveBeenCalled();
});
