/**
 * @jest-environment jsdom
 *
 * `ComposerPill`'s attachments, voice state, error and disabled add-menu rows,
 * through the REAL react-native-web: every property here is an attribute a
 * screen reader reads, which a prop-level test on the native preset never sees
 * (`accessibilityState` and friends are dropped on web, `aria-*` is not).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ComposerPanel, ComposerPill } from '../composer-panel';
import type { ComposerPanelAttachment } from '../composer-panel';
import { isComposerEmpty } from '../composer-panel/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

// The menus open in a portal, outside `container`.
function byLabel(label: string): HTMLElement {
  const found = document.body.querySelector(`[aria-label="${label}"]`);
  if (!found) throw new Error(`nothing named "${label}" in the document`);
  return found as HTMLElement;
}

function queryLabel(label: string): HTMLElement | null {
  return document.body.querySelector(`[aria-label="${label}"]`);
}

function click(element: HTMLElement) {
  act(() => element.click());
}

const photo: ComposerPanelAttachment = { id: 'p', name: 'Photo.png', kind: 'image' };

describe('isComposerEmpty — the one rule both composers ask', () => {
  it('is empty with no draft and no attachment', () => {
    expect(isComposerEmpty('', undefined)).toBe(true);
    expect(isComposerEmpty('   ', [])).toBe(true);
  });

  it('is not empty with a draft, or with a lone attachment', () => {
    expect(isComposerEmpty('hi', [])).toBe(false);
    expect(isComposerEmpty('', [photo])).toBe(false);
  });
});

describe('ComposerPill — attachments', () => {
  it('draws the strip inside the pill and dismisses by id', () => {
    const onRemove = jest.fn();
    mount(<ComposerPill testID="pill" attachments={[photo]} onRemoveAttachment={onRemove} />);
    const pill = container.querySelector('[data-testid="pill"]') as HTMLElement;
    const dismiss = within(pill, 'Remove Photo.png');
    click(dismiss);
    expect(onRemove).toHaveBeenCalledWith('p');
  });

  it('keeps the capsule at rest and squares off to 26 while a strip is in it', () => {
    mount(<ComposerPill testID="pill" />);
    const pill = () => container.querySelector('[data-testid="pill"]') as HTMLElement;
    expect(getComputedStyle(pill()).borderTopLeftRadius).toBe('9999px');
    mount(<ComposerPill testID="pill" attachments={[photo]} onRemoveAttachment={() => {}} />);
    expect(getComputedStyle(pill()).borderTopLeftRadius).toBe('26px');
    expect(pill().querySelector('[aria-label="Remove Photo.png"]')).not.toBeNull();
  });

  it('retries a failed tile by id', () => {
    const onRetry = jest.fn();
    mount(
      <ComposerPill attachments={[{ ...photo, error: 'Too large' }]} onAttachmentRetry={onRetry} />,
    );
    click(byLabel('Retry Photo.png'));
    expect(onRetry).toHaveBeenCalledWith('p');
  });

  it('gives the empty slot back to send for a lone attachment, as the panel does', () => {
    const call = <div data-testid="call" />;
    mount(<ComposerPill emptyAction={call} />);
    expect(container.querySelector('[data-testid="call"]')).not.toBeNull();
    mount(<ComposerPill emptyAction={call} attachments={[photo]} />);
    expect(container.querySelector('[data-testid="call"]')).toBeNull();
    expect(byLabel('Send message')).toBeTruthy();

    mount(<ComposerPanel emptyAction={call} attachments={[photo]} />);
    expect(container.querySelector('[data-testid="call"]')).toBeNull();
  });

  it('sends a photo with no text', () => {
    const onSubmit = jest.fn();
    mount(<ComposerPill attachments={[photo]} onSubmit={onSubmit} />);
    click(byLabel('Send message'));
    expect(onSubmit).toHaveBeenCalledWith('');
  });
});

describe('ComposerPill — voice state', () => {
  it('moves idle to recording and back, pressed while recording', () => {
    const onChange = jest.fn();
    mount(<ComposerPill onVoiceStateChange={onChange} />);
    expect(byLabel('Voice input').getAttribute('aria-pressed')).toBe('false');
    click(byLabel('Voice input'));
    expect(onChange).toHaveBeenLastCalledWith('recording');
    expect(byLabel('Voice input').getAttribute('aria-pressed')).toBe('true');
    click(byLabel('Voice input'));
    expect(onChange).toHaveBeenLastCalledWith('idle');
  });

  it('is controlled: the state it is given is the state it draws', () => {
    mount(<ComposerPill voiceState="recording" />);
    expect(byLabel('Voice input').getAttribute('aria-pressed')).toBe('true');
  });

  it('transcribing is busy, disabled, renamed and announced', () => {
    const onChange = jest.fn();
    mount(<ComposerPill voiceState="transcribing" onVoiceStateChange={onChange} />);
    const mic = byLabel('Transcribing');
    expect(mic.getAttribute('aria-busy')).toBe('true');
    expect(mic.hasAttribute('disabled') || mic.getAttribute('aria-disabled') === 'true').toBe(true);
    expect(queryLabel('Voice input')).toBeNull();
    const status = container.querySelector('[role="status"]') as HTMLElement;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Transcribing');
    click(mic);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('announces nothing while not transcribing', () => {
    mount(<ComposerPill />);
    expect((container.querySelector('[role="status"]') as HTMLElement).textContent).toBe('');
  });

  it('the panel speaks the same states', () => {
    mount(<ComposerPanel voiceState="transcribing" />);
    expect(byLabel('Transcribing').getAttribute('aria-busy')).toBe('true');
  });
});

describe('ComposerPill — error', () => {
  it('a string marks the field invalid and is announced assertively', () => {
    mount(<ComposerPill testID="pill" error="Message too long" />);
    expect(byLabel('Message').getAttribute('aria-invalid')).toBe('true');
    const alert = container.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toBe('Message too long');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });

  it('true marks the field without drawing a message', () => {
    mount(<ComposerPill error />);
    expect(byLabel('Message').getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('is controlled: it stays until the host clears it, and clearing removes everything', () => {
    mount(<ComposerPill defaultValue="x" error="Nope" />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    mount(<ComposerPill defaultValue="x" />);
    expect(byLabel('Message').hasAttribute('aria-invalid')).toBe(false);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

describe('Add menu — disabled rows', () => {
  const addMenu = [
    {
      label: 'Add',
      rows: [
        { id: 'files', label: 'Files' },
        { id: 'code', label: 'Code', description: 'Needs a project', disabled: true },
      ],
    },
  ];

  it('announces a disabled row as disabled, with its reason, and never selects it', () => {
    const onSelect = jest.fn();
    mount(<ComposerPill addMenu={addMenu} onAddMenuSelect={onSelect} />);
    click(byLabel('Add attachment'));

    const row = byLabel('Code Needs a project');
    expect(row.hasAttribute('disabled') || row.getAttribute('aria-disabled') === 'true').toBe(true);
    click(row);
    expect(onSelect).not.toHaveBeenCalled();
    // The menu stays open: a refused press is not a choice.
    expect(queryLabel('Files')).not.toBeNull();

    click(byLabel('Files'));
    expect(onSelect).toHaveBeenCalledWith('files');
  });
});

function within(scope: HTMLElement, label: string): HTMLElement {
  const found = scope.querySelector(`[aria-label="${label}"]`);
  if (!found) throw new Error(`nothing named "${label}" inside the pill`);
  return found as HTMLElement;
}
