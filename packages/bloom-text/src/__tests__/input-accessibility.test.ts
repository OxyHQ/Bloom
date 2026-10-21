/** @jest-environment jsdom */
import { act, createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { View } from 'react-native';
import type { RefObject } from 'react';
import type { InputAccessibility } from '../input-accessibility';
import { useInputAccessibility } from '../input-accessibility.web';
import { useKeyCapture } from '../key-capture.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLElement;
function Input(props: InputAccessibility & { handler?: () => boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useInputAccessibility(ref as unknown as RefObject<View | null>, props);
  useKeyCapture(ref as unknown as RefObject<View | null>, props.handler);
  return createElement(
    'div',
    { ref },
    createElement('div', { contentEditable: true, suppressContentEditableWarning: true }, 'Text'),
  );
}
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
it('forwards relationships to the editable element and removes them on dismissal without replacing it', () => {
  act(() =>
    root.render(
      createElement(Input, {
        accessibilityLabel: 'Page text',
        'aria-controls': 'results',
        'aria-activedescendant': 'option-1',
        'aria-expanded': true,
        'aria-autocomplete': 'list',
      }),
    ),
  );
  const input = host.querySelector('[contenteditable]')!;
  expect(input.getAttribute('role')).toBe('combobox');
  expect(input.getAttribute('aria-label')).toBe('Page text');
  expect(input.getAttribute('aria-controls')).toBe('results');
  expect(input.getAttribute('aria-activedescendant')).toBe('option-1');
  expect(host.firstElementChild?.hasAttribute('aria-controls')).toBe(false);
  act(() => root.render(createElement(Input, { accessibilityLabel: 'Page text' })));
  expect(host.querySelector('[contenteditable]')).toBe(input);
  expect(input.getAttribute('role')).toBe('textbox');
  for (const attribute of [
    'aria-controls',
    'aria-activedescendant',
    'aria-expanded',
    'aria-autocomplete',
    'aria-haspopup',
  ])
    expect(input.hasAttribute(attribute)).toBe(false);
});
it('applies semantics when the engine replaces its editing surface asynchronously', async () => {
  act(() =>
    root.render(createElement(Input, { 'aria-controls': 'results', 'aria-expanded': true })),
  );
  const original = host.querySelector('[contenteditable]')!;
  const replacement = document.createElement('div');
  replacement.setAttribute('contenteditable', 'true');
  await act(async () => {
    original.replaceWith(replacement);
  });
  expect(replacement.getAttribute('aria-controls')).toBe('results');
  expect(replacement.getAttribute('aria-expanded')).toBe('true');
});
it('does not claim composition keys and stops claiming keys when its handler is removed', () => {
  const handler = jest.fn(() => true);
  act(() => root.render(createElement(Input, { handler })));
  const input = host.querySelector('[contenteditable]')!;
  const composing = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    cancelable: true,
    isComposing: true,
  });
  input.dispatchEvent(composing);
  expect(handler).not.toHaveBeenCalled();
  expect(composing.defaultPrevented).toBe(false);
  const normal = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  input.dispatchEvent(normal);
  expect(handler).toHaveBeenCalledTimes(1);
  expect(normal.defaultPrevented).toBe(true);
  act(() => root.render(createElement(Input, {})));
  const disabled = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  input.dispatchEvent(disabled);
  expect(handler).toHaveBeenCalledTimes(1);
  expect(disabled.defaultPrevented).toBe(false);
});
