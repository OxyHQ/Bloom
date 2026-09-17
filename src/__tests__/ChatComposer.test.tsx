/**
 * @jest-environment jsdom
 *
 * `chat-composer`, rendered through the REAL react-native-web so the assertions
 * read the emitted DOM.
 *
 * Three of the defect classes here are invisible to a prop-level test:
 *   - the mic ↔ send swap keeps BOTH halves mounted, so "the send button is
 *     rendered" says nothing; what matters is which half is out of the
 *     accessibility tree.
 *   - `sendOn` is a decision about a DOM keydown, and the composer reads
 *     `shiftKey`/`metaKey` off `event.nativeEvent`, which only exists once
 *     react-native-web has made a synthetic event out of a real one.
 *   - `accessibilityState` is dropped entirely on web, so every state assertion
 *     below reads the `aria-*` ATTRIBUTE.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  ChatComposer,
  ComposerAttachmentStrip,
  ComposerBanner,
  EmojiPicker,
  ReactionPicker,
  SuggestionList,
  VoiceRecorder,
  applySkinTone,
  emojiChar,
  filterEmojiGroups,
  formatRecordingTime,
} from '../chat-composer';
import { waveformBars } from '../chat-composer/shared';
import type { ChatComposerSuggestion, EmojiGroup } from '../chat-composer/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

/** Is this node inside a subtree react-native-web has hidden from ARIA? */
function ariaHidden(el: HTMLElement): boolean {
  return el.closest('[aria-hidden="true"]') !== null;
}

