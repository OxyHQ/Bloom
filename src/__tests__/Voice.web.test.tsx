/**
 * @jest-environment jsdom
 */

/**
 * The voice family in the DOM react-native-web produces: what a screen reader
 * and a keyboard actually meet. Prop-level assertions cannot see any of it —
 * `accessibilityState` never reaches the DOM, and focus, Escape and `inert` are
 * DOM behaviour — so this runs against the REAL react-native-web.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// Jest resolves no platform forks: use the ones a web bundle gets.
jest.mock('../portal', () => jest.requireActual('../portal/index.web'));
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { Text } from 'react-native';

import { OverlayInertBoundary } from '../overlay';
import { resetModalOverlays } from '../overlay/modal-registry';
import { resetOverlayStack } from '../overlay/stack';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { VoiceControls, VoiceOverlay, type VoiceOverlayProps } from '../voice';
import { VOICE_MESSAGES } from '../voice/messages';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const en = VOICE_MESSAGES.en;

let container: HTMLDivElement;
let root: Root;
let opener: HTMLButtonElement;

beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  resetModalOverlays();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  opener = document.createElement('button');
  opener.textContent = 'Talk';
  document.body.appendChild(opener);
  opener.focus();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  opener.remove();
  jest.useRealTimers();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  // The initial-focus frame, and anything the content scheduled.
  act(() => jest.runOnlyPendingTimers());
}

const byLabel = (name: string) => document.querySelector<HTMLElement>(`[aria-label="${name}"]`);
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

function pressEscape() {
  act(() => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  });
  act(() => jest.runOnlyPendingTimers());
}

describe('VoiceControls on web', () => {
  it('emits aria-pressed on the toggles and keeps their names fixed', () => {
    mount(<VoiceControls onMutedChange={() => {}} onPausedChange={() => {}} />);
    expect(byLabel(en.mute)?.getAttribute('aria-pressed')).toBe('false');
    expect(byLabel(en.pause)?.getAttribute('aria-pressed')).toBe('false');
    mount(<VoiceControls muted paused onMutedChange={() => {}} onPausedChange={() => {}} />);
    expect(byLabel(en.mute)?.getAttribute('aria-pressed')).toBe('true');
    expect(byLabel(en.pause)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('puts no pressed state on the plain actions', () => {
    mount(<VoiceControls onEnd={() => {}} onTypeInstead={() => {}} />);
    expect(byLabel(en.end)?.hasAttribute('aria-pressed')).toBe(false);
    expect(byLabel(en.typeInstead)?.hasAttribute('aria-pressed')).toBe(false);
  });

  it('renders real, named buttons in a named toolbar', () => {
    mount(<VoiceControls onMutedChange={() => {}} onEnd={() => {}} />);
    expect(byLabel(en.mute)?.tagName).toBe('BUTTON');
    expect(byLabel(en.end)?.tagName).toBe('BUTTON');
    expect(document.querySelector('[role="toolbar"]')?.getAttribute('aria-label')).toBe(
      en.controls,
    );
  });

  it('disables mute while the session is not live, and fires when it is', () => {
    const onMutedChange = jest.fn();
    mount(<VoiceControls state="idle" onMutedChange={onMutedChange} />);
    expect(byLabel(en.mute)?.hasAttribute('disabled')).toBe(true);
    mount(<VoiceControls state="listening" onMutedChange={onMutedChange} />);
    act(() => byLabel(en.mute)?.click());
    expect(onMutedChange).toHaveBeenCalledWith(true);
  });
});

describe('VoiceOverlay on web', () => {
  function Host(props: Partial<VoiceOverlayProps> & { onChange?: (open: boolean) => void }) {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <OverlayInertBoundary testID="app">
          <Text>Home feed</Text>
        </OverlayInertBoundary>
        <VoiceOverlay
          levels={[]}
          state="listening"
          {...props}
          open={open}
          onOpenChange={(next) => {
            props.onChange?.(next);
            setOpen(next);
          }}
        />
      </>
    );
  }

  it('is a named modal dialog with a polite status line', () => {
    mount(<Host />);
    const panel = dialog();
    expect(panel?.getAttribute('aria-modal')).toBe('true');
    expect(panel?.getAttribute('aria-label')).toBe(en.voiceMode);
    const status = document.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toBe(en.status.listening);
  });

  it('hides the wave from assistive technology', () => {
    mount(<Host />);
    expect(dialog()?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('moves focus into the overlay and makes the app behind it inert', () => {
    mount(<Host onMutedChange={() => {}} onEnd={() => {}} />);
    expect(dialog()?.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(byLabel(en.mute));
    expect(document.querySelector('[data-testid="app"]')?.hasAttribute('inert')).toBe(true);
  });

  it('closes on Escape and gives focus back to the opener', () => {
    const onChange = jest.fn();
    mount(<Host onChange={onChange} onEnd={() => {}} />);
    pressEscape();
    expect(onChange).toHaveBeenCalledWith(false);
    act(() => jest.runAllTimers());
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.querySelector('[data-testid="app"]')?.hasAttribute('inert')).toBe(false);
  });

  it('keeps Tab inside the overlay', () => {
    mount(<Host onMutedChange={() => {}} onEnd={() => {}} />);
    const end = byLabel(en.end);
    act(() => end?.focus());
    act(() => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      );
    });
    expect(dialog()?.contains(document.activeElement)).toBe(true);
  });

  it('shows a failed session as words, and ends it from the keyboard', () => {
    const onEnd = jest.fn();
    mount(<Host state="error" error="The microphone is busy" onEnd={onEnd} />);
    expect(document.querySelector('[role="status"]')?.textContent).toBe('The microphone is busy');
    act(() => byLabel(en.end)?.click());
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
