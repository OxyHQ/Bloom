import { prepareReferenceFaceProjection, prepareReferenceHeadProjection } from '../vector-face';
import { renderVectorFrame } from '../vector-frame';
import type { VectorData } from '../vector-types';

const face: NonNullable<VectorData['referenceFace']> = {
  center: [0.1, 0.2],
  radius: 1,
  gazeScale: 0.4,
  restBasis: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  restQuaternion: [0, 0, 0, 1],
};
it('keeps prepared face and head results independently owned', () => {
  for (const mix of [0, 0.4, 1]) {
    const look = { yaw: 0.6, pitch: -0.45, mix };
    for (const project of [
      prepareReferenceFaceProjection(face, look),
      prepareReferenceHeadProjection(face, look, [0.2, 0.8, 0.1]),
    ]) {
      const source = Object.freeze([0.4, -0.3, 0.7]) as number[];
      const result = project(source);
      const retained = [...result];
      project([1, 2, 3]);
      expect(result).toEqual(retained);
      expect(source).toEqual([0.4, -0.3, 0.7]);
    }
  }
});
it('keeps source morphs, channels and retained frames immutable across other renders', () => {
  const track = {
    translation: { value: [0.1, 0.2, 0.3] },
    rotation: { value: [0, 0, 0, 1] },
    scale: { value: [1, 1, 1] },
    parameters: { value: [1, 1, 0.3, 0.2] },
  };
  const clip = { duration: 1, fps: 30, parts: [track] };
  const data: VectorData = {
    parts: [
      {
        id: 0,
        label: 'eye',
        role: 'eye',
        face: true,
        points: [
          [-0.2, 0, 0.3],
          [0.2, 0, 0.3],
          [0, 0.4, 0.3],
        ],
        delta0: [
          [0.1, 0, 0],
          [0, 0.1, 0],
          [0, 0, 0.1],
        ],
        faces: [[0, 1, 2]],
        edges: [],
      },
    ],
    clips: { idle: clip, reaction: clip, work: clip },
  };
  const freeze = (value: unknown): void => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  };
  const snapshot = JSON.stringify(data);
  freeze(data);
  const first = renderVectorFrame(data, {
    action: 'idle',
    time: 0.2,
    yaw: 0.5,
    pitch: 0.2,
    look: { yaw: 0.5, pitch: 0.2, mix: 1 },
  });
  const retained = JSON.stringify(first);
  renderVectorFrame(data, {
    action: 'work',
    time: 0.7,
    yaw: -0.6,
    pitch: -0.45,
    look: { yaw: -0.6, pitch: -0.45, mix: 1 },
  });
  expect(JSON.stringify(data)).toBe(snapshot);
  expect(JSON.stringify(first)).toBe(retained);
});
