/**
 * Key chords (`kbd/chord.ts`): a shortcut as declared (`Mod+Shift+Z`), its one
 * canonical spelling for a platform's bar, how a row draws it on each
 * platform, whether a key press is it, and which presses a focused text field
 * keeps (OxyOS ADR 0021, decision 3).
 */
import {
  type Chord,
  chordText,
  formatChord,
  matchesChord,
  parseChord,
  textEntryKeeps,
} from '../kbd/chord';
import type { PlatformKeyEvent } from '../platform-surface/types';

const chord = (text: string): Chord => {
  const parsed = parseChord(text);
  if (!parsed) throw new Error(`not a chord: ${text}`);
  return parsed;
};

const key = (init: Partial<PlatformKeyEvent> & { key: string }): PlatformKeyEvent => ({
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...init,
});

describe('parseChord and chordText', () => {
  it.each([
    ['Mod+N', 'Mod+N'],
    ['mod+shift+z', 'Mod+Shift+Z'],
    ['Shift+Mod+Z', 'Mod+Shift+Z'],
    ['Ctrl+Alt+Delete', 'Ctrl+Alt+Delete'],
    ['Alt+F4', 'Alt+F4'],
    ['Mod+,', 'Mod+,'],
    ['Mod++', 'Mod+Plus'],
    ['Mod+Plus', 'Mod+Plus'],
    ['Mod+Space', 'Mod+Space'],
    ['Meta+arrowup', 'Meta+ArrowUp'],
    [' Mod + N ', 'Mod+N'],
    ['Escape', 'Escape'],
    ['?', '?'],
  ])('reads %p as %p', (text, canonical) => {
    expect(chordText(chord(text))).toBe(canonical);
  });

  it.each(['', 'Mod+', 'Mod+Shift', 'Hyper+N', 'Mod+Enterr', 'Mod+NN', 'Cmd+N'])(
    'refuses %p',
    (text) => {
      expect(parseChord(text)).toBeNull();
    },
  );
});

describe('formatChord', () => {
  it.each([
    ['Mod+N', '⌘N', 'Ctrl+N'],
    ['Mod+Shift+Z', '⇧⌘Z', 'Ctrl+Shift+Z'],
    ['Ctrl+Alt+Shift+Mod+K', '⌃⌥⇧⌘K', 'Ctrl+Alt+Shift+K'],
    ['Alt+F4', '⌥F4', 'Alt+F4'],
    ['Mod+Enter', '⌘↩', 'Ctrl+Enter'],
    ['Mod+Backspace', '⌘⌫', 'Ctrl+Backspace'],
    ['Escape', '⎋', 'Esc'],
    ['Mod+ArrowUp', '⌘↑', 'Ctrl+↑'],
    ['Mod+Space', '⌘Space', 'Ctrl+Space'],
    ['Mod++', '⌘+', 'Ctrl++'],
    ['Meta+N', '⌘N', 'Meta+N'],
  ])('draws %p as %p on Apple platforms and %p elsewhere', (text, apple, other) => {
    expect(formatChord(chord(text), true)).toBe(apple);
    expect(formatChord(chord(text), false)).toBe(other);
  });
});

