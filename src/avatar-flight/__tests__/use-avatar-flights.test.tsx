import { act, renderHook } from '@testing-library/react-native';
import type { ComponentRef } from 'react';
import type { View } from 'react-native';

import { useAvatarFlights } from '../use-avatar-flights';
import type { AvatarFlightSpec } from '../types';

const node = (x: number, y: number, w: number, h: number) =>
  ({
    measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(x, y, w, h),
  }) as ComponentRef<typeof View>;

const character = { shape: 'blob' } as unknown as AvatarFlightSpec['character'];
const spec = (key: string, from: string, to: string): AvatarFlightSpec => ({
  key,
  character,
  from,
  to,
});

function setup() {
  const hook = renderHook(() => useAvatarFlights());
  act(() => {
    hook.result.current.anchor('a')(node(20, 200, 80, 80));
  });
  return hook;
}

describe('useAvatarFlights', () => {
  it('hands out one stable ref per anchor key', () => {
    const { result } = setup();
    expect(result.current.anchor('a')).toBe(result.current.anchor('a'));
    expect(result.current.anchor('a')).not.toBe(result.current.anchor('b'));
  });

  it('marks the source leaving and the target landing from launch until the avatar arrives', async () => {
    const { result } = setup();
    expect(result.current.isLeaving('a')).toBe(false);
    let started = false;
    await act(async () => {
      started = await result.current.launch([spec('one', 'a', 'b')]);
    });
    expect(started).toBe(true);
    expect(result.current.isLeaving('a')).toBe(true);
    expect(result.current.isLanding('b')).toBe(true);
    expect(result.current.isLanding('a')).toBe(false);
    act(() => result.current.layer.arrive('one'));
    expect(result.current.isLeaving('a')).toBe(false);
    expect(result.current.isLanding('b')).toBe(false);
    expect(result.current.layer.flights).toHaveLength(0);
  });

  it('keeps a multi-avatar flight until every avatar has arrived', async () => {
    const { result } = setup();
    act(() => {
      result.current.anchor('c')(node(120, 200, 80, 80));
    });
    await act(async () => {
      await result.current.launch([spec('one', 'a', 'x'), spec('two', 'c', 'y')]);
    });
    act(() => result.current.layer.arrive('one'));
    expect(result.current.isLanding('x')).toBe(false);
    expect(result.current.isLanding('y')).toBe(true);
    expect(result.current.layer.arrived).toEqual(['one']);
    act(() => result.current.layer.arrive('two'));
    expect(result.current.layer.flights).toHaveLength(0);
  });

  it('drops a flight whose source cannot be measured, and starts none if none can', async () => {
    const { result } = setup();
    let started = true;
    await act(async () => {
      started = await result.current.launch([spec('one', 'missing', 'b')]);
    });
    expect(started).toBe(false);
    expect(result.current.layer.flights).toHaveLength(0);
    expect(result.current.isLanding('b')).toBe(false);
  });

  it('captures the source picture once, at departure, and freezes it', async () => {
    const { result } = setup();
    const capture = jest.fn(async () => ({ uri: 'data:image/png;base64,departure' }));
    act(() => result.current.snapshot('a')(capture));
    expect(capture).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.launch([spec('one', 'a', 'b')]);
    });
    expect(capture).toHaveBeenCalledTimes(1);
    const snapshot = result.current.layer.flights[0]!.snapshot;
    expect(snapshot?.uri).toBe('data:image/png;base64,departure');
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('keeps the flight when the pixel capture fails', async () => {
    const { result } = setup();
    act(() =>
      result.current.snapshot('a')(async () => {
        throw Error('unavailable');
      }),
    );
    await act(async () => {
      await result.current.launch([spec('one', 'a', 'b')]);
    });
    expect(result.current.layer.flights[0]!.snapshot).toBeUndefined();
    expect(result.current.layer.flights[0]!.from).toEqual({ x: 20, y: 200, width: 80, height: 80 });
  });

  it('cancel ends the flights, and a launch still capturing never lands afterwards', async () => {
    const { result } = setup();
    let release: (value: { uri: string }) => void = () => {};
    const pending = new Promise<{ uri: string }>((resolve) => {
      release = resolve;
    });
    act(() => result.current.snapshot('a')(() => pending));
    let launching: Promise<boolean> = Promise.resolve(true);
    act(() => {
      launching = result.current.launch([spec('one', 'a', 'b')]);
    });
    act(() => result.current.cancel());
    release({ uri: 'late' });
    let started = true;
    await act(async () => {
      started = await launching;
    });
    expect(started).toBe(false);
    expect(result.current.layer.flights).toHaveLength(0);
    expect(result.current.isLanding('b')).toBe(false);
  });
});
