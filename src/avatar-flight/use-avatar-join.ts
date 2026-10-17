import { useEffect, useRef, useState } from 'react';

import { avatarJoinFlights } from './join';
import type { AvatarJoinArrival, AvatarJoinRoute } from './types';
import type { AvatarFlights } from './use-avatar-flights';

export interface UseAvatarJoinOptions<T extends { id: string }> extends AvatarJoinRoute<T> {
  /**
   * Everybody who belongs in the group, in the order they first arrived, each with whether it is
   * arriving now (`live`). Pass the whole list every render; an agent already joined is ignored.
   */
  arrivals: ReadonlyArray<AvatarJoinArrival<T>>;
  /** The screen's flights; `null` joins everybody in place without flying. */
  flights: AvatarFlights | null;
  /** A new value is a new group: nobody has joined it. */
  resetKey?: string | number;
}

/** Two frames: the source that carries the avatar mounts, then lays out, before it is measured. */
function afterLayout(run: () => void): () => void {
  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (callback: () => void) => setTimeout(callback, 16) as unknown as number;
  const cancelRaf =
    typeof cancelAnimationFrame === 'function'
      ? cancelAnimationFrame
      : (id: number) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
  let second: number | undefined;
  const first = raf(() => {
    second = raf(run);
  });
  return () => {
    cancelRaf(first);
    if (second !== undefined) cancelRaf(second);
  };
}

/**
 * Who has JOINED a group whose members arrive while it is on screen — a conversation's
 * participants as agents start answering — and the flights that bring them in.
 *
 * An agent arriving live flies from its `from` anchor into `to` (`avatarJoinFlights`), and joins
 * only when its avatar lands, so the target gains it exactly as the flight arrives. One batch flies
 * at a time: agents arriving while a batch — or any other flight into `to` — is in the air wait for
 * it to land, then fly together, staggered. With reduced motion, nothing measurable, or a launch
 * superseded, they join at once. An agent that was already there (`live: false`) is simply joined.
 *
 * Returns the joined agents, in the order they joined.
 */
export function useAvatarJoin<T extends { id: string }>({
  arrivals,
  flights,
  from,
  to,
  character,
  resetKey,
}: UseAvatarJoinOptions<T>): readonly T[] {
  const [joined, setJoined] = useState<T[]>([]);
  /** Agents waiting for a flight, and the batch in the air (`launched` once it took off). */
  const queue = useRef<T[]>([]);
  const [batch, setBatch] = useState<{ agents: T[]; launched: boolean } | null>(null);
  const [queued, setQueued] = useState(0);
  const flightsRef = useRef(flights);
  flightsRef.current = flights;
  const routeRef = useRef<AvatarJoinRoute<T>>({ from, to, character });
  routeRef.current = { from, to, character };

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on the key alone
  useEffect(() => {
    queue.current = [];
    setJoined([]);
    setBatch(null);
  }, [resetKey]);

  // Everybody who arrived is joined, or on the way.
  useEffect(() => {
    const known = new Set([
      ...joined.map((agent) => agent.id),
      ...queue.current.map((agent) => agent.id),
      ...(batch?.agents.map((agent) => agent.id) ?? []),
    ]);
    const already: T[] = [];
    let waiting = false;
    for (const { agent, live } of arrivals) {
      if (known.has(agent.id)) continue;
      known.add(agent.id);
      if (live && flightsRef.current !== null) {
        queue.current = [...queue.current, agent];
        waiting = true;
      } else {
        already.push(agent);
      }
    }
    if (already.length > 0) setJoined((current) => [...current, ...already]);
    if (waiting) setQueued((count) => count + 1);
  }, [arrivals, joined, batch]);

  // A batch takes off once nothing else is landing on the target.
  const landing = flights?.isLanding(to) ?? false;
  // biome-ignore lint/correctness/useExhaustiveDependencies: `queued` signals the queue (a ref) grew
  useEffect(() => {
    if (batch !== null || landing || queue.current.length === 0) return;
    const agents = queue.current;
    queue.current = [];
    setBatch({ agents, launched: false });
  }, [batch, landing, queued]);

  useEffect(() => {
    if (batch === null || batch.launched) return;
    let live = true;
    const cancel = afterLayout(() => {
      const current = flightsRef.current;
      const launched = current
        ? current.launch(avatarJoinFlights(batch.agents, routeRef.current))
        : Promise.resolve(false);
      void launched.then((flying) => {
        if (!live) return;
        if (flying) setBatch({ agents: batch.agents, launched: true });
        else {
          setJoined((current) => [...current, ...batch.agents]);
          setBatch(null);
        }
      });
    });
    return () => {
      live = false;
      cancel();
    };
  }, [batch]);

  // The batch is in: the group gains its agents as their avatars land.
  useEffect(() => {
    if (batch === null || !batch.launched || landing) return;
    setJoined((current) => [...current, ...batch.agents]);
    setBatch(null);
  }, [batch, landing]);

  return joined;
}
