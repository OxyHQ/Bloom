import type { AuthoredAvatarEngine } from './authored-engine';

/** DOM pointer ownership lives outside rendering, including capture and cleanup. */
export function bindAvatarPointer(
  canvas: HTMLCanvasElement,
  engine: Pick<AuthoredAvatarEngine, 'hitTest' | 'beginPointer' | 'point' | 'endPointer'>,
  options: {
    enabled?: boolean;
    onSelect?: (index: number) => void;
    onTap?: (index: number) => void;
  } = {},
) {
  let active: { id: number; index: number; x: number; y: number; dragged: boolean } | null = null;
  const coordinates = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top] as const;
  };
  const down = (event: PointerEvent) => {
    if (active || event.button !== 0 || !event.isPrimary) return;
    const coordinatesHere = coordinates(event);
    const index =
      options.enabled === false
        ? engine.hitTest(...coordinatesHere)
        : engine.beginPointer(...coordinatesHere);
    if (index === null) return;
    options.onSelect?.(index);
    if (options.enabled === false) return;
    active = { id: event.pointerId, index, x: event.clientX, y: event.clientY, dragged: false };
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (options.enabled === false || (active && active.id !== event.pointerId)) return;
    if (active)
      active.dragged ||= Math.hypot(event.clientX - active.x, event.clientY - active.y) >= 6;
    engine.point(...coordinates(event));
  };
  const finish = (event?: PointerEvent) => {
    if (!active || (event && active.id !== event.pointerId)) return;
    const previous = active;
    active = null;
    if (event?.type === 'pointerup') engine.endPointer(...coordinates(event));
    else {
      engine.endPointer();
      engine.point(-1, -1);
    }
    if (canvas.hasPointerCapture(previous.id)) canvas.releasePointerCapture(previous.id);
    if (
      event?.type === 'pointerup' &&
      !previous.dragged &&
      Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 6
    )
      options.onTap?.(previous.index);
  };
  const blur = () => {
    finish();
    engine.point(-1, -1);
  };
  const leave = () => {
    if (!active && options.enabled !== false) engine.point(-1, -1);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  canvas.addEventListener('pointerleave', leave);
  window.addEventListener('blur', blur);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', finish);
    canvas.removeEventListener('pointercancel', finish);
    canvas.removeEventListener('lostpointercapture', finish);
    canvas.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', blur);
    finish();
    leave();
  };
}
