/**
 * @jest-environment jsdom
 *
 * `Stepper` and `StepperRow`, rendered through the REAL react-native-web so the
 * assertions read emitted DOM attributes rather than props (a prop-level test
 * cannot see what react-native-web does with `aria-*`).
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Stepper, StepperRow } from '../stepper';
import type { StepperProps } from '../stepper';

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

/** A controlled harness, so presses round-trip through `value`. */
function Controlled({ initial, onChange, ...rest }: Partial<StepperProps> & { initial: number; onChange?: (n: number) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <Stepper
      accessibilityLabel="Adults"
      testID="st"
      {...rest}
      value={value}
      onValueChange={(n) => {
        onChange?.(n);
        setValue(n);
      }}
    />
  );
}

function press(id: string) {
  act(() => {
    byTestId(id).click();
  });
}

function key(id: string, k: string) {
  act(() => {
    byTestId(id).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  });
}

describe('Stepper accessibility', () => {
  it('is a named group whose value is a named slider carrying aria-value*', () => {
    mount(<Stepper value={2} onValueChange={() => {}} min={1} max={16} accessibilityLabel="Adults" testID="st" />);
    const group = byTestId('st');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Adults');
    const value = byTestId('st-value');
    expect(value.getAttribute('role')).toBe('slider');
    expect(value.getAttribute('aria-label')).toBe('Adults');
    expect(value.getAttribute('aria-valuenow')).toBe('2');
    expect(value.getAttribute('aria-valuemin')).toBe('1');
    expect(value.getAttribute('aria-valuemax')).toBe('16');
    expect(value.getAttribute('aria-valuetext')).toBe('2');
    expect(value.getAttribute('tabindex')).toBe('0');
    expect(value.textContent).toBe('2');
  });

  it('names both buttons, with overridable defaults', () => {
    mount(<Stepper value={2} onValueChange={() => {}} accessibilityLabel="Adults" testID="st" />);
    expect(byTestId('st-decrement').getAttribute('aria-label')).toBe('Decrease');
    expect(byTestId('st-increment').getAttribute('aria-label')).toBe('Increase');
    mount(
      <Stepper
        value={2}
        onValueChange={() => {}}
        accessibilityLabel="Adultos"
        decrementLabel="Menos"
        incrementLabel="Más"
        testID="st"
      />,
    );
    expect(byTestId('st-decrement').getAttribute('aria-label')).toBe('Menos');
    expect(byTestId('st-increment').getAttribute('aria-label')).toBe('Más');
  });

  it('omits aria-valuemax when unbounded, and announces a formatted value', () => {
    mount(<Stepper value={8} onValueChange={() => {}} formatValue={(n) => `${n}+`} accessibilityLabel="Beds" testID="st" />);
    const value = byTestId('st-value');
    expect(value.hasAttribute('aria-valuemax')).toBe(false);
    expect(value.getAttribute('aria-valuetext')).toBe('8+');
    expect(value.textContent).toBe('8+');
  });

  it('disables the decrement at min and the increment at max', () => {
    mount(<Stepper value={0} onValueChange={() => {}} max={3} accessibilityLabel="Pets" testID="st" />);
    expect(byTestId('st-decrement').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('st-increment').getAttribute('aria-disabled')).not.toBe('true');
    mount(<Stepper value={3} onValueChange={() => {}} max={3} accessibilityLabel="Pets" testID="st" />);
    expect(byTestId('st-decrement').getAttribute('aria-disabled')).not.toBe('true');
    expect(byTestId('st-increment').getAttribute('aria-disabled')).toBe('true');
  });

  it('disabled: both buttons, the value and the group say so, and the value leaves the tab order', () => {
    mount(<Stepper value={2} onValueChange={() => {}} disabled accessibilityLabel="Rooms" testID="st" />);
    expect(byTestId('st').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('st-value').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('st-value').getAttribute('tabindex')).toBe('-1');
    expect(byTestId('st-decrement').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('st-increment').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('Stepper behaviour', () => {
  it('presses step the value and stop at the bounds', () => {
    const onChange = jest.fn();
    mount(<Controlled initial={1} min={1} max={3} onChange={onChange} />);
    press('st-increment');
    press('st-increment');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('3');
    press('st-increment');
    expect(onChange).toHaveBeenCalledTimes(2);
    press('st-decrement');
    press('st-decrement');
    press('st-decrement');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('1');
    expect(onChange.mock.calls.map(([n]) => n)).toEqual([2, 3, 2, 1]);
  });

  it('answers the arrow keys, Home and End on the focused value', () => {
    mount(<Controlled initial={2} max={10} />);
    key('st-value', 'ArrowUp');
    key('st-value', 'ArrowRight');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('4');
    key('st-value', 'ArrowDown');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('3');
    key('st-value', 'End');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('10');
    key('st-value', 'Home');
    expect(byTestId('st-value').getAttribute('aria-valuenow')).toBe('0');
  });

  it('snaps fractional steps without floating-point drift', () => {
    const onChange = jest.fn();
    mount(<Controlled initial={0.1} step={0.1} max={1} onChange={onChange} />);
    press('st-increment');
    press('st-increment');
    expect(onChange.mock.calls.map(([n]) => n)).toEqual([0.2, 0.3]);
  });

  it('ignores keys and presses while disabled', () => {
    const onChange = jest.fn();
    mount(<Controlled initial={2} disabled onChange={onChange} />);
    key('st-value', 'ArrowUp');
    press('st-increment');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the value box a fixed minimum width per size, so 9 → 10 does not shift the row', () => {
    mount(<Stepper value={9} onValueChange={() => {}} accessibilityLabel="A" testID="st" />);
    expect(getComputedStyle(byTestId('st-value')).minWidth).toBe('32px');
    mount(<Stepper value={9} size="small" onValueChange={() => {}} accessibilityLabel="A" testID="st" />);
    expect(getComputedStyle(byTestId('st-value')).minWidth).toBe('24px');
  });
});

describe('StepperRow', () => {
  it('renders title and description, names the stepper by the title, and draws the hairline on request', () => {
    mount(
      <StepperRow
        title="Adults"
        description="Ages 13 or above"
        value={2}
        onValueChange={() => {}}
        divider
        testID="row-stepper"
      />,
    );
    expect(container.textContent).toContain('Adults');
    expect(container.textContent).toContain('Ages 13 or above');
    expect(byTestId('row-stepper').getAttribute('aria-label')).toBe('Adults');
    expect(byTestId('row-stepper-value').getAttribute('aria-label')).toBe('Adults');
  });

  it('an explicit accessibilityLabel wins over the title', () => {
    mount(<StepperRow title="Adults" accessibilityLabel="Adult guests" value={2} onValueChange={() => {}} testID="s" />);
    expect(byTestId('s').getAttribute('aria-label')).toBe('Adult guests');
  });
});
