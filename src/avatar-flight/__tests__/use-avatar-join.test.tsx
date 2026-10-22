import { act, renderHook } from '@testing-library/react-native';
import { useMemo, useState } from 'react';

import { avatarJoinFlights } from '../join';
import type { AvatarFlightSpec, AvatarJoinArrival } from '../types';
import type { AvatarFlights } from '../use-avatar-flights';
import { useAvatarJoin } from '../use-avatar-join';

interface Member {
  id: string;
  avatar: AvatarFlightSpec['character'];
}

const member = (id: string): Member => ({
  id,
  avatar: { color: id } as unknown as AvatarFlightSpec['character'],
});
const route = {
  from: (agent: Member) => `reply:${agent.id}`,
  to: 'profile',
  character: (agent: Member) => agent.avatar,
};

/** The controller as far as the join reads it: what is in the air, and where to. */
const world = {
  reduced: false,
  launches: [] as AvatarFlightSpec[][],
  land: () => {},
};

function useFakeFlights(): AvatarFlights {
  const [flying, setFlying] = useState<AvatarFlightSpec[]>([]);
  world.land = () => setFlying([]);
  return useMemo(
    () =>
      ({
        anchor: () => () => undefined,
        snapshot: () => () => undefined,
        launch: async (specs: readonly AvatarFlightSpec[]) => {
          world.launches.push([...specs]);
          if (world.reduced || specs.length === 0) return false;
          setFlying([...specs]);
          return true;
        },
        cancel: () => setFlying([]),
        isLeaving: (key: string) => flying.some((spec) => spec.from === key),
        isLanding: (key: string) => flying.some((spec) => spec.to === key),
        layer: {} as AvatarFlights['layer'],
      }) as AvatarFlights,
    [flying],
  );
}

function setup(initial: AvatarJoinArrival<Member>[], withFlights = true) {
  return renderHook(
    ({ arrivals }: { arrivals: AvatarJoinArrival<Member>[] }) => {
      const flights = useFakeFlights();
      const joined = useAvatarJoin({ arrivals, flights: withFlights ? flights : null, ...route });
      return { joined: joined.map((agent) => agent.id), landing: flights.isLanding('profile') };
    },
    { initialProps: { arrivals: initial } },
  );
}

/** Two frames: the source carrying the avatar lays out before it is measured. */
const afterLayout = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(48);
  });
const live = (id: string) => ({ agent: member(id), live: true });

beforeEach(() => {
  jest.useFakeTimers();
  world.reduced = false;
  world.launches = [];
});

afterEach(() => {
  jest.useRealTimers();
});

describe('avatarJoinFlights', () => {
  it('flies each from its own anchor into the target, merging, staggered', () => {
    const specs = avatarJoinFlights([member('sindi'), member('lumi')], route);
    expect(specs.map(({ landing: _landing, ...spec }) => spec)).toEqual([
      {
        key: 'join:sindi',
        character: { color: 'sindi' },
        from: 'reply:sindi',
        to: 'profile',
        duration: 950,
        delay: 0,
        merge: true,
      },
      {
        key: 'join:lumi',
        character: { color: 'lumi' },
        from: 'reply:lumi',
        to: 'profile',
        duration: 950,
        delay: 120,
        merge: true,
      },
    ]);
    // Shrinks into a 14px square at the centre of the target.
    expect(specs[0]?.landing?.({ x: 0, y: 0, width: 40, height: 40 })).toEqual({
      x: 13,
      y: 13,
      width: 14,
      height: 14,
    });
  });
});

describe('useAvatarJoin', () => {
  it('flies an arriving agent in, and joins it only when it lands', async () => {
    const hook = setup([]);
    hook.rerender({ arrivals: [live('sindi')] });
    await afterLayout();

    expect(world.launches.map((batch) => batch.map((spec) => spec.key))).toEqual([['join:sindi']]);
    expect(hook.result.current).toEqual({ joined: [], landing: true });

    await act(async () => world.land());
    expect(hook.result.current).toEqual({ joined: ['sindi'], landing: false });
  });

  it('flies several arriving together as one staggered batch', async () => {
    const hook = setup([]);
    hook.rerender({ arrivals: [live('sindi'), live('lumi')] });
    await afterLayout();

    expect(world.launches).toHaveLength(1);
    expect(world.launches[0]?.map((spec) => [spec.from, spec.delay])).toEqual([
      ['reply:sindi', 0],
      ['reply:lumi', 120],
    ]);
    await act(async () => world.land());
    expect(hook.result.current.joined).toEqual(['sindi', 'lumi']);
  });

  it('waits for a batch in the air before the next takes off', async () => {
    const hook = setup([]);
    hook.rerender({ arrivals: [live('sindi')] });
    await afterLayout();
    hook.rerender({ arrivals: [live('sindi'), live('lumi')] });
    await afterLayout();
    expect(world.launches).toHaveLength(1);

    await act(async () => world.land());
    await afterLayout();
    expect(hook.result.current.joined).toEqual(['sindi']);
    expect(world.launches[1]?.map((spec) => spec.key)).toEqual(['join:lumi']);
    await act(async () => world.land());
    expect(hook.result.current.joined).toEqual(['sindi', 'lumi']);
  });

  it('joins at once when nothing flies (reduced motion)', async () => {
    world.reduced = true;
    const hook = setup([]);
    hook.rerender({ arrivals: [live('sindi')] });
    await afterLayout();
    expect(hook.result.current.joined).toEqual(['sindi']);
  });

  it('joins at once without a flights controller', async () => {
    const hook = setup([], false);
    hook.rerender({ arrivals: [live('sindi')] });
    expect(hook.result.current.joined).toEqual(['sindi']);
    expect(world.launches).toEqual([]);
  });

  it('joins an agent that was already there without flying', () => {
    const hook = setup([{ agent: member('sindi'), live: false }]);
    expect(hook.result.current.joined).toEqual(['sindi']);
    expect(world.launches).toEqual([]);
  });

  it('starts over on a new resetKey', () => {
    const hook = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        useAvatarJoin({
          arrivals: resetKey === 'a' ? [{ agent: member('sindi'), live: false }] : [],
          flights: null,
          resetKey,
          ...route,
        }).map((agent) => agent.id),
      { initialProps: { resetKey: 'a' } },
    );
    expect(hook.result.current).toEqual(['sindi']);
    hook.rerender({ resetKey: 'b' });
    expect(hook.result.current).toEqual([]);
  });
});
