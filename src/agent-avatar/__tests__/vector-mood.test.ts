import { CHARACTER_PRESETS, CHARACTER_TEMPLATES } from '../../agent-creator/constants';
import { resolveAvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';
import { composeVectorCharacter } from '../vector-compose';
import { renderVectorFrame } from '../vector-frame';
import {
  advanceVectorMood,
  applyVectorMood,
  initialVectorMood,
  sampleVectorDecline,
  setVectorMood,
  settleVectorMood,
  VECTOR_DECLINE_SECONDS,
  VECTOR_REST_MOTION,
  vectorMoodActive,
  vectorMoodFrame,
  type VectorMoodState,
} from '../vector-mood';
import type { VectorData } from '../vector-types';

const run = (state: VectorMoodState, mood: 'sad' | 'neutral', seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) advanceVectorMood(state, mood, 1 / 60);
};

describe('the "no" head shake', () => {
  it('starts and ends at rest, and turns both ways three times with shrinking swings', () => {
    expect(sampleVectorDecline(0)).toBe(0);
    expect(sampleVectorDecline(VECTOR_DECLINE_SECONDS)).toBe(0);
    expect(sampleVectorDecline(-1)).toBe(0);
    expect(sampleVectorDecline(Number.NaN)).toBe(0);
    const samples: number[] = [];
    for (let t = 0; t <= VECTOR_DECLINE_SECONDS; t += 0.002) samples.push(sampleVectorDecline(t));
    const peaks: number[] = [];
    let sign = 0,
      peak = 0;
    for (const value of samples) {
      const next = Math.sign(value);
      if (next !== 0 && next !== sign) {
        if (sign !== 0) peaks.push(peak);
        sign = next;
        peak = 0;
      }
      peak = Math.max(peak, Math.abs(value));
    }
    peaks.push(peak);
    expect(peaks).toHaveLength(6);
    for (let i = 1; i < peaks.length; i++) expect(peaks[i]!).toBeLessThan(peaks[i - 1]!);
    expect(peaks[0]!).toBeGreaterThan(0.25);
    expect(peaks[0]!).toBeLessThan(0.6);
    // A brisk shake, but no jump: at 60 fps no frame turns the head more than 6 degrees.
    for (let t = 0; t < VECTOR_DECLINE_SECONDS; t += 1 / 60)
      expect(Math.abs(sampleVectorDecline(t + 1 / 60) - sampleVectorDecline(t))).toBeLessThan(0.1);
  });
});

describe('mood state', () => {
  it('shakes once as it becomes sad, and not again while it stays sad', () => {
    const state = initialVectorMood('sad');
    expect(state).toEqual({ sadness: 0, declineTime: 0 });
    expect(vectorMoodActive(state)).toBe(true);
    run(state, 'sad', 0.5);
    const into = state.declineTime;
    setVectorMood(state, 'sad', 'sad');
    expect(state.declineTime).toBe(into);
    setVectorMood(state, 'neutral', 'sad');
    expect(state.declineTime).toBe(into);
    setVectorMood(state, 'sad', 'neutral');
    expect(state.declineTime).toBe(0);
  });
  it('sets the dejected pose in over about a second, then holds it exactly', () => {
    const state = initialVectorMood('sad');
    run(state, 'sad', 0.4);
    expect(state.sadness).toBeGreaterThan(0.5);
    expect(state.sadness).toBeLessThan(0.75);
    run(state, 'sad', 1.2);
    expect(state.sadness).toBeGreaterThan(0.97);
    run(state, 'sad', 3);
    expect(state.sadness).toBe(1);
  });
  it('lifts back to a neutral character that draws exactly as one never sad', () => {
    const state = initialVectorMood('sad');
    run(state, 'sad', 3);
    run(state, 'neutral', 0.4);
    expect(state.sadness).toBeGreaterThan(0);
    expect(vectorMoodActive(state)).toBe(true);
    run(state, 'neutral', 4);
    expect(state.sadness).toBe(0);
    expect(vectorMoodActive(state)).toBe(false);
    expect(vectorMoodActive(initialVectorMood('neutral'))).toBe(false);
    expect(vectorMoodActive(initialVectorMood(undefined))).toBe(false);
  });
  it('settles a still character in the mood with no shake', () => {
    const state = initialVectorMood('sad');
    settleVectorMood(state, 'sad');
    expect(state.sadness).toBe(1);
    expect(sampleVectorDecline(state.declineTime)).toBe(0);
    settleVectorMood(state, 'neutral');
    expect(vectorMoodActive(state)).toBe(false);
  });
});

