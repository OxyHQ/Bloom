/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RadioGroup } from '../radio';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement, root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); document.documentElement.dir = 'ltr'; });
const options = [{ value: 'a', label: 'First' }, { value: 'b', label: 'Unavailable', disabled: true }, { value: 'c', label: 'Last' }];
const key = (el: HTMLElement, key: string, type = 'keydown') => act(() => el.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true })));
for (const variant of ['default', 'card'] as const) for (const rtl of [false, true]) {
  it(`${variant} owns one tab stop, skips disabled options and wraps in ${rtl ? 'RTL' : 'LTR'}`, () => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    const change = jest.fn();
    act(() => root.render(<BloomThemeProvider><RadioGroup label="Order" variant={variant} options={options} defaultValue="a" onValueChange={change} optionStyle={{ minHeight: 44, paddingVertical: 12 }} /></BloomThemeProvider>));
    const radios = Array.from(container.querySelectorAll<HTMLElement>('[role=radio]'));
    expect(radios.map(el => el.tabIndex)).toEqual([0, -1, -1]);
    expect(getComputedStyle(radios[0]!).minHeight).toBe('44px');
    act(() => radios[0]!.focus());
    key(radios[0]!, rtl ? 'ArrowLeft' : 'ArrowRight');
    expect(document.activeElement).toBe(radios[2]);
    expect(radios[2]!.getAttribute('aria-checked')).toBe('true');
    expect(radios.map(el => el.tabIndex)).toEqual([-1, -1, 0]);
    key(radios[2]!, 'ArrowDown'); expect(document.activeElement).toBe(radios[0]);
    key(radios[0]!, 'End'); expect(document.activeElement).toBe(radios[2]);
    key(radios[2]!, 'Home'); expect(document.activeElement).toBe(radios[0]);
    expect(change.mock.calls.map(call => call[0])).toEqual(['c', 'a', 'c', 'a']);
  });
}
it('retains controlled ownership, fallback tab stop and disabled group constraints', () => {
  const change = jest.fn();
  const draw = (value: string | undefined, disabled = false, choices = options) => act(() => root.render(<BloomThemeProvider><RadioGroup label="Order" value={value} onValueChange={change} options={choices} disabled={disabled} /></BloomThemeProvider>));
  draw('b');
  let radios = Array.from(container.querySelectorAll<HTMLElement>('[role=radio]'));
  expect(radios.map(el => el.tabIndex)).toEqual([0, -1, -1]);
  key(radios[0]!, 'ArrowDown'); expect(change).toHaveBeenLastCalledWith('c');
  expect(radios[2]!.getAttribute('aria-checked')).toBe('false');
  draw('c'); expect(radios[2]!.tabIndex).toBe(0);
  draw('c', false, options.slice(0, 2));
  radios = Array.from(container.querySelectorAll<HTMLElement>('[role=radio]'));
  expect(radios.map(el => el.tabIndex)).toEqual([0, -1]);
  change.mockClear(); draw('a', true); key(radios[0]!, 'ArrowDown'); key(radios[0]!, ' '); key(radios[0]!, ' ', 'keyup');
  expect(change).not.toHaveBeenCalled(); expect(radios.map(el => el.tabIndex)).toEqual([-1, -1]);
});
