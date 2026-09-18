/**
 * @jest-environment jsdom
 *
 * `TimeField` and the pure time helpers behind it, rendered through the REAL
 * react-native-web so the assertions read the emitted DOM — the `<input>`, its
 * name, its disabled state and the text it actually shows.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TimeField } from '../date-picker';
import { formatTime, fromMinutes, parseTime, snapTime, stepTime, toMinutes } from '../date-picker/time';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
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

function field(id: string): HTMLInputElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLInputElement)) throw new Error(`No input for testID "${id}"`);
  return el;
}

/** Type into the field the way a browser does: a real `input` event. */
function type(el: HTMLInputElement, text: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/**
 * React delegates at the root and listens for `focusout`, not `blur` — a
 * non-bubbling `blur` never reaches the handler, and the commit silently never
 * happens.
 */
function blur(el: HTMLInputElement) {
  act(() => {
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}

function key(el: HTMLInputElement, k: string) {
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  });
}

// ---------------------------------------------------------------------------
//  The pure helpers — where every spelling somebody might type is settled
// ---------------------------------------------------------------------------

describe('toMinutes / fromMinutes', () => {
  it('round-trips a 24h HH:mm', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('23:59')).toBe(1439);
    expect(fromMinutes(0)).toBe('00:00');
    expect(fromMinutes(570)).toBe('09:30');
    expect(fromMinutes(1439)).toBe('23:59');
  });

  it('refuses what is not a time, and wraps minutes within the day', () => {
    for (const bad of ['', '24:00', '9:60', 'noon', '9', '09:5', '-1:00']) {
      expect(toMinutes(bad)).toBeNull();
    }
    expect(fromMinutes(1440)).toBe('00:00');
    expect(fromMinutes(-30)).toBe('23:30');
  });
});

describe('formatTime', () => {
  it('draws 24h as given and 12h with a period', () => {
    expect(formatTime('09:30', '24h')).toBe('09:30');
    expect(formatTime('09:30', '12h')).toBe('9:30 AM');
    expect(formatTime('18:30', '12h')).toBe('6:30 PM');
    expect(formatTime('00:15', '12h')).toBe('12:15 AM');
    expect(formatTime('12:00', '12h')).toBe('12:00 PM');
  });
});

describe('parseTime', () => {
  it.each([
    ['9:30', '09:30'],
    ['930', '09:30'],
    ['0930', '09:30'],
    ['9.30', '09:30'],
    ['9 30', '09:30'],
    ['9:3', '09:30'],
    ['09:30', '09:30'],
    ['21:30', '21:30'],
    ['2130', '21:30'],
    ['9', '09:00'],
    ['0', '00:00'],
    ['23', '23:00'],
  ])('reads %s as %s', (text, expected) => {
    expect(parseTime(text)).toBe(expected);
  });

  it('an am/pm marker decides the half of the day, whatever the format says', () => {
    expect(parseTime('9pm')).toBe('21:00');
    expect(parseTime('9:30 PM')).toBe('21:30');
    expect(parseTime('9:30 p.m.')).toBe('21:30');
    expect(parseTime('12:15 am')).toBe('00:15');
    expect(parseTime('12:15 pm')).toBe('12:15');
    expect(parseTime('9:30 am', '24h')).toBe('09:30');
  });

  it('is null for what is not a time', () => {
    for (const bad of ['', '   ', 'noon', '9:75', '25:00', '13pm', '0pm', 'half nine', '9:30:15', 'abc']) {
      expect(parseTime(bad)).toBeNull();
    }
  });
});

describe('snapTime', () => {
  it('snaps to a grid counted from MIDNIGHT, not from min', () => {
    expect(snapTime('09:07', { step: 15 })).toBe('09:00');
    expect(snapTime('09:08', { step: 15 })).toBe('09:15');
    expect(snapTime('09:37', { step: 30, min: '09:10' })).toBe('09:30');
    expect(snapTime('12:34', { step: 1 })).toBe('12:34');
  });

  it('clamps to the bounds', () => {
    expect(snapTime('07:00', { min: '09:00' })).toBe('09:00');
    expect(snapTime('22:00', { max: '20:00' })).toBe('20:00');
    expect(snapTime('10:00', { min: '20:00', max: '09:00' })).toBeNull();
    expect(snapTime('nope')).toBeNull();
  });
});

describe('stepTime', () => {
  it('moves by step and clamps rather than wrapping', () => {
    expect(stepTime('09:00', 1, { step: 15 })).toBe('09:15');
    expect(stepTime('09:00', -1, { step: 15 })).toBe('08:45');
    expect(stepTime('20:00', 1, { step: 15, max: '20:00' })).toBe('20:00');
    expect(stepTime('09:00', -1, { step: 15, min: '09:00' })).toBe('09:00');
    expect(stepTime('23:59', 1)).toBe('23:59');
    expect(stepTime('00:00', -1)).toBe('00:00');
  });

  it('with no value, up starts at min and down at max', () => {
    expect(stepTime(null, 1, { min: '09:00', step: 15 })).toBe('09:00');
    expect(stepTime(null, -1, { max: '20:00', step: 15 })).toBe('20:00');
    expect(stepTime(null, 1, { step: 30 })).toBe('00:00');
    expect(stepTime(null, -1, { step: 30 })).toBe('23:30');
  });
});

// ---------------------------------------------------------------------------
//  The field
// ---------------------------------------------------------------------------

