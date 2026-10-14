import type { View } from 'react-native';

import { avatarFlightPoint, centeredLanding, measureAvatar } from '../geometry';

const from = { x: 20, y: 200, width: 80, height: 80 };
const to = { x: 300, y: 40, width: 32, height: 32 };

describe('avatar flight geometry', () => {
  it.each([false, true])('leaves from the source and lands on the target, arc=%s', (arc) => {
    expect(avatarFlightPoint(from, to, 0, arc)).toEqual(from);
    expect(avatarFlightPoint(from, to, 1, arc)).toEqual(to);
  });

  it('bows an arc above the straight journey and interpolates the size', () => {
    const straight = avatarFlightPoint(from, to, 0.5, false);
    const curved = avatarFlightPoint(from, to, 0.5, true);
    expect(curved.y).toBeLessThan(straight.y);
    expect(curved.width).toBe(56);
    expect(curved.height).toBe(56);
  });

  it('centres a smaller landing in the target, independent of its width', () => {
    const artwork = { x: 100, y: 40, width: 56, height: 56 };
    const landing = centeredLanding(14)(artwork);
    expect(landing).toEqual({ x: 121, y: 61, width: 14, height: 14 });
    expect(landing.x + landing.width / 2).toBe(artwork.x + artwork.width / 2);
    expect(landing.y + landing.height / 2).toBe(artwork.y + artwork.height / 2);
  });

  it('rejects an unmounted or zero-size target rather than flying to the screen origin', async () => {
    expect(await measureAvatar(undefined)).toBeNull();
    const zero = {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, 0, 0, 0),
    } as View;
    expect(await measureAvatar(zero)).toBeNull();
    const valid = {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) =>
        cb(20, 200, 80, 80),
    } as View;
    expect(await measureAvatar(valid)).toEqual(from);
  });
});
