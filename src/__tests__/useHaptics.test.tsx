import React from 'react';
import { Platform } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics';

import { BloomHapticsProvider, useHaptics } from '../hooks/useHaptics';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.clearAllMocks();
});

describe('useHaptics', () => {
  it('returns a callback', () => {
    const { result } = renderHook(() => useHaptics());
    expect(typeof result.current).toBe('function');
  });

  it('fires the mapped impact style on iOS', () => {
    Platform.OS = 'ios';
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('heavy'));
    expect(impactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Heavy);
  });

  it('defaults to the light impact', () => {
    Platform.OS = 'ios';
    const { result } = renderHook(() => useHaptics());
    act(() => result.current());
    expect(impactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light);
  });

  it('clamps to the light impact on Android regardless of strength', () => {
    Platform.OS = 'android';
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('heavy'));
    expect(impactAsync).toHaveBeenCalledWith(ImpactFeedbackStyle.Light);
  });

  it('no-ops on web', () => {
    Platform.OS = 'web';
    const { result } = renderHook(() => useHaptics());
    act(() => result.current('medium'));
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it('no-ops when disabled via BloomHapticsProvider', () => {
    Platform.OS = 'ios';
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BloomHapticsProvider enabled={false}>{children}</BloomHapticsProvider>
    );
    const { result } = renderHook(() => useHaptics(), { wrapper });
    act(() => result.current('medium'));
    expect(impactAsync).not.toHaveBeenCalled();
  });
});
