import { DrawingContext, DrawingPath } from './drawing';
import { ENTRANCE_SECONDS, entrancePose } from './entrance';
import { drawFace, drawSleepMarks, type FaceRig } from './face';
import { drawFold } from './fold';
import type { AvatarConfig } from './model';
import type { ShapeMorph } from './shape-morph';
import { WORKING_SECONDS, workingPose } from './working';
const TAU = Math.PI * 2;
export function avatarSilhouette(c: AvatarConfig, phase: number) {
  const path = new DrawingPath();
  if (c.family === 'alien') {
    const sx = c.alienShape === 'round' ? 1.06 : c.alienShape === 'long' ? 0.86 : 1;
    const sy = c.alienShape === 'round' ? 0.92 : c.alienShape === 'long' ? 1.03 : 1;
    path.moveTo(0, -86 * sy);
    path.bezierCurveTo(49 * sx, -88 * sy, 87 * sx, -61 * sy, 82 * sx, -20 * sy);
    path.bezierCurveTo(80 * sx, 18 * sy, 47 * sx, 52 * sy, 17 * sx, 80 * sy);
    path.quadraticCurveTo(0, 96 * sy, -17 * sx, 80 * sy);
    path.bezierCurveTo(-47 * sx, 52 * sy, -80 * sx, 18 * sy, -82 * sx, -20 * sy);
    path.bezierCurveTo(-87 * sx, -61 * sy, -49 * sx, -88 * sy, 0, -86 * sy);
    path.closePath();
  } else if (c.shape === 'squircle') {
    path.moveTo(-50, -82);
    path.bezierCurveTo(-80, -82, -82, -65, -82, -40);
    path.lineTo(-82, 45);
    path.bezierCurveTo(-82, 76, -70, 82, -42, 82);
    path.lineTo(45, 82);
    path.bezierCurveTo(78, 82, 82, 67, 82, 40);
    path.lineTo(82, -43);
    path.bezierCurveTo(82, -75, 70, -82, 42, -82);
    path.closePath();
  } else if (c.shape === 'triangle') {
    path.moveTo(-15, -78);
    path.quadraticCurveTo(0, -103, 16, -77);
    path.lineTo(84, 52);
    path.quadraticCurveTo(100, 80, 67, 82);
    path.lineTo(-68, 82);
    path.quadraticCurveTo(-100, 80, -84, 53);
    path.closePath();
  } else {
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * TAU;
      let radius = 83;
      if (c.shape === 'pebble')
        radius +=
          7 * Math.sin(a * 3 + 0.7 + (Math.sin(phase) * c.motion) / 350) + 4 * Math.cos(a * 2 - 1);
      if (c.shape === 'flower') radius += 10 * Math.cos(a * 5 + 0.5);
      if (c.shape === 'diamond')
        radius =
          83 /
          (Math.pow(Math.abs(Math.cos(a)), 1.35) + Math.pow(Math.abs(Math.sin(a)), 1.35)) **
            (1 / 1.35);
      const x = Math.cos(a) * radius,
        y = Math.sin(a) * radius;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.closePath();
  }
  return path;
}

