import { SearchPresentationContext } from '../search/context';
import { act, renderHook } from '@testing-library/react-native';
import type { SearchProps } from '../search';
import { useSearchPresentation } from '../search/use-search-presentation';

const priorFrame = global.requestAnimationFrame;
const priorCancel = global.cancelAnimationFrame;
afterAll(() => {
  global.requestAnimationFrame = priorFrame;
  global.cancelAnimationFrame = priorCancel;
});
beforeEach(() => {
  jest.useFakeTimers();
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(() => cb(0), 0) as unknown as number);
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function setup(props: SearchProps = {}) {
  const input = { current: { focus: jest.fn(), blur: jest.fn() } };
  const hook = renderHook(
    (current: SearchProps) => useSearchPresentation(current, input as never),
    { initialProps: props },
  );
  return { ...hook, input };
}
function layout(width: number) {
  return { nativeEvent: { layout: { width, height: 36, x: 0, y: 0 } } } as Parameters<
    NonNullable<ReturnType<typeof useSearchPresentation>['onLayout']>
  >[0];
}

it('uses allocated width, preserves an active field on shrink, and does not steal focus on expansion', () => {
  const { result, input } = setup({ presentation: 'auto' });
  expect(result.current.expanded).toBe(false);
  act(() => result.current.onLayout?.(layout(320)));
  expect(result.current.expanded).toBe(true);
  expect(input.current.focus).not.toHaveBeenCalled();
  act(() => result.current.focus());
  act(() => result.current.onLayout?.(layout(120)));
  expect(result.current.expanded).toBe(true);
  act(() => result.current.blur());
  act(() => jest.advanceTimersByTime(150));
  expect(result.current.expanded).toBe(false);
});

it('cancels empty blur when focus returns to the field or one of its actions', () => {
  const changed = jest.fn();
  const { result } = setup({
    presentation: 'collapsible',
    defaultOpen: true,
    onOpenChange: changed,
  });
  act(() => result.current.blur());
  act(() => jest.advanceTimersByTime(100));
  act(() => result.current.focus());
  act(() => jest.advanceTimersByTime(100));
  expect(result.current.expanded).toBe(true);
  expect(changed).not.toHaveBeenCalled();
});

it('keeps a query on blur, and explicit dismissal restores the trigger without clearing by default', () => {
  const clear = jest.fn();
  const { result, input } = setup({ presentation: 'auto', value: 'Nature', onClearText: clear });
  const focus = jest.fn();
  result.current.trigger.current = { focus } as never;
  act(() => result.current.blur());
  act(() => jest.advanceTimersByTime(150));
  expect(result.current.expanded).toBe(true);
  act(() => result.current.close());
  act(() => jest.runOnlyPendingTimers());
  expect(result.current.expanded).toBe(false);
  expect(clear).not.toHaveBeenCalled();
  expect(input.current.blur).toHaveBeenCalledTimes(1);
  expect(focus).toHaveBeenCalledTimes(1);
  act(() => result.current.show());
  act(() => jest.runOnlyPendingTimers());
  expect(input.current.focus).toHaveBeenCalledTimes(1);
});

it('leaves open state controlled and cancels blur/focus work on unmount', () => {
  const changed = jest.fn();
  const { result, input, rerender, unmount } = setup({
    presentation: 'collapsible',
    open: false,
    onOpenChange: changed,
  });
  act(() => result.current.show());
  expect(changed).toHaveBeenCalledWith(true);
  expect(result.current.expanded).toBe(false);
  rerender({ presentation: 'collapsible', open: true, onOpenChange: changed });
  act(() => result.current.blur());
  changed.mockClear();
  unmount();
  act(() => jest.runOnlyPendingTimers());
  expect(input.current.focus).not.toHaveBeenCalled();
  expect(changed).not.toHaveBeenCalled();
});

it('clears only when the composition explicitly requests close-and-clear', () => {
  const clear = jest.fn();
  const { result } = setup({
    presentation: 'collapsible',
    defaultOpen: true,
    clearOnClose: true,
    onClearText: clear,
  });
  act(() => result.current.close());
  expect(clear).toHaveBeenCalledTimes(1);
});

it('returns a compact header row after closing even when opening made the input wide', () => {
  const onActiveChange = jest.fn();
  const input = { current: { focus: jest.fn(), blur: jest.fn() } };
  const { result, unmount } = renderHook(
    () => useSearchPresentation({ presentation: 'auto' }, input as never),
    {
      wrapper: ({ children }) => (
        <SearchPresentationContext.Provider value={{ compact: true, onActiveChange }}>
          {children}
        </SearchPresentationContext.Provider>
      ),
    },
  );
  act(() => result.current.onLayout?.(layout(44)));
  act(() => result.current.show());
  expect(onActiveChange).toHaveBeenLastCalledWith(true);
  act(() => result.current.onLayout?.(layout(328)));
  expect(result.current.collapsible).toBe(true);
  act(() => result.current.close());
  expect(result.current.expanded).toBe(false);
  expect(onActiveChange).toHaveBeenLastCalledWith(true);
  act(() => jest.advanceTimersByTime(1000));
  expect(onActiveChange).toHaveBeenLastCalledWith(false);
  act(() => result.current.show());
  unmount();
  expect(onActiveChange).toHaveBeenLastCalledWith(false);
});
