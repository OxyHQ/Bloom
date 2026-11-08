import { act, renderHook } from '@testing-library/react-native';
import { useCharacterHistory } from '../use-character-history';
import type { AgentCreatorAgent } from '../types';
const original = { preset: 'blue_beret' } as const;
const agent: AgentCreatorAgent = {
  id: 'a',
  name: 'Agent',
  label: 'Label',
  description: 'Description',
  avatar: original,
  preferences: { voice: 'default', speed: 1, language: 'en', notifications: true },
};
const red = { ...original, bodyColor: '#ff0000' } as const;
const blue = { ...original, bodyColor: '#0000ff' } as const;
it('retains current selection through delayed own echoes and preserves latest business fields', () => {
  const emit = jest.fn();
  const h = renderHook(
    ({ value }: { value: AgentCreatorAgent }) => useCharacterHistory(value, emit),
    { initialProps: { value: agent } },
  );
  act(() => {
    h.result.current.change(red);
    h.result.current.change(blue);
  });
  expect(h.result.current.character).toEqual(blue);
  h.rerender({
    value: {
      ...agent,
      avatar: red,
      name: 'Updated',
      preferences: { ...agent.preferences!, speed: 1.5 },
    },
  });
  expect(h.result.current.character).toEqual(blue);
  act(() => h.result.current.undo());
  expect(emit).toHaveBeenLastCalledWith({
    ...agent,
    avatar: red,
    name: 'Updated',
    preferences: { ...agent.preferences!, speed: 1.5 },
  });
  h.rerender({ value: { ...agent, avatar: red, name: 'Updated again' } });
  expect(h.result.current.canRedo).toBe(true);
  act(() => h.result.current.redo());
  expect(h.result.current.character).toEqual(blue);
});
it('records one transaction for a drag, restores the session original undoably and preserves redo on no-op', () => {
  const h = renderHook(() => useCharacterHistory(agent, jest.fn()));
  act(() => {
    h.result.current.begin();
    h.result.current.change(red);
    h.result.current.change(blue);
    h.result.current.end();
  });
  act(() => h.result.current.undo());
  expect(h.result.current.character).toEqual(original);
  expect(h.result.current.canUndo).toBe(false);
  act(() => h.result.current.change(original));
  expect(h.result.current.canRedo).toBe(true);
  act(() => h.result.current.redo());
  expect(h.result.current.character).toEqual(blue);
  act(() => h.result.current.restore());
  expect(h.result.current.character).toEqual(original);
  act(() => h.result.current.undo());
  expect(h.result.current.character).toEqual(blue);
  act(() => h.result.current.change(red));
  expect(h.result.current.canRedo).toBe(false);
  expect(original).toEqual({ preset: 'blue_beret' });
  expect(Object.isFrozen(h.result.current.character)).toBe(true);
});
it('rebases on external character replacement and agent identity, not profile-only changes', () => {
  const emit = jest.fn();
  const h = renderHook(
    ({ value }: { value: AgentCreatorAgent }) => useCharacterHistory(value, emit),
    { initialProps: { value: agent } },
  );
  act(() => h.result.current.change(red));
  h.rerender({ value: { ...agent, avatar: red } });
  h.rerender({ value: { ...agent, avatar: red, description: 'New description' } });
  expect(h.result.current.canUndo).toBe(true);
  h.rerender({ value: { ...agent, avatar: blue } });
  expect(h.result.current.canUndo).toBe(false);
  expect(h.result.current.canRestore).toBe(false);
  act(() => h.result.current.change(red));
  act(() => h.result.current.restore());
  expect(h.result.current.character).toEqual(blue);
  h.rerender({ value: { ...agent, id: 'b' } });
  expect(h.result.current.character).toEqual(original);
  expect(h.result.current.canUndo).toBe(false);
});
it('bounds undo history without mutating saved recipes', () => {
  const h = renderHook(() => useCharacterHistory(agent, jest.fn()));
  act(() => {
    for (let i = 1; i <= 60; i++)
      h.result.current.change({
        ...original,
        bodyColor: '#ff' + i.toString(16).padStart(2, '0') + 'aa',
      });
  });
  let count = 0;
  while (h.result.current.canUndo) {
    act(() => h.result.current.undo());
    count++;
  }
  expect(count).toBe(50);
  expect(h.result.current.character).toEqual({ ...original, bodyColor: '#ff0aaa' });
});
