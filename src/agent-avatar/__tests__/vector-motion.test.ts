import { referenceWorkTime, sampleVectorMotion } from "../vector-motion";

describe("procedural vector motion", () => {
  it("replays exactly after arbitrary time jumps", () => {
    const options = { time: 5.18, state: "idle" as const };
    const first = sampleVectorMotion(options);
    sampleVectorMotion({ ...options, time: 800 });
    expect(sampleVectorMotion(options)).toEqual(first);
  });
  it("holds the absolute pointer on both axes in every state", () => {
    for (const state of ["idle", "reaction", "work"] as const) {
      for (const time of [0, 0.3, 1.4, 8, 20]) {
        const pose = sampleVectorMotion({
          state,
          time,
          look: { yaw: 0, pitch: 0.4, mix: 1, wander: 0 },
        });
        expect(pose.yaw).toBe(0);
        expect(pose.pitch).toBe(0.4);
      }
    }
  });
  it("keeps wandering independent of externally owned direction", () => {
    const time = 2;
    const held = sampleVectorMotion({
      state: "idle",
      time,
      look: { yaw: 0.2, pitch: 0, mix: 1, wander: 0 },
    });
    const alive = sampleVectorMotion({
      state: "idle",
      time,
      look: { yaw: 0.2, pitch: 0, mix: 1, wander: 1 },
    });
    expect(held.yaw).toBe(0.2);
    expect(alive.yaw).not.toBe(held.yaw);
  });
  it("closes and reopens eyes without moving the body at the blink time", () => {
    expect(sampleVectorMotion({ state: "idle", time: 1.7 }).lid).toBe(1);
    expect(sampleVectorMotion({ state: "idle", time: 1.775 }).lid).toBeCloseTo(
      0,
    );
    expect(sampleVectorMotion({ state: "idle", time: 1.9 }).lid).toBeCloseTo(1);
  });
  it("looks down towards work without a pointer override", () => {
    expect(
      sampleVectorMotion({ state: "work", time: 0 }).pitch,
    ).toBeGreaterThan(0.15);
  });
  it("starts interrupted transitions at the actual displayed pose", () => {
    const idle = sampleVectorMotion({ state: "idle", time: 2 });
    const partial = sampleVectorMotion({
      state: "reaction",
      time: 2.1,
      stateTime: 0.1,
      transition: { from: idle, startedAt: 2 },
    });
    const interrupted = sampleVectorMotion({
      state: "work",
      time: 2.1,
      stateTime: 0,
      transition: { from: partial, startedAt: 2.1 },
    });
    expect(interrupted).toEqual(partial);
    const next = sampleVectorMotion({
      state: "work",
      time: 2.10001,
      stateTime: 0.00001,
      transition: { from: partial, startedAt: 2.1 },
    });
    for (const key of Object.keys(next) as (keyof typeof next)[])
      expect(Math.abs(next[key] - partial[key])).toBeLessThan(0.00001);
  });
  it("finishes a transition exactly at the current target pose", () => {
    const from = sampleVectorMotion({ state: "idle", time: 0 });
    const options = { state: "work" as const, time: 2, stateTime: 1 };
    expect(
      sampleVectorMotion({ ...options, transition: { from, startedAt: 1 } }),
    ).toEqual(sampleVectorMotion(options));
  });
  it("keeps long-running movement finite and bounded with uniform scale", () => {
    for (let time = 0; time < 1000; time += 0.137) {
      const pose = sampleVectorMotion({ state: "idle", time });
      expect(Object.values(pose).every(Number.isFinite)).toBe(true);
      expect(pose.scale).toBeGreaterThanOrEqual(0.997);
      expect(pose.scale).toBeLessThanOrEqual(1.003);
      expect(pose.lid).toBeGreaterThanOrEqual(0);
      expect(pose.lid).toBeLessThanOrEqual(1);
    }
    expect(
      Object.values(
        sampleVectorMotion({
          state: "idle",
          time: NaN,
          look: { yaw: NaN, pitch: Infinity, mix: 1 },
        }),
      ).every(Number.isFinite),
    ).toBe(true);
  });
});

