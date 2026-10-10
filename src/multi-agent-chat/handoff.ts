import type { View } from 'react-native';
import type { DrawingContext } from '../agent-avatar/drawing';
import type { Agent } from './data';
export interface AvatarRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type AvatarNodes = Map<string, View>;
export interface TravelingAvatar {
  agent: Agent;
  from: AvatarRect;
  drawing?: DrawingContext;
}
const committedDrawings = new WeakMap<AvatarNodes, Map<string, DrawingContext>>();
/** Each rendered frame is a new command stream; retaining it freezes the exact pose. */
export function retainAvatarDrawing(
  nodes: AvatarNodes,
  id: string,
  drawing: DrawingContext | null,
) {
  if (!drawing) {
    committedDrawings.get(nodes)?.delete(id);
    return;
  }
  let frames = committedDrawings.get(nodes);
  if (!frames) {
    frames = new Map();
    committedDrawings.set(nodes, frames);
  }
  Object.freeze(drawing.nodes);
  Object.freeze(drawing);
  frames.set(id, drawing);
}
export interface AvatarHandoffState {
  chatId: string;
  kind: 'group' | 'first';
  responderId?: string;
  avatars: TravelingAvatar[];
  arrived: string[];
}
export const REPLY_ARRIVAL_MS = 800;
export function measureAvatar(node: View | undefined): Promise<AvatarRect | null> {
  return new Promise((resolve) => {
    if (!node?.measureInWindow) {
      resolve(null);
      return;
    }
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 120);
    node.measureInWindow((x, y, width, height) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(
        [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
          ? { x, y, width, height }
          : null,
      );
    });
  });
}
export async function captureAvatars(
  agents: Agent[],
  nodes: AvatarNodes,
): Promise<TravelingAvatar[]> {
  return (
    await Promise.all(
      agents.map(async (agent): Promise<TravelingAvatar | null> => {
        const from = await measureAvatar(nodes.get(agent.id));
        return from
          ? {
              agent,
              from,
              drawing: committedDrawings.get(nodes)?.get(agent.id),
            }
          : null;
      }),
    )
  ).filter((avatar): avatar is TravelingAvatar => avatar !== null);
}
/** The source's selected-preview composition is deliberately distinct from the tiny header stack. */
export function previewAvatarGeometry(count: number, index: number) {
  const size = count === 1 ? 80 : count <= 3 ? 62 : 48;
  const angle = (index * Math.PI * 2) / count - Math.PI / 2;
  const x =
    count === 1
      ? 40
      : count <= 3
        ? index === 1
          ? 76
          : index === 2
            ? 49
            : 22
        : 56 + Math.cos(angle) * 38;
  const y =
    count === 1
      ? 16
      : count <= 3
        ? count === 3 && index === 2
          ? 46
          : 8
        : 32 + Math.sin(angle) * 30;
  return { size, x, y };
}
export function avatarFlightPoint(
  from: AvatarRect,
  to: AvatarRect,
  progress: number,
  arc: boolean,
) {
  'worklet';
  const t = arc ? progress * progress * (3 - 2 * progress) : progress;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const control = {
    x: from.x + (to.x - from.x) * 0.3,
    y: Math.min(from.y, to.y) - Math.min(110, distance * 0.22),
  };
  return {
    x: arc
      ? (1 - t) ** 2 * from.x + 2 * (1 - t) * t * control.x + t * t * to.x
      : from.x + (to.x - from.x) * t,
    y: arc
      ? (1 - t) ** 2 * from.y + 2 * (1 - t) * t * control.y + t * t * to.y
      : from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

/** Waiting agents merge into the center of the measured header artwork. */
export function profileFlightTarget(avatar: AvatarRect): AvatarRect {
  return {
    x: avatar.x + (avatar.width - 14) / 2,
    y: avatar.y + (avatar.height - 14) / 2,
    width: 14,
    height: 14,
  };
}
