/**
 * @jest-environment jsdom
 *
 * The reveal button through the REAL react-native-web: the input's `type`
 * flips, the button's NAME is an attribute, and a pointer press never takes
 * focus from the input — which only the DOM can show.
 */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextFieldInput } from '../text-field';

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

function Password({ onBlur }: { onBlur?: () => void }) {
  const [value, setValue] = useState('hunter2');
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <TextFieldInput
        label="Password"
        value={value}
        onValueChange={setValue}
        onBlur={onBlur}
        secureTextEntry
        revealable
      />
    </BloomThemeProvider>
  );
}

const input = () => container.querySelector('input') as HTMLInputElement;
const button = (name: string) => container.querySelector(`[role="button"][aria-label="${name}"]`) as HTMLElement | null;

describe('TextFieldInput revealable (web)', () => {
  it('flips the input between password and text, renaming the button', () => {
    act(() => root.render(<Password />));
    expect(input().type).toBe('password');
    expect(button('Show password')).not.toBeNull();

    act(() => button('Show password')!.click());
    expect(input().type).toBe('text');
    expect(button('Hide password')).not.toBeNull();
    expect(button('Show password')).toBeNull();

    act(() => button('Hide password')!.click());
    expect(input().type).toBe('password');
  });

  it('cancels the mousedown, so a pointer press leaves focus (and onBlur) alone', () => {
    const onBlur = jest.fn();
    act(() => root.render(<Password onBlur={onBlur} />));
    act(() => input().focus());
    expect(document.activeElement).toBe(input());

    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    act(() => {
      button('Show password')!.dispatchEvent(down);
    });
    expect(down.defaultPrevented).toBe(true);

    act(() => button('Show password')!.click());
    expect(document.activeElement).toBe(input());
    expect(onBlur).not.toHaveBeenCalled();
    expect(input().type).toBe('text');
  });

  it('keeps a keyboard user on the button: its click never reaches the shell, which would focus the input', () => {
    act(() => root.render(<Password />));
    const eye = button('Show password')!;
    act(() => eye.focus());
    expect(document.activeElement).toBe(eye);
    act(() => eye.click());
    expect(input().type).toBe('text');
    expect(document.activeElement).toBe(button('Hide password'));
  });
});
