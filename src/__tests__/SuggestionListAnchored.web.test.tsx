/** @jest-environment jsdom */
import type React from 'react';
import { act, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: 1024, height: 768, scale: 1, fontScale: 1 }),
}));
import { View } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
import { SuggestionList } from '../chat-composer/SuggestionList.web';
import { suggestionOptionId } from '../chat-composer/suggestion-option-id';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let anchorTop = 730;
const choices = [
  {
    id: 'heading/1',
    label: 'Heading',
    group: 'Text',
    leading: <span data-testid="custom-icon">H</span>,
  },
  { id: 'table', label: 'Table', group: 'Data', description: 'Columns and rows' },
  { id: 'disabled', label: 'Unavailable', disabled: true },
];
function tick() {
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
}
function node(id: string) {
  return document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
}
function Harness({
  active = 0,
  onChoose = jest.fn(),
  onActive = jest.fn(),
  onClose = jest.fn(),
  size = 'md' as 'md' | 'lg',
}) {
  const contextRef = useRef<React.ComponentRef<typeof View>>(null);
  const [open, setOpen] = useState(true);
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={size}>
        <View ref={contextRef}>
          <input
            data-testid="editor"
            aria-controls="results"
            aria-activedescendant={suggestionOptionId('results', choices[active]!.id)}
          />
        </View>
        <button data-testid="other" type="button">
          Other field
        </button>
        <SuggestionList
          kind="command"
          suggestions={choices}
          listboxId="results"
          activeIndex={active}
          onSelectSuggestion={onChoose}
          onActiveIndexChange={onActive}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            onClose(next);
          }}
          anchor={{
            contextRef,
            getRect: () => ({ top: anchorTop, bottom: anchorTop + 20, left: 100, right: 100 }),
          }}
          testID="suggestions"
        />
      </BloomScope>
    </BloomThemeProvider>
  );
}
const originalRect = HTMLElement.prototype.getBoundingClientRect;
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.testid === 'suggestions' ? 200 : 20;
  });
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300);
  anchorTop = 730;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const panel = this.dataset.testid === 'suggestions';
    return {
      x: 100,
      y: panel ? 400 : 0,
      top: panel ? 400 : 0,
      left: 100,
      right: 400,
      bottom: panel ? 600 : 20,
      width: 300,
      height: panel ? 200 : 20,
      toJSON: () => ({}),
    };
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  jest.restoreAllMocks();
  jest.useRealTimers();
});
function mount(props: React.ComponentProps<typeof Harness> = {}) {
  act(() => root.render(<Harness {...props} />));
  tick();
}

it('owns one menu-material surface and scroller, preserves focus, and links stable listbox/option IDs', () => {
  mount();
  const editor = node('editor');
  act(() => editor.focus());
  expect(document.activeElement).toBe(editor);
  expect(node('suggestions').getAttribute('role')).toBe('listbox');
  expect(node('suggestions').id).toBe('results');
  expect(document.getElementById(editor.getAttribute('aria-activedescendant')!)).toBe(
    node('suggestions-row-heading/1'),
  );
  expect(node('suggestions').querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  expect(node('suggestions').className).toContain('bloom-floating-surface');
  expect(node('custom-icon')).not.toBeNull();
  expect(node('suggestions').textContent).toContain('Text');
  expect(node('suggestions').textContent).toContain('Data');
  expect(node('suggestions-row-table').tabIndex).toBe(-1);
  expect(getComputedStyle(node('suggestions-row-table').parentElement!).gap).toBe('2px');
});

it('flips above a low caret and follows its virtual box after an ancestor scroll', () => {
  mount();
  expect(Number.parseFloat(node('suggestions').style.top)).toBeLessThan(anchorTop);
  anchorTop = 100;
  act(() => window.dispatchEvent(new Event('scroll')));
  tick();
  expect(Number.parseFloat(node('suggestions').style.top)).toBe(124);
});

it('mouse selection keeps the editing field focused; outside press passes through and closes', () => {
  const choose = jest.fn();
  const close = jest.fn();
  mount({ onChoose: choose, onClose: close });
  const editor = node('editor');
  act(() => editor.focus());
  const row = node('suggestions-row-table');
  const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
  act(() => row.dispatchEvent(down));
  expect(down.defaultPrevented).toBe(true);
  act(() => row.click());
  expect(choose).toHaveBeenCalledWith(choices[1], 1);
  expect(document.activeElement).toBe(editor);
  const outside = new MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    clientX: 900,
    clientY: 20,
  });
  act(() => node('other').dispatchEvent(outside));
  expect(outside.defaultPrevented).toBe(false);
  expect(close).toHaveBeenCalledWith(false);
});

