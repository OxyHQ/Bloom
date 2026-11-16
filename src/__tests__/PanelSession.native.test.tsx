import { useLayoutEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import { Platform, TextInput } from 'react-native';
import { PanelSessionProvider, usePanelSessionFocus } from '../app-shell/panel-session';

type Mode = 'inline' | 'floating';
type Target = { focus: jest.Mock; setSelection: jest.Mock };
let current: Target | null;
let handlers: ReturnType<typeof usePanelSessionFocus<Target>>;
let node: Target;
const originalOS = Platform.OS;
const originalState = TextInput.State;
const originalRequestFrame = global.requestAnimationFrame;
const originalCancelFrame = global.cancelAnimationFrame;
let frames: Map<number, FrameRequestCallback>;
let nextFrame = 0;
function flushFrames() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}

function Editor() {
  handlers = usePanelSessionFocus<Target>('editor');
  useLayoutEffect(() => {
    node = { focus: jest.fn(), setSelection: jest.fn() };
    handlers.ref(node);
    return () => {
      handlers.ref(null);
    };
  }, []);
  return null;
}
function surface(mode: Mode, active = true) {
  return (
    <PanelSessionProvider presentation={mode} active={active}>
      {active ? <Editor key={mode} /> : null}
    </PanelSessionProvider>
  );
}
function nativeFocus() {
  current = node;
  handlers.onFocus();
}
function selection(start: number, end: number) {
  handlers.onSelectionChange({ nativeEvent: { selection: { start, end } } });
}
beforeEach(() => {
  frames = new Map();
  global.requestAnimationFrame = (callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  };
  global.cancelAnimationFrame = (id) => {
    if (id != null) frames.delete(id);
  };
  Platform.OS = 'android';
  current = null;
  Object.defineProperty(TextInput, 'State', {
    configurable: true,
    value: { ...originalState, currentlyFocusedInput: () => current },
  });
});
afterEach(() => {
  Platform.OS = originalOS;
  Object.defineProperty(TextInput, 'State', { configurable: true, value: originalState });
  global.requestAnimationFrame = originalRequestFrame;
  global.cancelAnimationFrame = originalCancelFrame;
});

it.each([
  ['inline', 'floating'],
  ['floating', 'inline'],
] as const)(
  'waits for native focus completion before restoring selection from %s to %s',
  (from, to) => {
    const tree = render(surface(from));
    act(() => {
      nativeFocus();
      selection(0, 12);
    });
    tree.rerender(surface(to));
    // RN can mark the input focused synchronously before native autofocus has
    // completed. That JS state is not a completed native focus acknowledgement.
    current = node;
    act(() => flushFrames());
    expect(node.focus).toHaveBeenCalledTimes(1);
    expect(node.setSelection).not.toHaveBeenCalled();
    // Android initializes the controlled value's caret while executing focus.
    // That happens after the JS focus() call, before native onFocus arrives.
    act(() => {
      selection(12, 12);
      nativeFocus();
    });
    expect(node.setSelection).toHaveBeenCalledTimes(1);
    expect(node.setSelection).toHaveBeenCalledWith(0, 12);
  },
);

it('cancels an in-flight native focus handoff on close and does not focus on reopen', () => {
  const tree = render(surface('inline'));
  act(() => {
    nativeFocus();
    selection(0, 12);
  });
  tree.rerender(surface('floating'));
  act(() => flushFrames());
  const outgoing = handlers;
  const closedNode = node;
  tree.rerender(surface('floating', false));
  act(() => outgoing.onFocus());
  expect(closedNode.setSelection).not.toHaveBeenCalled();
  tree.rerender(surface('floating'));
  act(() => flushFrames());
  expect(node.focus).not.toHaveBeenCalled();
});

it('leaves a different native focus destination in place', () => {
  const tree = render(surface('inline'));
  act(() => {
    nativeFocus();
    selection(0, 12);
  });
  tree.rerender(surface('floating'));
  current = { focus: jest.fn(), setSelection: jest.fn() };
  act(() => flushFrames());
  expect(node.focus).not.toHaveBeenCalled();
  expect(node.setSelection).not.toHaveBeenCalled();
});
