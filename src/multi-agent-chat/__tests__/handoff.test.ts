import type { View } from 'react-native';
import {
  avatarFlightPoint,
  profileFlightTarget,
  measureAvatar,
  previewAvatarGeometry,
} from '../handoff';

const from = { x: 20, y: 200, width: 80, height: 80 };
const to = { x: 300, y: 40, width: 32, height: 32 };
describe('avatar handoff geometry', () => {
  it.each([false, true])(
    'lands at the measured source and destination, curved=%s',
    (arc) => {
      expect(avatarFlightPoint(from, to, 0, arc)).toEqual(from);
      expect(avatarFlightPoint(from, to, 1, arc)).toEqual(to);
    },
  );
  it('bows the first-message flight above the straight journey and preserves size interpolation', () => {
    const straight = avatarFlightPoint(from, to, 0.5, false);
    const curved = avatarFlightPoint(from, to, 0.5, true);
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
    const zero = {
      measureInWindow: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => cb(0, 0, 0, 0),
    } as View;
    expect(await measureAvatar(zero)).toBeNull();
    const valid = {
      measureInWindow: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => cb(20, 200, 80, 80),
    } as View;
    expect(await measureAvatar(valid)).toEqual(from);
  });
});

describe('committed avatar artwork', () => {
  it('retains the exact departure frame after later frames and preview unmount', async () => {
    const { captureAvatars, retainAvatarDrawing } = await import('../handoff');
    const { DrawingContext } = await import('../../agent-avatar/drawing');
    const { INITIAL_WORKSPACE } = await import('../data');
    const agent = INITIAL_WORKSPACE.agents[0]!;
    const node = {
      measureInWindow: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => cb(20, 200, 80, 80),
    } as View;
    const nodes = new Map([[agent.id, node]]);
    const departure = new DrawingContext();
    departure.fillRect(17, 19, 24, 36);
    retainAvatarDrawing(nodes, agent.id, departure);
    const flight = (await captureAvatars([agent], nodes))[0]!;
    const nextFrame = new DrawingContext();
    nextFrame.fillRect(18, 20, 24, 36);
    retainAvatarDrawing(nodes, agent.id, nextFrame);
    retainAvatarDrawing(nodes, agent.id, null);
    expect(flight.drawing).toBe(departure);
    expect(Object.isFrozen(flight.drawing)).toBe(true);
    expect(Object.isFrozen(flight.drawing!.nodes)).toBe(true);
    expect(flight.drawing!.nodes[0]!.path!.toString()).toBe(
      'M17 19 L41 19 L41 55 L17 55 Z',
    );
    expect((await captureAvatars([agent], nodes))[0]!.drawing).toBeUndefined();
  });
});

it('lands waiting agents in the center of the header artwork, independent of name width', () => {
  const artwork = { x: 100, y: 40, width: 56, height: 56 };
  const target = profileFlightTarget(artwork);
  expect(target).toEqual({ x: 121, y: 61, width: 14, height: 14 });
  expect(target.x + target.width / 2).toBe(artwork.x + artwork.width / 2);
  expect(target.y + target.height / 2).toBe(artwork.y + artwork.height / 2);
});
