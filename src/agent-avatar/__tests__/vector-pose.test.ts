import { blendVectorPose, sampleVectorPose } from '../vector-pose';
import type { VectorData, VectorTrack } from '../vector-types';
const track = (x: number): VectorTrack => ({
  translation: { value: [x, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
  coverage: { value: [1, 0, 0, 0] },
  parameters: { value: [0, 0, x, 0] },
});
describe('authored pose handoff', () => {
  it('samples every channel and retains an independent snapshot', () => {
    const t = track(0);
    t.translation = { samples: [0, 0, 0, 2, 0, 0] };
    t.camera = { samples: [1, 1, 0, 1, 2, 2, 0, 1] };
    const clip = { duration: 1, fps: 1, parts: [t, null] };
    const asset = { parts: [], clips: { idle: clip, work: clip, reaction: clip } } as VectorData;
    const pose = sampleVectorPose(asset, 'work', 0.5);
    expect(pose[0]?.translation.value).toEqual([1, 0, 0]);
    expect(pose[0]?.camera?.value).toEqual([1.5, 1.5, 0, 1]);
    expect(pose[1]).toBeNull();
    pose[0]!.rotation.value![3] = 0;
    expect(t.rotation.value![3]).toBe(1);
  });
  it('preserves shortest quaternion interpolation and unit length', () => {
    const a = track(0),
      b = track(0);
    b.rotation = { value: [0, 0, 0, -1] };
    expect(blendVectorPose([a], [b], 0.5)[0]?.rotation.value).toEqual([0, 0, 0, 1]);
  });
  it('fades newly visible and disappearing props without moving them to origin', () => {
    const entering = blendVectorPose([null], [track(2)], 0.25)[0]!;
    expect(entering.coverage?.value?.[0]).toBe(0.25);
    expect(entering.translation.value).toEqual([2, 0, 0]);
    expect(blendVectorPose([track(2)], [null], 0.25)[0]?.coverage?.value?.[0]).toBe(0.75);
  });
  it('starts interruptions at the actual partial frame, not either endpoint', () => {
    const partial = blendVectorPose([track(0)], [track(10)], 0.3);
    const interrupted = blendVectorPose(partial, [track(-5)], 0);
    expect(interrupted).toEqual(partial);
    expect(interrupted[0]?.translation.value?.[0]).toBe(3);
    expect(blendVectorPose(partial, [track(-5)], 0.001)[0]?.translation.value?.[0]).toBeCloseTo(
      2.992,
    );
  });
  it('interpolates matrix, deformation, camera and coverage channels together', () => {
    const a = track(0),
      b = track(2);
    a.matrix = { value: Array(16).fill(0) };
    b.matrix = { value: Array(16).fill(2) };
    const pose = blendVectorPose([a], [b], 0.5)[0]!;
    expect(pose.matrix?.value).toEqual(Array(16).fill(1));
    expect(pose.parameters?.value).toEqual([0, 0, 1, 0]);
  });
});
