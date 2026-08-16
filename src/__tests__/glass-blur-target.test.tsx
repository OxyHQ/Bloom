import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';

import { GlassBlurTargetProvider, GlassBlurWindow } from '../glass/blur-target';
import { Backdrop } from '../overlay';

/**
 * The blur target must be UNREACHABLE from a surface that shares a window with
 * the content it would blur, because that topology is not a visual bug — it is
 * `SIGSEGV` in `RenderThread`, measured on API 37 (`glass/blur-target.tsx`).
 *
 * Jest cannot rasterise a blur, and it certainly cannot segfault, so what it
 * gates here is the one thing it CAN see and the one thing that decides the
 * outcome: whether `blurTarget` and `blurMethod` reach the `BlurView` at all.
 * They travel together or not at all, and "not at all" is the default.
 *
 * The mechanism is Android-only, so every case here sets `Platform.OS` first.
 * Get that wrong and the suite runs against the non-Android pass-through and
 * passes while asserting nothing — which is why the first case asserts the
 * props are PRESENT. It is the positive control that gives the four "absent"
 * assertions their meaning.
 */

const REAL_OS = Platform.OS;

function setPlatform(os: 'android' | 'ios') {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
}

afterEach(() => setPlatform(REAL_OS as 'ios'));

/** The props the `BlurView` inside a rendered `Backdrop` actually received. */
function blurProps(tree: ReturnType<typeof render>): Record<string, unknown> {
  const blur = tree.UNSAFE_getAllByType('BlurView' as never);
  const first = blur[0];
  // Not an `expect`: every case below reads these props, so a Backdrop that
  // rendered no BlurView at all must fail LOUDLY here rather than hand back an
  // empty object whose every `toBeUndefined()` would pass.
  if (!first) throw new Error('Backdrop rendered no BlurView — nothing to assert about');
  return first.props as Record<string, unknown>;
}

describe('the Android blur target is unreachable outside a window boundary', () => {
  it('reaches a Backdrop that has crossed one — the positive control for every case below', () => {
    setPlatform('android');
    const tree = render(
      <GlassBlurTargetProvider>
        <GlassBlurWindow>
          <Backdrop onPress={() => {}} />
        </GlassBlurWindow>
      </GlassBlurTargetProvider>,
    );
    const props = blurProps(tree);
    // If this ever stops holding, every "absent" assertion below becomes
    // vacuous — they would all pass against a build that never wires anything.
    expect(props.blurMethod).toBe('dimezisBlurView');
    expect(props.blurTarget).toBeDefined();
  });

  it('does NOT reach a Backdrop in the app’s own window, even with a provider mounted', () => {
    setPlatform('android');
    const tree = render(
      <GlassBlurTargetProvider>
        <Backdrop onPress={() => {}} />
      </GlassBlurTargetProvider>,
    );
    const props = blurProps(tree);
    // This is the crash. A target here would point at an ancestor of this very
    // BlurView.
    expect(props.blurTarget).toBeUndefined();
    expect(props.blurMethod).toBeUndefined();
  });

  it('does not reach a Backdrop when no provider is mounted, and the surface still paints', () => {
    setPlatform('android');
    const tree = render(
      <GlassBlurWindow>
        <Backdrop onPress={() => {}} />
      </GlassBlurWindow>,
    );
    const props = blurProps(tree);
    expect(props.blurTarget).toBeUndefined();
    expect(props.blurMethod).toBeUndefined();
    // The degraded path is a real surface, not an empty one: the tint still has
    // its intensity, so a consumer who never adopts the provider loses the blur
    // and nothing else.
    expect(props.intensity).toBeGreaterThan(0);
  });

  it('never wires anything off Android, where no target exists to point at', () => {
    setPlatform('ios');
    const tree = render(
      <GlassBlurTargetProvider>
        <GlassBlurWindow>
          <Backdrop onPress={() => {}} />
        </GlassBlurWindow>
      </GlassBlurTargetProvider>,
    );
    const props = blurProps(tree);
    expect(props.blurTarget).toBeUndefined();
    expect(props.blurMethod).toBeUndefined();
  });

  it('adds no wrapping node off Android', () => {
    setPlatform('ios');
    const iosTree = render(
      <GlassBlurTargetProvider>
        <Backdrop onPress={() => {}} />
      </GlassBlurTargetProvider>,
    );
    expect(iosTree.UNSAFE_queryAllByType('BlurTargetView' as never)).toHaveLength(0);

    setPlatform('android');
    const androidTree = render(
      <GlassBlurTargetProvider>
        <Backdrop onPress={() => {}} />
      </GlassBlurTargetProvider>,
    );
    // …and exactly one where it is load-bearing, so the assertion above is
    // about the platform rather than about the query never matching.
    expect(androidTree.UNSAFE_queryAllByType('BlurTargetView' as never)).toHaveLength(1);
  });
});
