import {
  advanceVectorPlayback,
  playVectorAction,
  VECTOR_MAX_FRAME_SECONDS,
  vectorFrameDelta,
  type VectorPlayback,
} from '../vector-playback';
import { sampleVectorPose, blendVectorPose } from '../vector-pose';
import { renderVectorFrame } from '../vector-frame';
import { vectorShapeImports, vectorTemplateImports } from '../vector-asset-imports';
import { SVG_SHAPES } from '../svg-catalog';
import type { VectorData } from '../vector-types';
const state = (): VectorPlayback => ({
  action: 'idle',
  time: 0,
  clock: 0,
  repeats: 1,
  transitionStarted: 0,
  transitionDuration: 0.28,
});
function paint(s: VectorPlayback, asset: VectorData) {
  const t = Math.min(1, (s.clock - s.transitionStarted) / s.transitionDuration);
  const target = sampleVectorPose(asset, s.action, s.time);
  s.lastPose = s.poseFrom ? blendVectorPose(s.poseFrom, target, t * t * (3 - 2 * t)) : target;
  return renderVectorFrame(asset, { action: s.action, time: s.time, pose: s.lastPose });
}
const assets = [
  ...SVG_SHAPES.map((id) => [id, vectorShapeImports[id]] as const),
  ...Object.entries(vectorTemplateImports),
] as const;
it.each(assets)(
  '%s completes screen and hands exit within its final work episode',
  async (_, load) => {
    const asset = (await load()).default,
      s = state();
    playVectorAction(s, 'work');
    advanceVectorPlayback(s, asset, 1);
    paint(s, asset);
    advanceVectorPlayback(s, asset, asset.clips.work.duration - 0.26 - s.time);
    expect(s.action).toBe('idle');
    const before = renderVectorFrame(asset, { action: 'work', time: 1, pose: s.poseFrom });
    expect(paint(s, asset)).toEqual(before);
    advanceVectorPlayback(s, asset, 0.26);
    const result = paint(s, asset);
    expect(
      result.paths.filter((p) => ['panel', 'screen', 'hand'].includes(p.role ?? '')),
    ).toHaveLength(0);
  },
);
it('preserves the actually painted pose across work → reaction → idle interruptions', async () => {
  const asset = (await vectorShapeImports.bot_blob()).default,
    s = state();
  playVectorAction(s, 'work');
  advanceVectorPlayback(s, asset, 1);
  paint(s, asset);
  playVectorAction(s, 'reaction');
  advanceVectorPlayback(s, asset, 0.08);
  const midway = paint(s, asset);
  playVectorAction(s, 'idle');
  expect(paint(s, asset)).toEqual(midway);
  advanceVectorPlayback(s, asset, 0.1);
  const exiting = paint(s, asset);
  playVectorAction(s, 'work');
  expect(paint(s, asset)).toEqual(exiting);
});
it('only exits the final repeat and freezes an exit when its clock is paused', async () => {
  const asset = (await vectorShapeImports.bot_blob()).default,
    s = state();
  playVectorAction(s, 'work', 2);
  advanceVectorPlayback(s, asset, asset.clips.work.duration - 0.1);
  paint(s, asset);
  expect(s.action).toBe('work');
  advanceVectorPlayback(s, asset, 0.1);
  paint(s, asset);
  expect(s.repeats).toBe(1);
  expect(s.action).toBe('work');
  advanceVectorPlayback(s, asset, asset.clips.work.duration - 0.2);
  paint(s, asset);
  const frozen = paint(s, asset);
  advanceVectorPlayback(s, asset, 0);
  expect(paint(s, asset)).toEqual(frozen);
});

describe('the clock a frame advances by', () => {
  it('is the forward step between two timestamps, in seconds', () => {
    expect(vectorFrameDelta(1016, 1000)).toBeCloseTo(0.016);
  });

  it('never runs further than one frame, so a stalled tab resumes where it was', () => {
    expect(vectorFrameDelta(60_000, 1000)).toBe(VECTOR_MAX_FRAME_SECONDS);
  });

  it('is zero for the first frame, a step backwards, and any timestamp that is not a number', () => {
    expect(vectorFrameDelta(1000, undefined)).toBe(0);
    expect(vectorFrameDelta(900, 1000)).toBe(0);
    expect(vectorFrameDelta(Number.NaN, 1000)).toBe(0);
    expect(vectorFrameDelta(undefined as unknown as number, 1000)).toBe(0);
    expect(vectorFrameDelta(Number.POSITIVE_INFINITY, 1000)).toBe(0);
    expect(vectorFrameDelta(1000, Number.NaN)).toBe(0);
  });

  it('keeps a clock that was advanced by every one of them finite', () => {
    const s = state();
    for (const now of [1000, Number.NaN, 1016, undefined as unknown as number, 1032, 900, 1048]) {
      s.clock += vectorFrameDelta(now, 1000);
      s.time += vectorFrameDelta(now, 1000);
    }
    expect(Number.isFinite(s.clock)).toBe(true);
    expect(Number.isFinite(s.time)).toBe(true);
  });
});
