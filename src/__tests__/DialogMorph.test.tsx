import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';

import {
  DialogMorphContent,
  useDialogFrame,
  useDialogMorph,
} from '../dialog/DialogMorph';

/**
 * Size morphing across an in-place content swap.
 *
 * These assert the STATE MACHINE — when the panel height is taken over and when
 * it is handed back to natural sizing. The reanimated mock settles `withTiming`
 * synchronously, so the frame-by-frame interpolation is NOT observable here; it
 * is verified in a real browser, the only place reanimated's web mapper ticks.
 */

const layout = (height: number): LayoutChangeEvent =>
  ({
    nativeEvent: { layout: { x: 0, y: 0, width: 320, height } },
  }) as LayoutChangeEvent;

interface HarnessProps {
  morphEnabled?: boolean;
  measurable?: boolean;
  frameKey: string;
  frameMorph?: boolean;
  onState: (state: {
    panelStyle: ViewStyle;
    onPanelLayout: (e: LayoutChangeEvent) => void;
    onContentLayout: (e: LayoutChangeEvent) => void;
  }) => void;
}

/** Drives one surface: measurement in, panel style + a frame-declaring child out. */
function Harness({
  morphEnabled = true,
  measurable = true,
  frameKey,
  frameMorph,
  onState,
}: HarnessProps) {
  const morph = useDialogMorph({ enabled: morphEnabled, measurable, maxHeight: 800 });
  onState({
    panelStyle: morph.panelStyle as ViewStyle,
    onPanelLayout: morph.onPanelLayout,
    onContentLayout: morph.onContentLayout,
  });
  return (
    <DialogMorphContent morph={morph}>
      <Frame frameKey={frameKey} frameMorph={frameMorph} />
    </DialogMorphContent>
  );
}

function Frame({ frameKey, frameMorph }: { frameKey: string; frameMorph?: boolean }) {
  useDialogFrame({ key: frameKey, morph: frameMorph });
  return null;
}

/** Mount the harness and return a handle for driving layout + swapping frames. */
function mountHarness(props: Omit<Partial<HarnessProps>, 'onState' | 'frameKey'> = {}) {
  let state: Parameters<HarnessProps['onState']>[0] | null = null;
  const onState: HarnessProps['onState'] = (next) => {
    state = next;
  };
  const element = (frameKey: string, extra: Omit<Partial<HarnessProps>, 'onState'> = {}) => (
    <Harness frameKey={frameKey} onState={onState} {...props} {...extra} />
  );
  const { rerender, unmount } = render(element('a'));
  const read = () => {
    if (!state) throw new Error('harness did not render');
    return state;
  };
  return {
    /** The panel height the surface currently resolves to. */
    panelHeight: () => read().panelStyle.height,
    /** Report the panel's and then the content's laid-out heights. */
    measure(panelHeight: number, contentHeight: number) {
      act(() => {
        read().onPanelLayout(layout(panelHeight));
        read().onContentLayout(layout(contentHeight));
      });
    },
    /**
     * Report only the content's natural height (the incoming frame settling).
     * Followed by a re-render: the mock's `useAnimatedStyle` only re-evaluates
     * on render, whereas the real one re-runs on the shared-value write.
     */
    measureContent(contentHeight: number, frameKey = 'b') {
      act(() => read().onContentLayout(layout(contentHeight)));
      rerender(element(frameKey));
    },
    /** Declare a frame, then re-render so the resulting panel style is observable. */
    swapTo(frameKey: string, extra: Omit<Partial<HarnessProps>, 'onState'> = {}) {
      rerender(element(frameKey, extra));
      rerender(element(frameKey, extra));
    },
    unmount,
  };
}

describe('Dialog size morphing', () => {
  it('leaves the panel naturally sized until a frame actually changes', () => {
    const h = mountHarness();
    expect(h.panelHeight()).toBe('auto');

    h.measure(300, 298);
    expect(h.panelHeight()).toBe('auto');

    // Re-declaring the SAME frame is not a swap.
    h.swapTo('a');
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('pins the panel at the outgoing size, then releases onto the incoming one', () => {
    const h = mountHarness();
    h.measure(300, 298);

    h.swapTo('b');
    // Held at the size the outgoing frame was painted at — no jump while the
    // incoming content is still being measured.
    expect(h.panelHeight()).toBe(300);

    // The incoming frame reports 500 of natural height; the panel carries the
    // 2px of chrome calibrated from the outgoing frame, then hands the height
    // back so later content changes size the panel normally again.
    h.measureContent(500);
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('releases the pin even when the incoming frame is taller than the bound', () => {
    const h = mountHarness();
    h.measure(300, 300);
    h.swapTo('b');
    expect(h.panelHeight()).toBe(300);

    h.measureContent(5000);
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('releases without reshaping when the incoming frame fills the space it is given', () => {
    const h = mountHarness();
    h.measure(300, 300);
    h.swapTo('b');
    expect(h.panelHeight()).toBe(300);

    // A child that flexes to its container measures ~0 inside a content-sized
    // wrapper; collapsing the panel onto that would empty the surface.
    h.measureContent(0);
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('never pins when nothing has been measured yet', () => {
    const h = mountHarness();
    h.swapTo('b');
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('honours the per-frame morph opt-out', () => {
    const h = mountHarness();
    h.measure(300, 300);
    h.swapTo('b', { frameMorph: false });
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('honours the surface-level morph opt-out', () => {
    const h = mountHarness({ morphEnabled: false });
    h.measure(300, 300);
    h.swapTo('b');
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('does not pin a surface whose content owns its own size', () => {
    const h = mountHarness({ measurable: false });
    h.measure(300, 300);
    h.swapTo('b');
    expect(h.panelHeight()).toBe('auto');
    h.unmount();
  });

  it('drives maxWidth only on a placement that can vary it', () => {
    let fixedWidth: ViewStyle | null = null;
    let varyingWidth: ViewStyle | null = null;
    render(
      <WidthHarness
        onStyle={(s) => {
          fixedWidth = s;
        }}
      />,
    );
    render(
      <WidthHarness
        maxWidth={480}
        onStyle={(s) => {
          varyingWidth = s;
        }}
      />,
    );
    expect((fixedWidth as unknown as ViewStyle).maxWidth).toBeUndefined();
    expect((varyingWidth as unknown as ViewStyle).maxWidth).toBe(480);
  });
});

function WidthHarness({
  maxWidth,
  onStyle,
}: {
  maxWidth?: number;
  onStyle: (style: ViewStyle) => void;
}) {
  const morph = useDialogMorph({ enabled: true, measurable: true, maxHeight: 800, maxWidth });
  onStyle(morph.panelStyle as ViewStyle);
  return null;
}

describe('useDialogFrame outside a morph-capable surface', () => {
  it('is a no-op (a side sheet, or a plain confirm dialog)', () => {
    expect(() => render(<Frame frameKey="only" />)).not.toThrow();
  });
});
