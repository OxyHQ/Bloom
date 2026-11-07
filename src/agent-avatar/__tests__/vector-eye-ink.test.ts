import { paintVectorEyeFrame } from '../vector-eye-ink';
import type { VectorFrame } from '../vector-types';

it('uses readable single-ink expressions in static chips without mutating cached paths', () => {
  const frame: VectorFrame = {
    viewBox: '0 0 10 10',
    paths: [
      { id: 'eye', role: 'eye', d: 'M0 0L1 0L1 1Z', fill: '#1f1f1f', opacity: 1, fillOpacity: 1 },
    ],
  };
  const result = paintVectorEyeFrame(frame, '#171717');
  expect(result.paths[0]?.fill).toBe('#f6f7f2');
  expect(result.paths[0]?.d).toBe(frame.paths[0]?.d);
  expect(frame.paths[0]?.fill).toBe('#1f1f1f');
  expect(paintVectorEyeFrame(frame, '#ffcc38')).toBe(frame);
});
it('keeps multicolor iris/highlight frames exactly as authored', () => {
  const frame: VectorFrame = {
    viewBox: '0 0 10 10',
    paths: [
      { id: 'eye', role: 'eye', d: 'M0 0Z', fill: '#1f1f1f', opacity: 1, fillOpacity: 1 },
      { id: 'highlight', role: 'eye', d: 'M1 1Z', fill: '#ffffff', opacity: 1, fillOpacity: 1 },
    ],
  };
  expect(paintVectorEyeFrame(frame, '#171717')).toBe(frame);
});
