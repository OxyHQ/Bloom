import { avatarFlightPoint, measureAvatar, previewAvatarGeometry } from '../handoff';
import type { View } from 'react-native';

const from = { x: 20, y: 200, width: 80, height: 80 };
const to = { x: 300, y: 40, width: 32, height: 32 };
describe('avatar handoff geometry', () => {
  it.each([false, true])('lands at the measured source and destination, curved=%s', arc => {
    expect(avatarFlightPoint(from, to, 0, arc)).toEqual(from);
    expect(avatarFlightPoint(from, to, 1, arc)).toEqual(to);
  });
  it('bows the first-message flight above the straight journey and preserves size interpolation', () => {
    const straight = avatarFlightPoint(from, to, .5, false);
    const curved = avatarFlightPoint(from, to, .5, true);
    expect(curved.y).toBeLessThan(straight.y);
    expect(curved.width).toBe(56);
    expect(curved.height).toBe(56);
  });
  it('retains the selected group composition for one, three and four agents', () => {
    expect(previewAvatarGeometry(1, 0)).toEqual({ size: 80, x: 40, y: 16 });
    expect(previewAvatarGeometry(3, 2)).toEqual({ size: 62, x: 49, y: 46 });
    expect(previewAvatarGeometry(4, 0).size).toBe(48);
    expect(previewAvatarGeometry(4, 0).y).toBeCloseTo(2);
  });
  it('rejects unmounted or zero-size targets rather than flying to the screen origin', async () => {
    expect(await measureAvatar(undefined)).toBeNull();
    const zero = { measureInWindow: (cb: (x:number,y:number,w:number,h:number)=>void) => cb(0,0,0,0) } as View;
    expect(await measureAvatar(zero)).toBeNull();
    const valid = { measureInWindow: (cb: (x:number,y:number,w:number,h:number)=>void) => cb(20,200,80,80) } as View;
    expect(await measureAvatar(valid)).toEqual(from);
  });
});