function press(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function keyDown(el: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  });
}

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('formatRecordingTime', () => {
  it('formats m:ss, and h:mm:ss only once there is an hour', () => {
    expect(formatRecordingTime(0)).toBe('0:00');
    expect(formatRecordingTime(7)).toBe('0:07');
    expect(formatRecordingTime(61)).toBe('1:01');
    expect(formatRecordingTime(161)).toBe('2:41');
    expect(formatRecordingTime(3599)).toBe('59:59');
    expect(formatRecordingTime(3600)).toBe('1:00:00');
    expect(formatRecordingTime(3849)).toBe('1:04:09');
  });

  it('FLOORS rather than rounds — a meter must not show 0:01 before the first second', () => {
    expect(formatRecordingTime(0.9)).toBe('0:00');
    expect(formatRecordingTime(59.99)).toBe('0:59');
  });

  it('reads a bad clock as zero instead of throwing', () => {
    expect(formatRecordingTime(-5)).toBe('0:00');
    expect(formatRecordingTime(Number.NaN)).toBe('0:00');
    expect(formatRecordingTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('filterEmojiGroups', () => {
  const groups: EmojiGroup[] = [
    {
      key: 'smileys',
      label: 'Smileys',
      emojis: [
        { char: '😂', name: 'tears of joy', keywords: ['laugh'] },
        { char: '🙂', name: 'slight smile' },
      ],
    },
    { key: 'people', label: 'People', emojis: [{ char: '👍', name: 'thumbs up', keywords: ['ok'] }] },
    { key: 'bare', label: 'Bare', emojis: ['🎉', '🚀'] },
  ];

  it('returns the SAME array for an empty or whitespace query, so the un-searched grid does no work', () => {
    expect(filterEmojiGroups(groups, '')).toBe(groups);
    expect(filterEmojiGroups(groups, '   ')).toBe(groups);
  });

  it('matches on name and on keywords, case-insensitively', () => {
    expect(filterEmojiGroups(groups, 'JOY').map((g) => g.key)).toEqual(['smileys']);
    expect(filterEmojiGroups(groups, 'laugh')[0]?.emojis.map(emojiChar)).toEqual(['😂']);
    expect(filterEmojiGroups(groups, 'ok').map((g) => g.key)).toEqual(['people']);
  });

  it('drops groups with no surviving entry', () => {
    expect(filterEmojiGroups(groups, 'zzz')).toEqual([]);
  });

  it('matches a pasted GLYPH, which is all a bare-string dataset can be searched by', () => {
    expect(filterEmojiGroups(groups, '🎉').map((g) => g.key)).toEqual(['bare']);
    // The honest limit, asserted rather than left to be discovered: a bare
    // string carries no words, so a word query cannot reach it.
    expect(filterEmojiGroups(groups, 'party')).toEqual([]);
  });
});

describe('applySkinTone', () => {
  it('modifies an emoji whose base accepts a modifier', () => {
    expect(applySkinTone('👍', 3)).toBe('👍\u{1F3FD}');
    expect(applySkinTone('✋', 5)).toBe('✋\u{1F3FF}');
  });

  it('leaves tone 0 and every non-base alone', () => {
    expect(applySkinTone('👍', 0)).toBe('👍');
    expect(applySkinTone('🎉', 4)).toBe('🎉');
    expect(applySkinTone('❤️', 2)).toBe('❤️');
  });

  it('never splices a modifier into a SEQUENCE — that renders a stray colour square', () => {
    const family = '👩‍👩‍👧';
    expect(applySkinTone(family, 3)).toBe(family);
    expect(applySkinTone('🏳️‍🌈', 3)).toBe('🏳️‍🌈');
  });
});

describe('waveformBars', () => {
  it('keeps the MOST RECENT samples, so a growing meter scrolls left', () => {
    expect(waveformBars([0.1, 0.2, 0.3, 0.4], 2)).toEqual([0.3, 0.4]);
  });

  it('floors silence so a quiet passage is ticks, not an invisible gap', () => {
    expect(waveformBars([0, 0.5, Number.NaN], 3)).toEqual([0.06, 0.5, 0.06]);
  });

  it('clamps above 1', () => {
    expect(waveformBars([4], 1)).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
//  ChatComposer
// ---------------------------------------------------------------------------

describe('ChatComposer', () => {
  it('shows the mic when there is nothing to send, and hides SEND from assistive tech', () => {
    mount(<ChatComposer testID="c" onMicPress={() => {}} onSend={() => {}} />);
    expect(ariaHidden(byTestId('c-mic'))).toBe(false);
    expect(ariaHidden(byTestId('c-send'))).toBe(true);
  });

  it('swaps to send once there is text, and hides the MIC', () => {
    mount(<ChatComposer testID="c" value="hello" onMicPress={() => {}} onSend={() => {}} />);
    expect(ariaHidden(byTestId('c-send'))).toBe(false);
    expect(ariaHidden(byTestId('c-mic'))).toBe(true);
  });

  it('swaps to send for a bare ATTACHMENT, with an empty draft', () => {
    mount(
      <ChatComposer
        testID="c"
        attachments={[{ id: 'a', name: 'roof.jpg' }]}
        onMicPress={() => {}}
        onSend={() => {}}
      />,
    );
    expect(ariaHidden(byTestId('c-send'))).toBe(false);
  });

  it('treats whitespace as empty', () => {
    mount(<ChatComposer testID="c" value="   " onMicPress={() => {}} onSend={() => {}} />);
    expect(ariaHidden(byTestId('c-send'))).toBe(true);
  });

  it('names every control, which is all a glyph-only button can be announced by', () => {
    mount(
      <ChatComposer
        testID="c"
        onAttachPress={() => {}}
        onEmojiPress={() => {}}
        onCameraPress={() => {}}
        onMicPress={() => {}}
      />,
    );
    expect(byTestId('c-attach').getAttribute('aria-label')).toBe('Attach');
    expect(byTestId('c-emoji').getAttribute('aria-label')).toBe('Emoji');
    expect(byTestId('c-camera').getAttribute('aria-label')).toBe('Camera');
    expect(byTestId('c-mic').getAttribute('aria-label')).toBe('Record a voice message');
    expect(byTestId('c-input').getAttribute('aria-label')).toBe('Message');
  });

  it('takes translated labels', () => {
    mount(<ChatComposer testID="c" onMicPress={() => {}} labels={{ mic: 'Grabar' }} />);
    expect(byTestId('c-mic').getAttribute('aria-label')).toBe('Grabar');
  });

  it('sends on the send button and clears an UNCONTROLLED draft', () => {
    const onSend = jest.fn();
    mount(<ChatComposer testID="c" defaultValue="ship it" onSend={onSend} />);
    press(byTestId('c-send'));
    expect(onSend).toHaveBeenCalledWith('ship it');
    expect((byTestId('c-input') as HTMLTextAreaElement).value).toBe('');
  });

  it('leaves a CONTROLLED draft to its owner', () => {
    const onSend = jest.fn();
    mount(<ChatComposer testID="c" value="ship it" onSend={onSend} />);
    press(byTestId('c-send'));
    expect(onSend).toHaveBeenCalledWith('ship it');
    expect((byTestId('c-input') as HTMLTextAreaElement).value).toBe('ship it');
  });

  describe("sendOn='enter' (the default)", () => {
    it('sends on Enter', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="hi" onSend={onSend} />);
      keyDown(byTestId('c-input'), 'Enter');
      expect(onSend).toHaveBeenCalledWith('hi');
    });

    it('does NOT send on Shift+Enter — that is the newline', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="hi" onSend={onSend} />);
      keyDown(byTestId('c-input'), 'Enter', { shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('does not send while an IME composition is open', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="こん" onSend={onSend} />);
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        Object.defineProperty(event, 'isComposing', { value: true });
        byTestId('c-input').dispatchEvent(event);
      });
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("sendOn='mod-enter'", () => {
    it('leaves plain Enter as a newline', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="hi" sendOn="mod-enter" onSend={onSend} />);
      keyDown(byTestId('c-input'), 'Enter');
      expect(onSend).not.toHaveBeenCalled();
    });

    it('sends on ⌘Enter and on Ctrl+Enter', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="hi" sendOn="mod-enter" onSend={onSend} />);
      keyDown(byTestId('c-input'), 'Enter', { metaKey: true });
      keyDown(byTestId('c-input'), 'Enter', { ctrlKey: true });
      expect(onSend).toHaveBeenCalledTimes(2);
    });
  });

  it('never sends while disabled, from the button or the keyboard', () => {
    const onSend = jest.fn();
    mount(<ChatComposer testID="c" value="hi" disabled onSend={onSend} />);
    press(byTestId('c-send'));
    keyDown(byTestId('c-input'), 'Enter');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('reports Escape, for cancelling a reply or an edit', () => {
    const onEscape = jest.fn();
    mount(<ChatComposer testID="c" value="hi" onEscape={onEscape} />);
    keyDown(byTestId('c-input'), 'Escape');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('reports Up on an EMPTY draft only — otherwise Up is caret movement', () => {
    const onEditLast = jest.fn();
    mount(<ChatComposer testID="c" value="" onEditLast={onEditLast} />);
    keyDown(byTestId('c-input'), 'ArrowUp');
    expect(onEditLast).toHaveBeenCalledTimes(1);

    mount(<ChatComposer testID="c" value="typed" onEditLast={onEditLast} />);
    keyDown(byTestId('c-input'), 'ArrowUp');
    expect(onEditLast).toHaveBeenCalledTimes(1);
  });

  describe('suggestions', () => {
    const people: ChatComposerSuggestion[] = [
      { id: '1', label: 'Ana Restrepo', handle: '@ana' },
      { id: '2', label: 'Marcel Dubé', handle: '@marcel' },
      { id: '3', label: 'Nour Haddad', handle: '@nour' },
    ];

    it('moves the highlight down and WRAPS at the end', () => {
      const onActiveIndexChange = jest.fn();
      mount(
        <ChatComposer
          testID="c"
          value="@"
          suggestions={people}
          activeIndex={2}
          onActiveIndexChange={onActiveIndexChange}
        />,
      );
      keyDown(byTestId('c-input'), 'ArrowDown');
      expect(onActiveIndexChange).toHaveBeenCalledWith(0);
    });

    it('starts from the first row when nothing is highlighted yet', () => {
      const onActiveIndexChange = jest.fn();
      mount(
        <ChatComposer
          testID="c"
          value="@"
          suggestions={people}
          activeIndex={-1}
          onActiveIndexChange={onActiveIndexChange}
        />,
      );
      keyDown(byTestId('c-input'), 'ArrowDown');
      expect(onActiveIndexChange).toHaveBeenCalledWith(0);
    });

    it('moves up and wraps to the last row', () => {
      const onActiveIndexChange = jest.fn();
      mount(
        <ChatComposer
          testID="c"
          value="@"
          suggestions={people}
          activeIndex={0}
          onActiveIndexChange={onActiveIndexChange}
        />,
      );
      keyDown(byTestId('c-input'), 'ArrowUp');
      expect(onActiveIndexChange).toHaveBeenCalledWith(2);
    });

    it('takes the highlighted row on Enter INSTEAD of sending', () => {
      const onSelectSuggestion = jest.fn();
      const onSend = jest.fn();
      mount(
        <ChatComposer
          testID="c"
          value="@ma"
          suggestions={people}
          activeIndex={1}
          onSelectSuggestion={onSelectSuggestion}
          onSend={onSend}
        />,
      );
      keyDown(byTestId('c-input'), 'Enter');
      expect(onSelectSuggestion).toHaveBeenCalledWith(people[1], 1);
      expect(onSend).not.toHaveBeenCalled();
    });

    it('sends on Enter when the list is open but nothing is highlighted', () => {
      const onSend = jest.fn();
      mount(<ChatComposer testID="c" value="@ma" suggestions={people} activeIndex={-1} onSend={onSend} />);
      keyDown(byTestId('c-input'), 'Enter');
      expect(onSend).toHaveBeenCalled();
    });

    it('lets Up NAVIGATE rather than recall the last message while the list is open', () => {
      const onEditLast = jest.fn();
      const onActiveIndexChange = jest.fn();
      mount(
        <ChatComposer
          testID="c"
          value=""
          suggestions={people}
          activeIndex={1}
          onEditLast={onEditLast}
          onActiveIndexChange={onActiveIndexChange}
        />,
      );
      keyDown(byTestId('c-input'), 'ArrowUp');
      expect(onEditLast).not.toHaveBeenCalled();
      expect(onActiveIndexChange).toHaveBeenCalledWith(0);
    });

    it('draws nothing for an empty list', () => {
      mount(<ChatComposer testID="c" value="@" suggestions={[]} />);
      expect(maybe('c-suggestions')).toBeNull();
    });
  });

  it('replaces the input row with a notice, and drops the field entirely', () => {
    mount(<ChatComposer testID="c" notice="You can't send messages in this group" />);
    expect(byTestId('c-notice').textContent).toContain("You can't send messages in this group");
    expect(maybe('c-input')).toBeNull();
    expect(maybe('c-send')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ComposerBanner
// ---------------------------------------------------------------------------

describe('ComposerBanner', () => {
  it('draws the accent rail and reports its close', () => {
    const onClose = jest.fn();
    mount(
      <ComposerBanner
        kind="reply"
        title="Ana Restrepo"
        preview="Still on for Thursday?"
        onClose={onClose}
        testID="b"
      />,
    );
    expect(maybe('b-rail')).not.toBeNull();
    const close = container.querySelector('[aria-label="Cancel"]');
    expect(close).not.toBeNull();
    press(close as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('paints the rail in a caller colour, for a per-sender quote', () => {
    mount(
      <ComposerBanner kind="reply" title="Ivo" accentColor="rgb(10, 20, 30)" testID="b" />,
    );
    expect(byTestId('b-rail').style.backgroundColor).toBe('rgb(10, 20, 30)');
  });

  it('draws the note kind WITHOUT a rail, and with no close unless one is wired', () => {
    mount(<ComposerBanner kind="note" title="Slow mode: 12s" testID="n" />);
    expect(maybe('n-rail')).toBeNull();
    expect(container.querySelector('[aria-label="Cancel"]')).toBeNull();
  });

  it('names itself from its two lines, so the banner is one announcement', () => {
    mount(<ComposerBanner kind="edit" title="Edit message" preview="See you at six" testID="b" />);
    expect(byTestId('b').getAttribute('aria-label')).toBe('Edit message. See you at six');
  });
});

// ---------------------------------------------------------------------------
//  ComposerAttachmentStrip
// ---------------------------------------------------------------------------

describe('ComposerAttachmentStrip', () => {
  it('names each remove button after its file', () => {
    const onRemove = jest.fn();
    mount(
      <ComposerAttachmentStrip
        attachments={[{ id: 'a', name: 'roof.jpg' }]}
        onRemove={onRemove}
        testID="s"
      />,
    );
    const button = byTestId('s-a-remove');
    expect(button.getAttribute('aria-label')).toBe('Remove roof.jpg');
    press(button);
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('draws the ring and withholds the remove button while a file is still landing', () => {
    mount(
      <ComposerAttachmentStrip
        attachments={[{ id: 'a', name: 'roof.jpg', progress: 40 }]}
        onRemove={() => {}}
        testID="s"
      />,
    );
    expect(maybe('s-a-ring')).not.toBeNull();
    expect(maybe('s-a-remove')).toBeNull();
  });

  it('renders nothing at all when empty', () => {
    mount(<ComposerAttachmentStrip attachments={[]} testID="s" />);
    expect(maybe('s')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  SuggestionList
// ---------------------------------------------------------------------------

describe('SuggestionList', () => {
  const rows: ChatComposerSuggestion[] = [
    { id: '1', label: 'Ana Restrepo', handle: '@ana' },
    { id: '2', label: 'Marcel Dubé', handle: '@marcel' },
  ];

  it('spells the highlight as aria-selected, which is the only spelling web reads', () => {
    mount(<SuggestionList kind="mention" suggestions={rows} activeIndex={1} testID="l" />);
    expect(byTestId('l-row-1').getAttribute('aria-selected')).toBe('false');
    expect(byTestId('l-row-2').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('l-row-2').getAttribute('role')).toBe('option');
  });

  it('names a row by its label AND handle — "Ana" alone is ambiguous in a group', () => {
    mount(<SuggestionList kind="mention" suggestions={rows} testID="l" />);
    expect(byTestId('l-row-1').getAttribute('aria-label')).toBe('Ana Restrepo @ana');
  });

  it('reports a selection with its index', () => {
    const onSelectSuggestion = jest.fn();
    mount(
      <SuggestionList kind="command" suggestions={rows} onSelectSuggestion={onSelectSuggestion} testID="l" />,
    );
    press(byTestId('l-row-2'));
    expect(onSelectSuggestion).toHaveBeenCalledWith(rows[1], 1);
  });

  it('does not select a disabled row', () => {
    const onSelectSuggestion = jest.fn();
    mount(
      <SuggestionList
        kind="mention"
        suggestions={[{ id: '1', label: 'Ana', disabled: true }]}
        onSelectSuggestion={onSelectSuggestion}
        testID="l"
      />,
    );
    press(byTestId('l-row-1'));
    expect(onSelectSuggestion).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
//  VoiceRecorder
// ---------------------------------------------------------------------------

describe('VoiceRecorder', () => {
  it('shows the elapsed clock through the shared formatter', () => {
    mount(<VoiceRecorder state="recording" seconds={161} testID="r" />);
    expect(byTestId('r-time').textContent).toBe('2:41');
  });

  it('offers slide-to-cancel and a lock while recording, and no send', () => {
    mount(
      <VoiceRecorder state="recording" seconds={3} slideToCancel onCancel={() => {}} onLock={() => {}} onSend={() => {}} testID="r" />,
    );
    expect(maybe('r-slide')).not.toBeNull();
    expect(maybe('r-lock')).not.toBeNull();
    expect(maybe('r-send')).toBeNull();
  });

  it('offers an explicit cancel button where there is no slide gesture', () => {
    mount(<VoiceRecorder state="recording" seconds={3} slideToCancel={false} onCancel={() => {}} testID="r" />);
    expect(maybe('r-slide')).toBeNull();
    expect(byTestId('r-cancel').getAttribute('aria-label')).toBe('Cancel recording');
  });

  it('turns hands-free once locked: cancel and send, no lock', () => {
    const onSend = jest.fn();
    mount(<VoiceRecorder state="locked" seconds={30} onCancel={() => {}} onSend={onSend} testID="r" />);
    expect(maybe('r-lock')).toBeNull();
    press(byTestId('r-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('names the transport by what pressing it DOES, not by what is happening', () => {
    mount(<VoiceRecorder state="preview" seconds={4} duration={12} onPlayToggle={() => {}} testID="r" />);
    expect(byTestId('r-play').getAttribute('aria-label')).toBe('Play recording');
    mount(<VoiceRecorder state="preview" seconds={4} duration={12} playing onPlayToggle={() => {}} testID="r" />);
    expect(byTestId('r-play').getAttribute('aria-label')).toBe('Pause recording');
  });

  it('shows the playhead and the total in preview', () => {
    mount(
      <VoiceRecorder state="preview" seconds={12} duration={41} onDelete={() => {}} onSend={() => {}} testID="r" />,
    );
    expect(byTestId('r-time').textContent).toBe('0:12');
    expect(byTestId('r').textContent).toContain('0:41');
    expect(maybe('r-delete')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  ReactionPicker
// ---------------------------------------------------------------------------

describe('ReactionPicker', () => {
  it('marks the viewer\'s own reaction with aria-pressed, which RN has no concept of', () => {
    mount(<ReactionPicker selected="❤️" onSelectEmoji={() => {}} testID="p" />);
    expect(byTestId('p-👍').getAttribute('aria-pressed')).toBe('false');
    expect(byTestId('p-❤️').getAttribute('aria-pressed')).toBe('true');
  });

  it('reports the glyph it was given', () => {
    const onSelectEmoji = jest.fn();
    mount(<ReactionPicker emojis={['🎉', '🚀']} onSelectEmoji={onSelectEmoji} testID="p" />);
    press(byTestId('p-🚀'));
    expect(onSelectEmoji).toHaveBeenCalledWith('🚀');
  });

  it('draws the "+" only when there is somewhere for it to go', () => {
    mount(<ReactionPicker testID="p" />);
    expect(maybe('p-more')).toBeNull();
    mount(<ReactionPicker onMorePress={() => {}} testID="p" />);
    expect(byTestId('p-more').getAttribute('aria-label')).toBe('More reactions');
  });

  it('takes a caller name per emoji, for a screen reader that would read the glyph', () => {
    mount(<ReactionPicker emojis={['👍']} emojiLabel={() => 'Thumbs up'} testID="p" />);
    expect(byTestId('p-👍').getAttribute('aria-label')).toBe('Thumbs up');
  });
});

// ---------------------------------------------------------------------------
//  EmojiPicker
// ---------------------------------------------------------------------------

describe('EmojiPicker', () => {
  const groups: EmojiGroup[] = [
    {
      key: 'smileys',
      label: 'Smileys',
      emojis: [
        { char: '😂', name: 'tears of joy', keywords: ['laugh'] },
        { char: '🙂', name: 'slight smile' },
      ],
    },
    { key: 'people', label: 'People', emojis: [{ char: '👍', name: 'thumbs up' }] },
  ];

  function cells(): string[] {
    return Array.from(container.querySelectorAll('[data-testid^="e-emoji-"]')).map(
      (node) => node.getAttribute('data-testid') ?? '',
    );
  }

  it('renders every group, with a category tab each', () => {
    mount(<EmojiPicker groups={groups} testID="e" />);
    expect(cells()).toHaveLength(3);
    expect(byTestId('e-category-smileys').getAttribute('role')).toBe('tab');
    expect(byTestId('e-category-smileys').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('e-category-people').getAttribute('aria-selected')).toBe('false');
  });

  it('filters the grid from the search field', () => {
    mount(<EmojiPicker groups={groups} query="laugh" testID="e" />);
    expect(cells()).toEqual(['e-emoji-😂']);
  });

  it('says so when a search matches nothing', () => {
    mount(<EmojiPicker groups={groups} query="zzz" testID="e" />);
    expect(cells()).toEqual([]);
    expect(byTestId('e').textContent).toContain('No emoji found');
  });

  it('hands filtering back to the app with filter={false}', () => {
    mount(<EmojiPicker groups={groups} query="zzz" filter={false} testID="e" />);
    expect(cells()).toHaveLength(3);
  });

  it('names each emoji by its NAME when the dataset has one, and by the glyph otherwise', () => {
    mount(<EmojiPicker groups={[{ key: 'k', label: 'K', emojis: [{ char: '😂', name: 'tears of joy' }, '🚀'] }]} testID="e" />);
    expect(byTestId('e-emoji-😂').getAttribute('aria-label')).toBe('tears of joy');
    expect(byTestId('e-emoji-🚀').getAttribute('aria-label')).toBe('🚀');
  });

  it('emits the tone-modified glyph once a skin tone is chosen', () => {
    const onSelectEmoji = jest.fn();
    mount(
      <EmojiPicker
        groups={[{ key: 'k', label: 'K', emojis: ['👍'] }]}
        skinTone={4}
        onSelectEmoji={onSelectEmoji}
        testID="e"
      />,
    );
    press(byTestId('e-emoji-👍'));
    expect(onSelectEmoji).toHaveBeenCalledWith('👍\u{1F3FE}');
  });

  it('opens the tone row from the swatch and reports the chosen index', () => {
    const onSkinToneChange = jest.fn();
    mount(<EmojiPicker groups={groups} onSkinToneChange={onSkinToneChange} testID="e" />);
    expect(maybe('e-skin-tones')).toBeNull();
    press(byTestId('e-skin-tone'));
    expect(byTestId('e-skin-tone').getAttribute('aria-expanded')).toBe('true');
    press(byTestId('e-skin-tone-2'));
    expect(onSkinToneChange).toHaveBeenCalledWith(2);
  });

  it('puts "frequently used" first, and drops it while searching', () => {
    mount(<EmojiPicker groups={groups} frequentlyUsed={['🎉']} testID="e" />);
    expect(cells()[0]).toBe('e-emoji-🎉');
    mount(<EmojiPicker groups={groups} frequentlyUsed={['🎉']} query="laugh" testID="e" />);
    expect(cells()).toEqual(['e-emoji-😂']);
  });

  it('swaps the body for a custom tab, and marks the tab selected', () => {
    mount(
      <EmojiPicker
        groups={groups}
        tabs={[{ key: 'gifs', label: 'GIFs', content: <span>gif content</span> }]}
        activeTab="gifs"
        testID="e"
      />,
    );
    expect(byTestId('e').textContent).toContain('gif content');
    expect(byTestId('e-tab-gifs').getAttribute('aria-selected')).toBe('true');
    expect(cells()).toEqual([]);
  });
});