describe('the sad pose', () => {
  it('leaves a neutral pose untouched', () => {
    const pose = { yaw: 0.2, pitch: -0.1, roll: 0.01, bob: 0.003, scale: 1.001, lid: 0.7 };
    expect(applyVectorMood(pose, { sadness: 0, declineTime: Infinity })).toEqual(pose);
  });
  it('looks down, sinks, deflates and lets the lids fall, keeping them in range', () => {
    const sad = applyVectorMood(VECTOR_REST_MOTION, { sadness: 1, declineTime: Infinity });
    expect(sad.pitch).toBeGreaterThan(0.2);
    expect(sad.bob).toBeLessThan(0);
    expect(sad.scale).toBeLessThan(1);
    expect(sad.lid).toBeGreaterThan(0.4);
    expect(sad.lid).toBeLessThan(0.8);
    const blinking = applyVectorMood(
      { ...VECTOR_REST_MOTION, lid: 0 },
      { sadness: 1, declineTime: Infinity },
    );
    expect(blinking.lid).toBe(0);
  });
});

/** The drawing's points by path, in the frame's own pixels (a 320 box). */
const points = (frame: ReturnType<typeof renderVectorFrame>) =>
  new Map(
    frame.paths.map((path) => [path.id, (path.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)]),
  );
/**
 * How far the drawing moved: the largest sideways step of any part's centre (a turned outline is
 * a different polygon, so points are not compared one to one), and how far the whole sank.
 */
const moved = (
  from: ReturnType<typeof renderVectorFrame>,
  to: ReturnType<typeof renderVectorFrame>,
) => {
  const centreX = (values: number[]) => {
    const xs = values.filter((_, i) => i % 2 === 0);
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  };
  const a = points(from),
    b = points(to);
  let sideways = 0;
  for (const [id, values] of a) {
    const other = b.get(id);
    if (other?.length) sideways = Math.max(sideways, Math.abs(centreX(other) - centreX(values)));
  }
  const middle = (p: Map<string, number[]>) => {
    const ys = [...p.values()].flatMap((values) => values.filter((_, i) => i % 2 === 1));
    return ys.reduce((sum, y) => sum + y, 0) / ys.length;
  };
  return { sideways, sink: middle(b) - middle(a) };
};
const draw = (asset: VectorData, mood?: VectorMoodState) =>
  renderVectorFrame(asset, {
    action: 'idle',
    time: 0,
    ...vectorMoodFrame(
      asset,
      asset.referenceFace ? VECTOR_REST_MOTION : undefined,
      { yaw: 0, pitch: 0 },
      mood,
    ),
  });
// The first and widest swing of the shake.
const SWING = VECTOR_DECLINE_SECONDS / 12;

describe.each(CHARACTER_PRESETS.map(({ id }) => id))('%s says no', (id) => {
  let asset: VectorData;
  beforeAll(async () => {
    asset = await composeVectorCharacter(
      resolveAvatarCharacter(CHARACTER_TEMPLATES[id]!),
      vectorAssetLoader,
    );
  });
  it('draws a neutral character exactly as before', () => {
    const plain = renderVectorFrame(asset, {
      action: 'idle',
      time: 0,
      motion: asset.referenceFace ? VECTOR_REST_MOTION : undefined,
      look: asset.referenceFace ? { yaw: 0, pitch: 0, mix: 1 } : undefined,
    });
    expect(draw(asset, { sadness: 0, declineTime: Infinity })).toEqual(plain);
    expect(draw(asset)).toEqual(plain);
  });
  it('turns aside at the first swing of the shake', () => {
    const swing = draw(asset, { sadness: 0, declineTime: SWING });
    expect(moved(draw(asset), swing).sideways).toBeGreaterThan(6);
  });
  it('sinks when sad', () => {
    const sad = draw(asset, { sadness: 1, declineTime: Infinity });
    expect(moved(draw(asset), sad).sink).toBeGreaterThan(3);
  });
});
