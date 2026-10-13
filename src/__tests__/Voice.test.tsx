/**
 * The voice family on the native tree: the wave, the control row and the overlay.
 *
 * The reanimated mock has no UI thread, so this file gives it the two pieces the
 * wave depends on and nothing else: a frame clock the test ticks by hand, and a
 * `useAnimatedStyle` that re-evaluates when the clock ticks (the real one re-runs
 * its mapper when a shared value in its deps changes). Everything between a
 * level and a bar's height is the real code.
 */
import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockClock: {
  callback: ((frame: { timeSincePreviousFrame: number | null }) => void) | null;
  active: boolean;
} = { callback: null, active: false };
const mockRestyle = new Set<() => void>();
const mockFlags = { reducedMotion: false, restyle: true };

jest.mock('react-native-reanimated', () => {
  const React = require('react') as typeof import('react');
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...base,
    __esModule: true,
    useReducedMotion: () => mockFlags.reducedMotion,
    useFrameCallback: (callback: typeof mockClock.callback, autostart = true) => {
      mockClock.callback = callback;
      const handle = React.useRef({
        setActive: (active: boolean) => {
          mockClock.active = active;
        },
      });
      React.useEffect(() => {
        mockClock.active = autostart;
      }, [autostart]);
      return handle.current;
    },
    useAnimatedStyle: (mapper: () => Record<string, unknown>) => {
      const [, tick] = React.useReducer((n: number) => n + 1, 0);
      React.useEffect(() => {
        if (!mockFlags.restyle) return;
        mockRestyle.add(tick);
        return () => void mockRestyle.delete(tick);
      }, []);
      return mapper();
    },
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal';
import { resetOverlayStack } from '../overlay/stack';
import { AudioWaveVisualizer, VoiceControls, VoiceOverlay, type VoiceState } from '../voice';
import { resampleLevels } from '../voice/levels';
import { WAVE_METRICS } from '../voice/constants';
import { VOICE_MESSAGES } from '../voice/messages';
import { findHost, renderedChildren, resolvedStyle, type HostNode } from './support/rendered-style';

const en = VOICE_MESSAGES.en;
const ALL_STATES: VoiceState[] = [
  'idle',
  'listening',
  'transcribing',
  'thinking',
  'speaking',
  'error',
];

function wrap(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <PortalProvider>
        {ui}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}
const mount = (ui: React.ReactElement) => render(wrap(ui));

/** One frame on the wave's clock (when it is running), long enough that the ease has landed. */
function frame(dt = 10_000) {
  act(() => {
    if (mockClock.active) mockClock.callback?.({ timeSincePreviousFrame: dt });
    for (const restyle of [...mockRestyle]) restyle();
  });
}

/** The host node with this testID in the current render. */
function host(view: ReturnType<typeof render>, testID: string): HostNode {
  const node = findHost(view.toJSON(), testID);
  if (!node) throw new Error(`no host rendered for testID "${testID}"`);
  return node;
}

let current: ReturnType<typeof render>;
function barHeights(testID: string): number[] {
  return renderedChildren(current.toJSON(), testID).map(
    (bar) => resolvedStyle(bar.props.style).height as number,
  );
}

beforeEach(() => {
  mockClock.callback = null;
  mockClock.active = false;
  mockRestyle.clear();
  mockFlags.reducedMotion = false;
  mockFlags.restyle = true;
  resetOverlayStack();
});

describe('resampleLevels', () => {
  it('keeps the loudest level of each slice when shrinking', () => {
    expect(resampleLevels([0.1, 0.9, 0.2, 0.3], 2)).toEqual([0.9, 0.3]);
  });

  it('stretches a short array across more bars', () => {
    expect(resampleLevels([0.2, 0.8], 4)).toEqual([0.2, 0.2, 0.8, 0.8]);
  });

  it('treats empty, negative, NaN and over-range levels as silence or full', () => {
    expect(resampleLevels([], 3)).toEqual([0, 0, 0]);
    expect(resampleLevels([-1, Number.NaN, 4], 3)).toEqual([0, 0, 1]);
  });
});

describe('AudioWaveVisualizer', () => {
  const { bar, height } = WAVE_METRICS.md;

  function wave(props: Partial<React.ComponentProps<typeof AudioWaveVisualizer>>) {
    const view = mount(<AudioWaveVisualizer testID="wave" levels={[]} {...props} />);
    current = view;
    return view;
  }

  it('draws `bars` bars, all at rest before any level arrives', () => {
    wave({ bars: 5 });
    expect(barHeights('wave')).toEqual([bar, bar, bar, bar, bar]);
  });

  it('is hidden from assistive technology', () => {
    const view = wave({});
    const root = host(view, 'wave');
    expect(root.props['aria-hidden']).toBe(true);
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('follows a plain array, resampled to the bar count', () => {
    const view = wave({ bars: 4, levels: [1, 0] });
    frame();
    expect(barHeights('wave')).toEqual([height, height, bar, bar]);
    view.rerender(wrap(<AudioWaveVisualizer testID="wave" bars={4} levels={[0, 1]} />));
    frame();
    expect(barHeights('wave')).toEqual([bar, bar, height, height]);
  });

  it('follows a shared value written after mount, with no render of its own', () => {
    const levels = { value: [0, 0, 0] } as { value: readonly number[] };
    let commits = 0;
    mockFlags.restyle = false;
    const view = render(
      wrap(
        <React.Profiler id="wave" onRender={() => commits++}>
          <AudioWaveVisualizer testID="wave" bars={3} levels={levels as never} />
        </React.Profiler>,
      ),
    );
    const before = commits;
    levels.value = [1, 0.5, 0];
    frame();
    frame();
    // The clock read the shared value and wrote its own: nothing in React moved.
    expect(commits).toBe(before);
    expect(view.toJSON()).toBeTruthy();
  });

  it('shows the written levels once the bars restyle', () => {
    const levels = { value: [0, 0, 0] } as { value: readonly number[] };
    current = mount(<AudioWaveVisualizer testID="wave" bars={3} levels={levels as never} />);
    levels.value = [1, 0.5, 0];
    frame();
    expect(barHeights('wave')).toEqual([height, bar + (height - bar) * 0.5, bar]);
  });

  it('eases toward the target instead of jumping', () => {
    wave({ bars: 1, levels: [1] });
    frame(90);
    const [eased] = barHeights('wave');
    expect(eased).toBeGreaterThan(bar);
    expect(eased).toBeLessThan(height);
  });

  it('survives its levels growing, shrinking and emptying', () => {
    const view = wave({ bars: 6, levels: [0.5] });
    for (const levels of [Array.from({ length: 64 }, () => 0.7), [0.2, 0.4], []]) {
      view.rerender(wrap(<AudioWaveVisualizer testID="wave" bars={6} levels={levels} />));
      frame();
      expect(barHeights('wave')).toHaveLength(6);
    }
    expect(barHeights('wave')).toEqual(new Array(6).fill(bar));
  });

  it('resizes when `bars` changes', () => {
    const view = wave({ bars: 3, levels: [1] });
    view.rerender(wrap(<AudioWaveVisualizer testID="wave" bars={8} levels={[1]} />));
    frame();
    expect(barHeights('wave')).toHaveLength(8);
  });

  it('rests, with the clock parked, while inactive', () => {
    wave({ bars: 3, levels: [1], active: false });
    expect(mockClock.active).toBe(false);
    frame();
    expect(barHeights('wave')).toEqual([bar, bar, bar]);
  });

  it('runs the clock while active', () => {
    wave({ bars: 3, levels: [1] });
    expect(mockClock.active).toBe(true);
  });

  it('is static under reduced motion', () => {
    mockFlags.reducedMotion = true;
    wave({ bars: 3, levels: [1, 1, 1] });
    expect(mockClock.active).toBe(false);
    expect(barHeights('wave')).toEqual([bar, bar, bar]);
  });

  it('sizes the row by `size`', () => {
    const view = mount(<AudioWaveVisualizer testID="wave" levels={[]} size="lg" />);
    expect(resolvedStyle(host(view, 'wave').props.style).height).toBe(WAVE_METRICS.lg.height);
  });

  it('lays out with logical flex only, so it mirrors in RTL', () => {
    const view = wave({});
    const style = resolvedStyle(host(view, 'wave').props.style);
    expect(style.flexDirection).toBe('row');
    for (const key of [
      'left',
      'right',
      'marginLeft',
      'marginRight',
      'paddingLeft',
      'paddingRight',
    ]) {
      expect(style).not.toHaveProperty(key);
    }
  });
});

describe('VoiceControls', () => {
  it('shows only the controls whose handler is given', () => {
    const view = mount(<VoiceControls />);
    expect(view.queryByLabelText(en.mute)).toBeNull();
    expect(view.queryByLabelText(en.end)).toBeNull();
    view.rerender(wrap(<VoiceControls onEnd={() => {}} onMutedChange={() => {}} />));
    expect(view.getByLabelText(en.mute)).toBeTruthy();
    expect(view.getByLabelText(en.end)).toBeTruthy();
    expect(view.queryByLabelText(en.pause)).toBeNull();
    expect(view.queryByLabelText(en.typeInstead)).toBeNull();
  });

  it('names the row as a toolbar', () => {
    const view = mount(<VoiceControls onEnd={() => {}} testID="controls" />);
    const row = host(view, 'controls');
    expect(row.props.role).toBe('toolbar');
    expect(row.props['aria-label']).toBe(en.controls);
  });

  it('fires each callback', () => {
    const onMutedChange = jest.fn();
    const onPausedChange = jest.fn();
    const onEnd = jest.fn();
    const onTypeInstead = jest.fn();
    const view = mount(
      <VoiceControls
        onMutedChange={onMutedChange}
        onPausedChange={onPausedChange}
        onEnd={onEnd}
        onTypeInstead={onTypeInstead}
      />,
    );
    fireEvent.press(view.getByLabelText(en.mute));
    fireEvent.press(view.getByLabelText(en.pause));
    fireEvent.press(view.getByLabelText(en.end));
    fireEvent.press(view.getByLabelText(en.typeInstead));
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(onPausedChange).toHaveBeenCalledWith(true);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onTypeInstead).toHaveBeenCalledTimes(1);
  });

  it('toggles back: a muted session asks to unmute', () => {
    const onMutedChange = jest.fn();
    const view = mount(
      <VoiceControls muted paused onMutedChange={onMutedChange} onPausedChange={onMutedChange} />,
    );
    fireEvent.press(view.getByLabelText(en.mute));
    fireEvent.press(view.getByLabelText(en.pause));
    expect(onMutedChange).toHaveBeenNthCalledWith(1, false);
    expect(onMutedChange).toHaveBeenNthCalledWith(2, false);
  });

  it('keeps the toggle name fixed and carries the state in `pressed`', () => {
    const view = mount(<VoiceControls onMutedChange={() => {}} />);
    expect(view.getByLabelText(en.mute).props['aria-pressed']).toBe(false);
    view.rerender(wrap(<VoiceControls muted onMutedChange={() => {}} />));
    expect(view.getByLabelText(en.mute).props['aria-pressed']).toBe(true);
  });

  it.each(['idle', 'error'] as const)('disables mute and pause while %s, never end', (state) => {
    const onEnd = jest.fn();
    const onMutedChange = jest.fn();
    const view = mount(
      <VoiceControls
        state={state}
        onMutedChange={onMutedChange}
        onPausedChange={onMutedChange}
        onEnd={onEnd}
      />,
    );
    expect(view.getByLabelText(en.mute).props.disabled).toBe(true);
    expect(view.getByLabelText(en.pause).props.disabled).toBe(true);
    expect(view.getByLabelText(en.end).props.disabled).toBe(false);
    fireEvent.press(view.getByLabelText(en.end));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('disables everything with `disabled`', () => {
    const view = mount(
      <VoiceControls disabled onMutedChange={() => {}} onEnd={() => {}} onTypeInstead={() => {}} />,
    );
    for (const name of [en.mute, en.end, en.typeInstead]) {
      expect(view.getByLabelText(name).props.disabled).toBe(true);
    }
  });

  it('renders the slots around the controls', () => {
    const { Text } = require('react-native') as typeof import('react-native');
    const view = mount(
      <VoiceControls
        onEnd={() => {}}
        leading={<Text>before</Text>}
        trailing={<Text>after</Text>}
      />,
    );
    expect(view.getByText('before')).toBeTruthy();
    expect(view.getByText('after')).toBeTruthy();
  });
});

describe('VoiceOverlay', () => {
  const base = { levels: [] as number[], onEnd: () => {} };

  it('renders nothing while closed', () => {
    const view = mount(<VoiceOverlay {...base} state="idle" testID="voice" />);
    expect(view.queryByTestId('voice')).toBeNull();
  });

  it('is a modal dialog with a name', () => {
    const view = mount(<VoiceOverlay {...base} open state="idle" testID="voice" />);
    const panel = host(view, 'voice');
    expect(panel.props.role).toBe('dialog');
    expect(panel.props['aria-modal']).toBe(true);
    expect(panel.props['aria-label']).toBe(en.voiceMode);
    view.rerender(
      wrap(<VoiceOverlay {...base} open state="idle" label="Talk to Alia" testID="voice" />),
    );
    expect(host(view, 'voice').props['aria-label']).toBe('Talk to Alia');
  });

  it.each(ALL_STATES)('announces the %s state in words, in a polite live region', (state) => {
    const view = mount(<VoiceOverlay {...base} open state={state} testID="voice" />);
    const status = host(view, 'voice-status');
    expect(status.props.role).toBe('status');
    expect(status.props['aria-live']).toBe('polite');
    expect(view.getByText(en.status[state])).toBeTruthy();
  });

  it('says so when listening with the microphone muted', () => {
    const view = mount(<VoiceOverlay {...base} open state="listening" muted testID="voice" />);
    expect(view.getByText(en.mutedStatus)).toBeTruthy();
  });

  it("shows the caller's error, and a default without one", () => {
    const view = mount(
      <VoiceOverlay {...base} open state="error" error="Mic is busy" testID="voice" />,
    );
    expect(view.getByText('Mic is busy')).toBeTruthy();
    view.rerender(wrap(<VoiceOverlay {...base} open state="error" testID="voice" />));
    expect(view.getByText(en.status.error)).toBeTruthy();
  });

  it('keeps the live region mounted across state changes, so each change is announced', () => {
    const view = mount(<VoiceOverlay {...base} open state="listening" testID="voice" />);
    const before = view.getByTestId('voice-status');
    view.rerender(wrap(<VoiceOverlay {...base} open state="thinking" testID="voice" />));
    expect(view.getByTestId('voice-status')).toBe(before);
    expect(view.getByText(en.status.thinking)).toBeTruthy();
  });

  it('grows the transcript as it streams, and lets children replace it', () => {
    const view = mount(
      <VoiceOverlay {...base} open state="listening" transcript="Move my" testID="voice" />,
    );
    expect(view.getByText('Move my')).toBeTruthy();
    view.rerender(
      wrap(
        <VoiceOverlay
          {...base}
          open
          state="listening"
          transcript="Move my meeting"
          testID="voice"
        />,
      ),
    );
    expect(view.getByText('Move my meeting')).toBeTruthy();
    const { Text } = require('react-native') as typeof import('react-native');
    view.rerender(
      wrap(
        <VoiceOverlay {...base} open state="listening" transcript="ignored" testID="voice">
          <Text>Custom caption</Text>
        </VoiceOverlay>,
      ),
    );
    expect(view.getByText('Custom caption')).toBeTruthy();
    expect(view.queryByText('ignored')).toBeNull();
  });

  it('draws the wave live only while sound is expected', () => {
    const { rerender } = mount(<VoiceOverlay {...base} open state="listening" testID="voice" />);
    expect(mockClock.active).toBe(true);
    rerender(wrap(<VoiceOverlay {...base} open state="listening" muted testID="voice" />));
    expect(mockClock.active).toBe(false);
    rerender(wrap(<VoiceOverlay {...base} open state="thinking" testID="voice" />));
    expect(mockClock.active).toBe(false);
    rerender(wrap(<VoiceOverlay {...base} open state="speaking" testID="voice" />));
    expect(mockClock.active).toBe(true);
  });

  it('passes the controls through', () => {
    const onMutedChange = jest.fn();
    const onEnd = jest.fn();
    const view = mount(
      <VoiceOverlay
        {...base}
        open
        state="listening"
        onMutedChange={onMutedChange}
        onEnd={onEnd}
        testID="voice"
      />,
    );
    fireEvent.press(view.getByLabelText(en.mute));
    fireEvent.press(view.getByLabelText(en.end));
    expect(onMutedChange).toHaveBeenCalledWith(true);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('opens and closes with `open`', () => {
    const view = mount(<VoiceOverlay {...base} open state="idle" testID="voice" />);
    expect(view.queryByTestId('voice')).toBeTruthy();
    view.rerender(wrap(<VoiceOverlay {...base} open={false} state="idle" testID="voice" />));
    expect(view.queryByTestId('voice')).toBeNull();
    view.rerender(wrap(<VoiceOverlay {...base} open state="idle" testID="voice" />));
    expect(view.queryByTestId('voice')).toBeTruthy();
  });

  it('closes at once under reduced motion', () => {
    mockFlags.reducedMotion = true;
    const view = mount(<VoiceOverlay {...base} open state="idle" testID="voice" />);
    view.rerender(wrap(<VoiceOverlay {...base} open={false} state="idle" testID="voice" />));
    expect(view.queryByTestId('voice')).toBeNull();
  });

  it('starts open from `defaultOpen`', () => {
    const view = mount(<VoiceOverlay {...base} defaultOpen state="idle" testID="voice" />);
    expect(view.queryByTestId('voice')).toBeTruthy();
  });

  describe('Android back', () => {
    let listeners: (() => boolean | null | undefined)[] = [];
    const platform = Platform.OS;
    beforeEach(() => {
      listeners = [];
      Platform.OS = 'android';
      (BackHandler as unknown as { addEventListener: unknown }).addEventListener = jest.fn(
        (_event: string, listener: () => boolean) => {
          listeners.push(listener);
          return {
            remove: () => {
              listeners = listeners.filter((l) => l !== listener);
            },
          };
        },
      );
    });
    afterEach(() => {
      Platform.OS = platform;
    });

    it('asks to close, and the overlay closes when the host agrees', () => {
      const onOpenChange = jest.fn();
      const view = mount(
        <VoiceOverlay {...base} open state="idle" onOpenChange={onOpenChange} testID="voice" />,
      );
      act(() => void listeners[listeners.length - 1]?.());
      expect(onOpenChange).toHaveBeenCalledWith(false);
      view.rerender(wrap(<VoiceOverlay {...base} open={false} state="idle" testID="voice" />));
      expect(view.queryByTestId('voice')).toBeNull();
      expect(listeners).toHaveLength(0);
    });

    it('closes an uncontrolled overlay itself', () => {
      const view = mount(<VoiceOverlay {...base} defaultOpen state="idle" testID="voice" />);
      act(() => void listeners[listeners.length - 1]?.());
      expect(view.queryByTestId('voice')).toBeNull();
    });
  });
});
