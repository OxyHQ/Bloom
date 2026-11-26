import { HALO_PATH_ID, withHalo } from '../vector-halo';
import type { VectorFrame } from '../vector-types';

const path = (id: string, d: string, clip?: string) => ({
  id,
  d,
  fill: '#f00',
  opacity: 1,
  fillOpacity: 1,
  ...(clip ? { clip } : {}),
});

describe('withHalo', () => {
  const frame: VectorFrame = {
    viewBox: '52 70 216 216',
    paths: [path('0', 'M0 0Z'), path('1', 'M1 1Z'), path('2', 'M2 2Z', 'M9 9Z')],
  };

  it('adds one path first: every unclipped outline, in the surface colour', () => {
    const out = withHalo(frame, 64, { color: '#fff', width: 2 });
    expect(out.paths).toHaveLength(frame.paths.length + 1);
    const halo = out.paths[0]!;
    expect(halo.id).toBe(HALO_PATH_ID);
    expect(halo.d).toBe('M0 0ZM1 1Z');
    expect([halo.fill, halo.stroke]).toEqual(['#fff', '#fff']);
    expect(out.paths.slice(1)).toEqual(frame.paths);
  });

  it('is `width` pixels wide at any size, and widens the viewBox so it is not cropped', () => {
    const out = withHalo(frame, 108, { color: '#fff', width: 3 });
    const gap = (3 * 216) / 108;
    expect(out.paths[0]!.strokeWidth).toBeCloseTo(gap * 2);
    const [x, y, w] = out.viewBox.split(' ').map(Number);
    expect([x, y, w]).toEqual([52 - gap, 70 - gap, 216 + gap * 2]);
  });
});