describe("identity rhythm", () => {
  it("starts every identity neutral, including reduced-motion portraits", () => {
    for (const personalityKey of ["bot_blob", "bot_star", "bot_cloud"])
      expect(
        sampleVectorMotion({ personalityKey, state: "idle", time: 0 }),
      ).toEqual({ yaw: 0, pitch: 0, roll: 0, bob: 0, scale: 1, lid: 1 });
  });
  it("varies deterministic rhythms without changing an absolute pointer target", () => {
    const keys = ["bot_blob", "bot_cloud", "bot_star", "bot_heart"];
    const poses = keys.map((personalityKey) =>
      sampleVectorMotion({ personalityKey, state: "idle", time: 3 }),
    );
    expect(new Set(poses.map((pose) => pose.lid + ":" + pose.bob)).size).toBe(
      keys.length,
    );
    for (const personalityKey of keys) {
      const options = {
        personalityKey,
        state: "idle" as const,
        time: 3,
        look: { yaw: -0.4, pitch: 0.3, mix: 1, wander: 0 },
      };
      expect(sampleVectorMotion(options)).toEqual(sampleVectorMotion(options));
      expect(sampleVectorMotion(options)).toMatchObject({
        yaw: -0.4,
        pitch: 0.3,
      });
    }
  });
  it("keeps every work glance below the horizon and returns to keyboard focus", () => {
    const options = {
      personalityKey: "bot_blob",
      state: "work" as const,
      time: 4,
      look: { yaw: 0, pitch: 0, mix: 0, wander: 0 },
    };
    const baseline = sampleVectorMotion({ ...options, stateTime: 0 });
    const glance = sampleVectorMotion({ ...options, stateTime: 1.3 });
    expect(glance.pitch).toBeLessThan(baseline.pitch);
    expect(sampleVectorMotion({ ...options, stateTime: 2 }).pitch).toBe(
      baseline.pitch,
    );
    for (let stateTime = 0; stateTime < 4; stateTime += 0.05)
      expect(
        sampleVectorMotion({ ...options, stateTime }).pitch,
      ).toBeGreaterThan(0.1);
  });
  it("lets the eyes begin a reaction before the body and preserves interruption exactly", () => {
    const base = {
      personalityKey: "bot_star",
      time: 3,
      look: { yaw: 0, pitch: 0, mix: 0, wander: 0 },
    };
    const idle = sampleVectorMotion({ ...base, state: "idle" });
    const reaction = sampleVectorMotion({
      ...base,
      state: "reaction",
      stateTime: 0.1,
    });
    expect(reaction.yaw).not.toBe(idle.yaw);
    expect(reaction.bob).toBe(idle.bob);
    expect(
      sampleVectorMotion({
        ...base,
        state: "work",
        transition: { from: reaction, startedAt: 3 },
      }),
    ).toEqual(reaction);
  });
});

describe("reference work phase", () => {
  it("holds the screen glance briefly then recovers before the exit envelope", () => {
    expect(referenceWorkTime(1.46)).toBe(1.3);
    expect(referenceWorkTime(1.54)).toBe(1.3);
    for (const time of [0, 0.5, 1.15, 2.25, 2.987, 3.267])
      expect(referenceWorkTime(time)).toBe(time);
  });
  it("is monotone, bounded, and velocity-continuous at every join", () => {
    let previous = 0;
    for (let t = 0; t < 3.267; t += 0.001) {
      const mapped = referenceWorkTime(t);
      expect(mapped).toBeGreaterThanOrEqual(previous - 1e-12);
      expect(mapped).toBeLessThanOrEqual(3.267);
      previous = mapped;
    }
    const step = 1e-5;
    for (const t of [1.15, 1.45, 1.55, 2.25]) {
      const left = (referenceWorkTime(t) - referenceWorkTime(t - step)) / step;
      const right = (referenceWorkTime(t + step) - referenceWorkTime(t)) / step;
      expect(Math.abs(left - right)).toBeLessThan(0.001);
    }
  });
});
