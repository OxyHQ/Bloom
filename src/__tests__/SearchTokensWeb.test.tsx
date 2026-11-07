/** @jest-environment jsdom */
/**
 * `Search`'s tokens in a browser (react-native-web): drawn inside the field
 * before the input, which keeps the rest of the row; a long row scrolls rather
 * than wrapping; Backspace reads the input's own selection and leaves an input
 * method's composition alone.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../icons/remix/RiSearchLine', () => ({ RiSearchLine: () => null }));
jest.mock('../icons/remix/RiCloseLine', () => ({ RiCloseLine: () => null }));

import { Search, type SearchToken } from '../search';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TOKENS: readonly SearchToken[] = [
  { key: 'kind', label: 'Kind: PDF' },
  { key: 'tag', label: 'Tag: Work' },
];

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

function mount(props: Partial<React.ComponentProps<typeof Search>>) {
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <Search value="" onChangeText={() => {}} {...props} />
      </BloomThemeProvider>,
    ),
  );
  return container.querySelector('input') as HTMLInputElement;
}

function keyDown(input: HTMLInputElement, init: KeyboardEventInit & { keyCode?: number }) {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  if (init.keyCode !== undefined) Object.defineProperty(event, 'keyCode', { value: init.keyCode });
  act(() => {
    input.dispatchEvent(event);
  });
}

it('draws the tokens before the input, in order, each with a named remove button', () => {
  const input = mount({ tokens: TOKENS, onRemoveToken: jest.fn() });
  const row = container.querySelector('[data-testid="searchTokens"]') as HTMLElement;
  expect(row.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const kind = container.querySelector('[data-testid="searchToken-kind"]') as HTMLElement;
  const tag = container.querySelector('[data-testid="searchToken-tag"]') as HTMLElement;
  expect(kind.getAttribute('aria-label')).toBe('Kind: PDF');
  expect(kind.compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(kind.querySelector('[aria-label="Remove Kind: PDF"]')).not.toBeNull();
  expect(input.getAttribute('placeholder')).toBeNull();
});

it('keeps the row to part of the field, so the input keeps the rest', () => {
  mount({ tokens: TOKENS });
  const row = container.querySelector('[data-testid="searchTokens"]') as HTMLElement;
  const style = getComputedStyle(row);
  expect(style.maxWidth).toBe('66%');
  expect(style.flexGrow).toBe('0');
  expect(style.flexShrink).toBe('1');
});

it('removes the last token on Backspace with the caret at the start and nothing selected', () => {
  const onRemoveToken = jest.fn();
  const input = mount({ value: 'report', tokens: TOKENS, onRemoveToken });
  input.setSelectionRange(6, 6);
  keyDown(input, { key: 'Backspace' });
  input.setSelectionRange(0, 3);
  keyDown(input, { key: 'Backspace' });
  expect(onRemoveToken).not.toHaveBeenCalled();
  input.setSelectionRange(0, 0);
  keyDown(input, { key: 'Backspace' });
  expect(onRemoveToken.mock.calls).toEqual([['tag']]);
});

it('leaves an input method’s composition alone', () => {
  const onRemoveToken = jest.fn();
  const input = mount({ tokens: TOKENS, onRemoveToken });
  keyDown(input, { key: 'Backspace', isComposing: true });
  keyDown(input, { key: 'Backspace', keyCode: 229 });
  expect(onRemoveToken).not.toHaveBeenCalled();
  keyDown(input, { key: 'Backspace' });
  expect(onRemoveToken.mock.calls).toEqual([['tag']]);
});

it('reads an uncontrolled field’s caret off the input', () => {
  const onRemoveToken = jest.fn();
  const input = mount({ value: undefined, defaultValue: 'report', tokens: TOKENS, onRemoveToken });
  input.setSelectionRange(6, 6);
  keyDown(input, { key: 'Backspace' });
  expect(onRemoveToken).not.toHaveBeenCalled();
  input.setSelectionRange(0, 0);
  keyDown(input, { key: 'Backspace' });
  expect(onRemoveToken.mock.calls).toEqual([['tag']]);
});

it('draws nothing new without tokens', () => {
  const input = mount({ label: 'Search files' });
  expect(container.querySelector('[data-testid="searchTokens"]')).toBeNull();
  expect(input.getAttribute('placeholder')).toBe('Search files');
});
