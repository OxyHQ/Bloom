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

it.each(['sparkle_capsules', 'highlight_capsules', 'double_highlights'])(
  'outlines only the dark base of %s on dark bodies, preserving glints and other roles',
  (style) => {
    const frame: VectorFrame = {
      viewBox: '0 0 320 320',
      paths: [
        { id: 'base', role: 'eye', d: 'M0 0Z', fill: '#171717', opacity: 0.5, fillOpacity: 0.7 },
        { id: 'glint', role: 'eye', d: 'M1 1Z', fill: '#ffffff', opacity: 1, fillOpacity: 1 },
        {
          id: 'panel',
          role: 'panel',
          d: 'M2 2Z',
          fill: '#171717',
          stroke: '#171717',
          opacity: 1,
          fillOpacity: 1,
        },
      ],
    };
    const dark = paintVectorEyeFrame(frame, '#171717', style);
    expect(dark.paths[0]).toEqual({ ...frame.paths[0], stroke: '#f6f7f2', strokeWidth: 2 });
    expect(dark.paths[1]).toEqual(frame.paths[1]);
    expect(dark.paths[2]).toBe(frame.paths[2]);
    expect(frame.paths[0]?.stroke).toBeUndefined();
    expect(paintVectorEyeFrame(frame, '#171717', style)).toBe(dark);
    expect(paintVectorEyeFrame(frame, '#ffffff', style)).toBe(frame);
    expect(paintVectorEyeFrame(frame, '#171717', 'oval')).toBe(frame);
  },
);