describe('matchesChord', () => {
  it('maps Mod to ⌘ on Apple platforms and to Ctrl elsewhere', () => {
    const mod = chord('Mod+N');
    expect(matchesChord(mod, key({ key: 'n', metaKey: true }), true)).toBe(true);
    expect(matchesChord(mod, key({ key: 'n', ctrlKey: true }), true)).toBe(false);
    expect(matchesChord(mod, key({ key: 'n', ctrlKey: true }), false)).toBe(true);
    expect(matchesChord(mod, key({ key: 'n', metaKey: true }), false)).toBe(false);
    // `Ctrl` is the Control key on a Mac, not ⌘.
    expect(matchesChord(chord('Ctrl+N'), key({ key: 'n', ctrlKey: true }), true)).toBe(true);
  });

  it('wants exactly the modifiers declared', () => {
    const mod = chord('Mod+N');
    expect(matchesChord(mod, key({ key: 'n' }), false)).toBe(false);
    expect(matchesChord(mod, key({ key: 'N', ctrlKey: true, shiftKey: true }), false)).toBe(false);
    expect(matchesChord(mod, key({ key: 'n', ctrlKey: true, altKey: true }), false)).toBe(false);
    const shifted = chord('Mod+Shift+Z');
    expect(matchesChord(shifted, key({ key: 'Z', ctrlKey: true, shiftKey: true }), false)).toBe(
      true,
    );
    expect(matchesChord(shifted, key({ key: 'z', ctrlKey: true }), false)).toBe(false);
  });

  it('lets a symbol that needs Shift to be typed match without declaring it', () => {
    expect(
      matchesChord(chord('Mod+?'), key({ key: '?', ctrlKey: true, shiftKey: true }), false),
    ).toBe(true);
    // A digit's Shift is part of the chord.
    expect(
      matchesChord(
        chord('Mod+1'),
        key({ key: '!', ctrlKey: true, shiftKey: true, code: 'Digit1' }),
        false,
      ),
    ).toBe(false);
    expect(
      matchesChord(
        chord('Mod+Shift+1'),
        key({ key: '!', ctrlKey: true, shiftKey: true, code: 'Digit1' }),
        false,
      ),
    ).toBe(true);
  });

  it('reads the physical key where the character is not its name', () => {
    // Option+N types `˜` on a Mac.
    expect(matchesChord(chord('Alt+N'), key({ key: '˜', altKey: true, code: 'KeyN' }), true)).toBe(
      true,
    );
    // A Cyrillic layout's N key types `т`.
    expect(
      matchesChord(chord('Mod+N'), key({ key: 'т', ctrlKey: true, code: 'KeyN' }), false),
    ).toBe(true);
    // A Latin layout's character wins over its position: AZERTY's A is where QWERTY's Q is.
    expect(
      matchesChord(chord('Mod+Q'), key({ key: 'a', ctrlKey: true, code: 'KeyQ' }), false),
    ).toBe(false);
    expect(
      matchesChord(chord('Mod+A'), key({ key: 'a', ctrlKey: true, code: 'KeyQ' }), false),
    ).toBe(true);
  });

  it('matches named keys and the two spelled ones', () => {
    expect(matchesChord(chord('F5'), key({ key: 'F5' }), false)).toBe(true);
    expect(matchesChord(chord('Mod+Space'), key({ key: ' ', ctrlKey: true }), false)).toBe(true);
    expect(
      matchesChord(chord('Mod+Plus'), key({ key: '+', ctrlKey: true, shiftKey: true }), false),
    ).toBe(true);
    expect(matchesChord(chord('Shift+Enter'), key({ key: 'Enter' }), false)).toBe(false);
  });
});

describe('textEntryKeeps', () => {
  it.each([
    ['a letter', key({ key: 'a' })],
    ['a capital', key({ key: 'A', shiftKey: true })],
    ['Delete', key({ key: 'Delete' })],
    ['Enter', key({ key: 'Enter' })],
    ['a word back', key({ key: 'ArrowLeft', ctrlKey: true })],
    ['delete a word', key({ key: 'Backspace', altKey: true })],
    ['copy', key({ key: 'c', ctrlKey: true })],
    ['cut', key({ key: 'x', ctrlKey: true })],
    ['paste', key({ key: 'v', ctrlKey: true })],
    ['select all', key({ key: 'a', ctrlKey: true })],
    ['undo', key({ key: 'z', ctrlKey: true })],
    ['redo', key({ key: 'Z', ctrlKey: true, shiftKey: true })],
  ])('keeps %s elsewhere', (_name, event) => {
    expect(textEntryKeeps(event, false)).toBe(true);
  });

  it.each([
    ['new', key({ key: 'n', ctrlKey: true })],
    ['save', key({ key: 's', ctrlKey: true })],
    ['bold', key({ key: 'b', ctrlKey: true })],
    ['a menu mnemonic', key({ key: 'f', altKey: true })],
    ['copy on a Mac’s Ctrl', key({ key: 'c', metaKey: true })],
  ])('gives up %s elsewhere', (_name, event) => {
    expect(textEntryKeeps(event, false)).toBe(false);
  });

  it('uses ⌘ for the editing chords on a Mac, and keeps Option, which types', () => {
    expect(textEntryKeeps(key({ key: 'c', metaKey: true }), true)).toBe(true);
    expect(textEntryKeeps(key({ key: 'Z', metaKey: true, shiftKey: true }), true)).toBe(true);
    expect(textEntryKeeps(key({ key: 'c', ctrlKey: true }), true)).toBe(false);
    expect(textEntryKeeps(key({ key: '´', altKey: true, code: 'KeyE' }), true)).toBe(true);
    expect(textEntryKeeps(key({ key: 'n', metaKey: true }), true)).toBe(false);
  });
});