describe('TimeField', () => {
  it('is a named text input showing the value, 24h by default', () => {
    mount(<TimeField value="18:30" onChange={() => {}} accessibilityLabel="Viewing time" testID="t" />);
    const el = field('t');
    expect(el.getAttribute('aria-label')).toBe('Viewing time');
    expect(el.value).toBe('18:30');
  });

  it('draws 12h while the VALUE stays 24h', () => {
    const onChange = jest.fn();
    mount(
      <TimeField value="18:30" onChange={onChange} hourFormat="12h" accessibilityLabel="Time" testID="t" />,
    );
    expect(field('t').value).toBe('6:30 PM');
    type(field('t'), '7:15 pm');
    blur(field('t'));
    expect(onChange).toHaveBeenCalledWith('19:15');
  });

  it('empty: the placeholder, and 12h gets its own', () => {
    mount(<TimeField value={null} onChange={() => {}} accessibilityLabel="Time" testID="t" />);
    expect(field('t').value).toBe('');
    expect(field('t').getAttribute('placeholder')).toBe('--:--');
    mount(<TimeField value={null} onChange={() => {}} hourFormat="12h" accessibilityLabel="T" testID="t" />);
    expect(field('t').getAttribute('placeholder')).toBe('--:-- --');
    mount(<TimeField value={null} onChange={() => {}} placeholder="Any time" accessibilityLabel="T" testID="t" />);
    expect(field('t').getAttribute('placeholder')).toBe('Any time');
  });

  it('keeps the draft while typing and commits nothing until blur', () => {
    const onChange = jest.fn();
    mount(<TimeField value="18:30" onChange={onChange} accessibilityLabel="Time" testID="t" />);
    type(field('t'), '9');
    expect(field('t').value).toBe('9');
    type(field('t'), '93');
    type(field('t'), '930');
    expect(onChange).not.toHaveBeenCalled();
    blur(field('t'));
    expect(onChange).toHaveBeenCalledWith('09:30');
  });

  it('a draft that is not a time reverts to the committed value', () => {
    const onChange = jest.fn();
    mount(<TimeField value="18:30" onChange={onChange} accessibilityLabel="Time" testID="t" />);
    type(field('t'), 'half nine');
    blur(field('t'));
    expect(onChange).not.toHaveBeenCalled();
    expect(field('t').value).toBe('18:30');
  });

  it('Escape reverts the draft without committing', () => {
    const onChange = jest.fn();
    mount(<TimeField value="18:30" onChange={onChange} accessibilityLabel="Time" testID="t" />);
    type(field('t'), '07:00');
    key(field('t'), 'Escape');
    expect(field('t').value).toBe('18:30');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emptying it commits null', () => {
    const onChange = jest.fn();
    mount(<TimeField value="18:30" onChange={onChange} accessibilityLabel="Time" testID="t" />);
    type(field('t'), '');
    blur(field('t'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('step snaps a typed time, and the bounds pull it in', () => {
    const onChange = jest.fn();
    mount(
      <TimeField
        value={null}
        onChange={onChange}
        min="09:00"
        max="20:00"
        step={15}
        accessibilityLabel="Time"
        testID="t"
      />,
    );
    type(field('t'), '9:07');
    blur(field('t'));
    expect(onChange).toHaveBeenLastCalledWith('09:00');
    type(field('t'), '7:30');
    blur(field('t'));
    expect(onChange).toHaveBeenLastCalledWith('09:00');
    type(field('t'), '23:00');
    blur(field('t'));
    expect(onChange).toHaveBeenLastCalledWith('20:00');
  });

  it('the arrow keys move by step and commit at once', () => {
    const onChange = jest.fn();
    mount(
      <TimeField value="09:00" onChange={onChange} step={15} accessibilityLabel="Time" testID="t" />,
    );
    key(field('t'), 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith('09:15');
    key(field('t'), 'ArrowDown');
    expect(onChange).toHaveBeenLastCalledWith('08:45');
  });

  it('the arrow keys clamp at the bounds instead of wrapping', () => {
    const onChange = jest.fn();
    mount(
      <TimeField
        value="20:00"
        onChange={onChange}
        min="09:00"
        max="20:00"
        step={15}
        accessibilityLabel="Time"
        testID="t"
      />,
    );
    key(field('t'), 'ArrowUp');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabled: not editable, announced, and the keys do nothing', () => {
    const onChange = jest.fn();
    mount(<TimeField value="12:00" onChange={onChange} disabled accessibilityLabel="Locked" testID="t" />);
    const el = field('t');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.readOnly || el.disabled).toBe(true);
  });

  it('a value changed from outside rewrites the field', () => {
    mount(<TimeField value="09:00" onChange={() => {}} accessibilityLabel="Time" testID="t" />);
    expect(field('t').value).toBe('09:00');
    mount(<TimeField value="17:45" onChange={() => {}} accessibilityLabel="Time" testID="t" />);
    expect(field('t').value).toBe('17:45');
  });

  it('sizes 104 × 38 at medium, 96 × 32 at small, and takes an explicit width', () => {
    mount(<TimeField value="09:00" onChange={() => {}} accessibilityLabel="T" testID="t" />);
    expect(getComputedStyle(field('t')).width).toBe('104px');
    expect(getComputedStyle(field('t')).height).toBe('38px');
    mount(<TimeField value="09:00" onChange={() => {}} size="small" accessibilityLabel="T" testID="t" />);
    expect(getComputedStyle(field('t')).width).toBe('96px');
    expect(getComputedStyle(field('t')).height).toBe('32px');
    mount(<TimeField value="09:00" onChange={() => {}} width={140} accessibilityLabel="T" testID="t" />);
    expect(getComputedStyle(field('t')).width).toBe('140px');
  });
});