it('dismisses on focus leaving the editing context without restoring focus', () => {
  const close = jest.fn();
  mount({ onClose: close });
  act(() => node('editor').focus());
  act(() => node('other').focus());
  tick();
  expect(close).toHaveBeenCalledWith(false);
  expect(document.activeElement).toBe(node('other'));
  expect(document.getElementById('results')).toBeNull();
});

it('reveals the active option only in its own scroller and inherits scope typography', () => {
  mount({ size: 'lg' });
  const viewport = node('suggestions').querySelector<HTMLElement>('[data-bloom-scroll-area]')!;
  viewport.getBoundingClientRect = () => ({
    top: 0,
    bottom: 100,
    height: 100,
    left: 0,
    right: 300,
    width: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  node('suggestions-row-table').getBoundingClientRect = () => ({
    top: 150,
    bottom: 190,
    height: 40,
    left: 0,
    right: 300,
    width: 300,
    x: 0,
    y: 150,
    toJSON: () => ({}),
  });
  const documentScroll = document.documentElement.scrollTop;
  mount({ active: 1, size: 'lg' });
  expect(viewport.scrollTop).toBe(90);
  expect(document.documentElement.scrollTop).toBe(documentScroll);
  expect(
    getComputedStyle(node('suggestions-row-table').querySelector('[dir="auto"]')!).fontSize,
  ).toBe('16px');
});

it('keeps keyboard highlight when layout moves under a parked pointer, then responds to real motion', () => {
  const active = jest.fn();
  mount({ onActive: active });
  const move = (id: string, x: number) => {
    const event = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: 50 });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    act(() => node(id).dispatchEvent(event));
  };
  move('suggestions-row-table', 10);
  expect(active).toHaveBeenLastCalledWith(1);
  active.mockClear();
  mount({ active: 0, onActive: active });
  move('suggestions-row-table', 10);
  expect(active).not.toHaveBeenCalled();
  move('suggestions-row-table', 11);
  expect(active).toHaveBeenLastCalledWith(1);
  active.mockClear();
  move('suggestions-row-disabled', 12);
  expect(active).not.toHaveBeenCalled();
});

it('announces loading and empty answers without a selected option', () => {
  const contextRef = { current: null };
  const anchor = { contextRef, getRect: () => ({ top: 40, bottom: 60, left: 20, right: 20 }) };
  const draw = (loading: boolean) =>
    act(() =>
      root.render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <SuggestionList
            kind="mention"
            suggestions={[]}
            anchor={anchor}
            loading={loading}
            showEmpty
            loadingLabel="Searching contacts"
            emptyLabel="No contacts"
            listboxId="empty-results"
            testID="empty-list"
          />
        </BloomThemeProvider>,
      ),
    );
  draw(true);
  tick();
  expect(node('empty-list').getAttribute('aria-busy')).toBe('true');
  expect(node('empty-list').textContent).toContain('Searching contacts');
  expect(node('empty-list').querySelector('[role="option"]')).toBeNull();
  draw(false);
  tick();
  expect(node('empty-list').getAttribute('aria-busy')).toBe('false');
  expect(node('empty-list').textContent).toContain('No contacts');
});
