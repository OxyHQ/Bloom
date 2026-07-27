// The fullscreen viewer must not blow an image up past its own resolution — a
// 512px avatar or a small thumbnail filling the viewport just renders soft.
// A ratio alone cannot express that ceiling, so the shared cache records the
// intrinsic size it had to read anyway (the `Image.getSize` behind
// `fetchAspectRatio`) and the viewer clamps its fit box to it.

const getSize = jest.fn();

jest.mock('react-native', () => ({
  Image: { getSize: (...args: unknown[]) => getSize(...args) },
}));

import {
  DEFAULT_ASPECT_RATIO,
  fetchAspectRatio,
  getAspectRatio,
  getIntrinsicSize,
} from '../image-aspect-ratio-cache';

describe('intrinsic size cache', () => {
  beforeEach(() => {
    getSize.mockReset();
  });

  it('records the measured pixel size alongside the ratio', async () => {
    const uri = 'https://cdn.example/avatar-512.jpg';
    getSize.mockImplementation((_uri: string, ok: (w: number, h: number) => void) => ok(512, 512));

    const ratio = await fetchAspectRatio(uri);

    expect(ratio).toBe(1);
    expect(getAspectRatio(uri)).toBe(1);
    expect(getIntrinsicSize(uri)).toEqual({ width: 512, height: 512 });
  });

  it('leaves no size behind when the image cannot be measured', async () => {
    const uri = 'https://cdn.example/broken.jpg';
    getSize.mockImplementation((_uri: string, _ok: unknown, fail: () => void) => fail());

    const ratio = await fetchAspectRatio(uri);

    expect(ratio).toBe(DEFAULT_ASPECT_RATIO);
    // No measurement means no ceiling — the viewer falls back to its fit box
    // rather than clamping to a guess.
    expect(getIntrinsicSize(uri)).toBeUndefined();
  });
});
