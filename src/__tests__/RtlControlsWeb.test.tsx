/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Switch } from '../switch';
import { TextField, TextFieldInput } from '../text-field';
import { DateChipInput } from '../date-picker/DateChipInput';
import { TimeField } from '../date-picker/TimeField';
import { dayCellPaint, moveFocusedDate, rangeCellState } from '../date-picker/calendar-grid';
import { resolveCalendarPalette } from '../date-picker/palette';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let direction: string;
beforeEach(() => {
  direction = document.documentElement.dir;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.dir = direction;
});

function renderIn(dir: 'ltr' | 'rtl', ui: React.ReactElement) {
  document.documentElement.dir = dir;
  act(() => root.render(<BloomThemeProvider fonts={false}>{ui}</BloomThemeProvider>));
}

function thumbTranslate(): string {
  const track = container.querySelector('[role="switch"]')!.firstElementChild!;
  return (track.firstElementChild as HTMLElement).style.transform;
}

describe('Switch', () => {
  // The track parks the thumb at the inline start, the RIGHT edge in RTL, so a
  // positive translate there pushes it out of the track.
  it.each([
    ['ltr', false, 'translateX(2px)'],
    ['ltr', true, 'translateX(20px)'],
    ['rtl', false, 'translateX(-2px)'],
    ['rtl', true, 'translateX(-20px)'],
  ] as const)('in %s with checked=%s moves the thumb by %s', (dir, checked, expected) => {
    renderIn(
      dir,
      <Switch checked={checked} onCheckedChange={() => {}} accessibilityLabel="Alerts" />,
    );
    expect(thumbTranslate()).toBe(expected);
  });
});

describe('calendar keys', () => {
  const day = new Date(2026, 8, 16);

  it('moves the horizontal arrows the way the mirrored week row is drawn', () => {
    expect(moveFocusedDate(day, 'ArrowLeft', 0, true)?.getDate()).toBe(17);
    expect(moveFocusedDate(day, 'ArrowRight', 0, true)?.getDate()).toBe(15);
    expect(moveFocusedDate(day, 'ArrowLeft')?.getDate()).toBe(15);
    expect(moveFocusedDate(day, 'ArrowRight')?.getDate()).toBe(17);
  });

  it('keeps the vertical and paging keys', () => {
    expect(moveFocusedDate(day, 'ArrowDown', 0, true)?.getDate()).toBe(23);
    expect(moveFocusedDate(day, 'ArrowUp', 0, true)?.getDate()).toBe(9);
    expect(moveFocusedDate(day, 'PageDown', 0, true)?.getMonth()).toBe(9);
  });
});

describe('range paint', () => {
  const range = { start: new Date(2026, 8, 9), end: new Date(2026, 8, 22) };
  const cells = [
    ['range start', new Date(2026, 8, 9), 3],
    ['week start', new Date(2026, 8, 13), 0],
    ['week end', new Date(2026, 8, 19), 6],
    ['range end', new Date(2026, 8, 22), 2],
  ] as const;

  // The week row mirrors in RTL, so every physical side of the paint swaps.
  it.each(cells)('mirrors the %s cell', (_name, date, column) => {
    const ltr = dayCellPaint(rangeCellState(date, range), column, true, 32);
    const rtl = dayCellPaint(rangeCellState(date, range), column, true, 32, true);
    expect(rtl.band).toEqual({
      visible: ltr.band.visible,
      left: ltr.band.right,
      right: ltr.band.left,
      roundLeft: ltr.band.roundRight,
      roundRight: ltr.band.roundLeft,
    });
    expect(rtl.edge).toEqual({
      visible: ltr.edge.visible,
      roundLeft: ltr.edge.roundRight,
      roundRight: ltr.edge.roundLeft,
    });
  });

  it('puts the range start pill on the right in RTL', () => {
    const start = dayCellPaint(rangeCellState(range.start, range), 3, true, 32, true);
    expect(start.band).toMatchObject({ left: -6, right: 16 });
    expect(start.edge).toMatchObject({ roundLeft: false, roundRight: true });
  });
});

describe('left-to-right values in an RTL field', () => {
  function inputStyle() {
    return getComputedStyle(container.querySelector('input')!);
  }

  it.each([
    ['inputMode email', { inputMode: 'email' }],
    ['inputMode url', { inputMode: 'url' }],
    ['inputMode tel', { inputMode: 'tel' }],
    ['email keyboard', { keyboardType: 'email-address' }],
    ['phone keyboard', { keyboardType: 'phone-pad' }],
  ] as const)('runs a %s value LTR, aligned to the RTL form', (_name, props) => {
    renderIn(
      'rtl',
      <TextField>
        <TextFieldInput label="Contact" {...props} />
      </TextField>,
    );
    expect(inputStyle().direction).toBe('ltr');
    expect(inputStyle().textAlign).toBe('right');
  });

  it('leaves ordinary text to the paragraph direction', () => {
    renderIn(
      'rtl',
      <TextField>
        <TextFieldInput label="Name" />
      </TextField>,
    );
    expect(inputStyle().direction).not.toBe('ltr');
  });

  it('changes nothing in LTR', () => {
    renderIn(
      'ltr',
      <TextField>
        <TextFieldInput label="Email" inputMode="email" />
      </TextField>,
    );
    expect(inputStyle().direction).not.toBe('ltr');
    expect(inputStyle().textAlign).not.toBe('right');
  });

  it('applies to the floating-label input too', () => {
    renderIn(
      'rtl',
      <TextField>
        <TextFieldInput label="Email" inputMode="email" floatingLabel />
      </TextField>,
    );
    expect(inputStyle().direction).toBe('ltr');
  });

  function ChipInRtl() {
    const theme = useTheme();
    return (
      <DateChipInput
        date={new Date(2026, 8, 16)}
        label="Start"
        onCommit={() => {}}
        palette={resolveCalendarPalette(theme)}
      />
    );
  }

  it.each([
    ['DateChipInput', <ChipInRtl key="chip" />],
    [
      'TimeField',
      <TimeField key="time" value="09:30" onChange={() => {}} accessibilityLabel="Start" />,
    ],
  ])('runs the %s value LTR', (_name, ui) => {
    renderIn('rtl', ui);
    expect(inputStyle().direction).toBe('ltr');
    expect(inputStyle().textAlign).toBe('right');
  });
});

describe('floating label', () => {
  it.each([
    ['ltr', 'left', 'right'],
    ['rtl', 'right', 'left'],
  ] as const)('sits over the text start in %s', (dir, inset, other) => {
    renderIn(
      dir,
      <TextField>
        <TextFieldInput label="Email" floatingLabel />
      </TextField>,
    );
    const label = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    const style = getComputedStyle(label);
    expect(style.getPropertyValue(inset)).toBe('6px');
    expect(style.getPropertyValue(other)).toBe('');
  });
});