/** Colors here are editable artwork, independent of the surrounding UI theme. */
export function drawAvatar(
  ctx: DrawingContext,
  c: AvatarConfig,
  phase: number,
  rig: FaceRig,
  gaze: [number, number],
  cssSize: number,
  entranceSeconds = ENTRANCE_SECONDS,
  workingSeconds = WORKING_SECONDS,
  shapeMorph?: ShapeMorph,
  workingCycles = 1,
  backingSize = cssSize,
) {
  const size = backingSize;
  ctx.save();
  const entrance = entrancePose(entranceSeconds);
  const entrySide = c.family === 'fold' && c.foldDirection === 'left' ? -1 : 1;
  ctx.translate(100 + entrance.x * entrySide, 100 + entrance.y);
  ctx.rotate(entrance.rotation * entrySide);
  ctx.scale(entrance.scaleX, entrance.scaleY);
  ctx.globalAlpha = entrance.opacity;
  ctx.translate(-100, -100);
  ctx.translate(
    100 + (Math.sin(phase * 23) * rig.tremble * c.motion) / 28,
    100 + (Math.sin(phase) * c.motion) / 28 - (Math.cos(phase * 2) * rig.bounce * c.motion) / 12,
  );
  ctx.rotate((Math.sin(phase) * c.motion) / 2400);
  const breath = 1 + (Math.sin(phase) * c.motion) / 4000;
  ctx.scale(breath, breath);
  if (c.family === 'fold') {
    const work = workingPose(workingSeconds, workingCycles);
    ctx.translate(0, work.y);
    ctx.rotate(work.tilt * entrySide);
    drawFold(
      ctx,
      c,
      phase,
      rig,
      gaze,
      cssSize,
      null,
      entrance.fold,
      entrance.faceOpacity,
      work.turn,
      shapeMorph,
    );
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.clip(avatarSilhouette(c, phase));
  const color = (offset: number, light: number, alpha = 1) =>
    `hsla(${c.hue + offset},${c.saturation}%,${light}%,${alpha})`;
  ctx.fillStyle = color(0, c.material === 'solid' ? 55 : 58);
  ctx.fillRect(-110, -110, 220, 220);
  const drift = c.motion / 100;
  if (c.material === 'mist') {
    for (let i = 0; i < c.complexity + 3; i++) {
      const a = i * 2.399 + c.seed;
      const x = Math.cos(a + Math.sin(phase + i) * drift) * 68;
      const y = Math.sin(a * 1.7 + Math.cos(phase + i) * drift) * 74;
      const radius = i % 3 === 0 ? 102 : 70;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const light = [82, 29, 62, 88, 39][i % 5]!;
      const hue = ((i % 3) - 1) * c.spread;
      g.addColorStop(0, color(hue, light, 0.95));
      g.addColorStop(0.35, color(hue, light, 0.7));
      g.addColorStop(1, color(hue, light, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-110, -110, 220, 220);
    }
  } else if (c.material === 'ribbons' || c.material === 'prism') {
    ctx.save();
    ctx.rotate(c.seed * 0.12 + Math.sin(phase) * drift * 0.25);
    const width = 240 / c.complexity;
    for (let i = -8; i < c.complexity + 8; i++) {
      const p = new DrawingPath();
      for (let side = 0; side < 2; side++) {
        for (let j = 0; j <= 50; j++) {
          const y = ((side === 0 ? j : 50 - j) / 50) * 320 - 160;
          const bend =
            c.material === 'prism'
              ? Math.abs(y) * 0.75
              : Math.sin(y / 54 + Math.sin(phase) * drift) * 34;
          const x = -120 + (i + side) * width + bend;
          if (side === 0 && j === 0) p.moveTo(x, y);
          else p.lineTo(x, y);
        }
      }
      p.closePath();
      const offset = ((((i % 3) + 3) % 3) - 1) * c.spread;
      const g = ctx.createLinearGradient(-70, -100, 90, 100);
      g.addColorStop(0, color(offset, 77));
      g.addColorStop(0.5, color(offset + 12, 57));
      g.addColorStop(1, color(offset, 39));
      ctx.fillStyle = g;
      ctx.fill(p);
    }
    ctx.restore();
  }
  if (c.grain > 0) {
    ctx.save();
    // Keep grain density consistent in CSS pixels at every rendered size.
    ctx.scale(200 / size, 200 / size);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha *= c.grain / 100;
    ctx.fillStyle = ctx.createPattern(null, 'repeat')!;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
  ctx.restore();
  if (c.face) {
    ctx.save();
    ctx.clip(avatarSilhouette(c, phase));
    drawFace(ctx, c, phase, rig, gaze, cssSize);
    ctx.restore();
    if (c.idle) drawSleepMarks(ctx, c, phase, gaze);
  }
  ctx.restore();
}
