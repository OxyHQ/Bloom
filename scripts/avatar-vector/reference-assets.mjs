import fs from 'node:fs/promises';
import { referenceBodyCanonicalizer } from './canonical-reference-body.mjs';
import { ShapeUtils, Vector2, Vector3, Quaternion, Euler, Matrix4 } from 'three';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
export async function buildReferenceAssets(root, browser) {
  const output = path.join(root, 'src/agent-avatar/vector-assets');
  const encoded = JSON.parse(await fs.readFile(path.join(output, 'template-peri.json'), 'utf8'));
  const original = encoded.encoding === 'json' ? JSON.parse(encoded.data) : encoded;
  const round = (x) => +x.toFixed(6);
  let outlines;
  const page = await browser.newPage();
  try {
    const sourceMarks = JSON.parse(
      await fs.readFile(path.join(root, 'scripts/avatar-vector/reference-outlines.json'), 'utf8'),
    ).map((mark) => ({ name: mark.id, path: mark.body, eyes: mark.eyes }));
    await page.setContent('<!doctype html><title>Vector geometry extraction</title>');
    outlines = await page.evaluate((sourceMarks) => {
      const sample = (d, maxStep) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', d);
        const total = node.getTotalLength(),
          count = Math.max(32, Math.ceil(total / maxStep));
        return Array.from({ length: count }, (_, i) => {
          const p = node.getPointAtLength((total * i) / count);
          return [p.x, p.y];
        });
      };
      return sourceMarks.map((mark) => ({
        name: mark.name,
        body: (mark.path.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).reduce((a, v, i, all) => {
          if (i % 2 === 0) a.push([v, all[i + 1]]);
          return a;
        }, []),
        eyes: mark.eyes.map((d) => sample(d, 1.1)),
        original: { body: mark.path, eyes: mark.eyes },
      }));
    }, sourceMarks);
  } finally {
    await page.close();
  }
  const CX = 0,
    CY = 0.12;
  const world = ([x, y]) => [(x - 114.2705) / 114.2705, (114.2705 - y) / 114.2705 + CY];
  function partOf(points, faces, id, label, role, color, extra = {}) {
    const edges = new Map();
    faces.forEach((f, i) => {
      f.forEach((a, k) => {
        const b = f[(k + 1) % 3],
          key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edges.has(key)) edges.set(key, [a, b, i, -1]);
        else edges.get(key)[3] = i;
      });
    });
    return {
      id,
      label,
      role,
      bodyPaint: role === 'body' || role === 'hand',
      color,
      opacity: 1,
      points: points.map((p) => p.map(round)),
      faces,
      edges: [...edges.values()],
      ...extra,
    };
  }
  const canonicalize = referenceBodyCanonicalizer(outlines.find(shape => shape.name === 'square').body.map(world));
  function bodyMesh(contour, name) {
    const outline = canonicalize(name, contour.map(world)),
      points = outline.map(([x, y]) => [x, y, 0]);
    const faces = ShapeUtils.triangulateShape(
      outline.map((p) => new Vector2(...p)),
      [],
    );
    const center = [
      (Math.min(...outline.map((p) => p[0])) + Math.max(...outline.map((p) => p[0]))) / 2,
      (Math.min(...outline.map((p) => p[1])) + Math.max(...outline.map((p) => p[1]))) / 2,
    ];
    let inradius = Infinity;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i],
        b = outline[(i + 1) % outline.length],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(
            1,
            ((center[0] - a[0]) * dx + (center[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
          ),
        );
      inradius = Math.min(
        inradius,
        Math.hypot(a[0] + t * dx - center[0], a[1] + t * dy - center[1]),
      );
    }
    return {
      part: partOf(points, faces, 0, 'body', 'body', '#4088ef'),
      outline,
      radius: inradius * 0.9,
      center,
    };
  }
  function eyesMesh(contours, body) {
    const measured = contours.map((contour) => {
      const pts = contour.map(world);
      const center = pts.reduce(
        (sum, p) => [sum[0] + p[0] / pts.length, sum[1] + p[1] / pts.length],
        [0, 0],
      );
      const covariance = pts.reduce(
        (sum, p) => {
          const x = p[0] - center[0],
            y = p[1] - center[1];
          return [sum[0] + x * x, sum[1] + x * y, sum[2] + y * y];
        },
        [0, 0, 0],
      );
      const angle = 0.5 * Math.atan2(2 * covariance[1], covariance[0] - covariance[2]);
      const along = pts.map(
        (p) => (p[0] - center[0]) * Math.cos(angle) + (p[1] - center[1]) * Math.sin(angle),
      );
      const across = pts.map(
        (p) => -(p[0] - center[0]) * Math.sin(angle) + (p[1] - center[1]) * Math.cos(angle),
      );
      return {
        center,
        width: Math.max(...across) - Math.min(...across),
        height: Math.max(...along) - Math.min(...along),
      };
    });
    const height = (measured[0].height + measured[1].height) / 2;
    const width = Math.min(height * 0.55, ((measured[0].width + measured[1].width) / 2) * 1.15);
    const separation = Math.hypot(
      measured[1].center[0] - measured[0].center[0],
      measured[1].center[1] - measured[0].center[1],
    );
    const radius = Math.max(body.radius * 0.94, separation * 0.8);
    const split = Math.asin(Math.min(0.65, separation / 2 / radius));
    body.restBasis = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    body.restQuaternion = [0, 0, 0, 1];
    body.sphereRadius = radius;
    body.eyePlanes = [];
    const result = [-1, 1].map((side, index) => {
      const normal = [Math.sin(split * side), 0, Math.cos(split)];
      const center = [body.center[0] + normal[0] * radius, body.center[1], normal[2] * radius];
      const right = [normal[2], 0, -normal[0]];
      body.eyePlanes.push({ center: center.map(round), normal: normal.map(round) });
      const r = width / 2,
        half = Math.max(0, height / 2 - r),
        contour = [];
      for (let i = 0; i < 32; i++) {
        const angle = (Math.PI * i) / 31;
        contour.push([r * Math.cos(angle), half + r * Math.sin(angle)]);
      }
      for (let i = 0; i < 32; i++) {
        const angle = Math.PI + (Math.PI * i) / 31;
        contour.push([r * Math.cos(angle), -half + r * Math.sin(angle)]);
      }
      const local = [[0, 0], ...contour];
      const point = (p, open) => [
        center[0] + right[0] * p[0],
        center[1] + p[1] * open,
        center[2] + right[2] * p[0],
      ];
      const points = local.map((p) => point(p, 1)),
        middle = local.map((p) => point(p, 0.5)),
        closed = local.map((p) => point(p, 0));
      const faces = contour.map((_, i) => [0, 1 + i, 1 + ((i + 1) % contour.length)]);
      return partOf(
        points,
        faces,
        index + 1,
        index === 0 ? 'left-eye' : 'right-eye',
        'eye',
        '#ffffff',
        {
          face: true,
          delta0: points.map((p, i) =>
            p.map((v, k) => round(4 * (middle[i][k] - v) - (closed[i][k] - v))),
          ),
          delta1: points.map((p, i) =>
            p.map((v, k) => round(2 * (closed[i][k] - v) - 4 * (middle[i][k] - v))),
          ),
        },
      );
    });
    return result;
  }
  function sampled(channel, n, frame) {
    if (channel.value) return channel.value;
    const offset = Math.min(frame, channel.samples.length / n - 1) * n;
    return channel.samples.slice(offset, offset + n);
  }
  function compact(samples, n) {
    const first = samples.slice(0, n);
    return samples.every((v, i) => v === first[i % n]) ? { value: first } : { samples };
  }
  const manifest = [];
  for (const shape of outlines) {
    const bodySource = bodyMesh(shape.body, shape.name),
      body = bodySource.part;
    const eyes = eyesMesh(shape.eyes, bodySource);
    const props = original.parts
      .filter((p) => p.id >= 8)
      .map((p) => ({
        ...p,
        role: p.id === 8 ? 'panel' : p.id === 9 || p.id === 10 ? 'hand' : 'screen',
        color: p.id === 8 ? '#e56da6' : p.id === 9 || p.id === 10 ? '#4088ef' : '#ffffff',
        opacity: p.id === 8 ? 0.22 : 1,
      }));
    const parts = [body, ...eyes, ...props],
      clips = {};
    for (const kind of ['idle', 'reaction', 'work']) {
      const source = original.clips[kind],
        duration =
          kind === 'work' ? Math.min(source.duration, 3.2666666666666666) : source.duration,
        count = Math.ceil(duration * source.fps) + 1;
      const tracks = parts.map((p, index) => {
        const sourceIndex = index < 3 ? index : original.parts.findIndex((op) => op.id === p.id),
          track = source.parts[sourceIndex];
        if (!track) return null;
        if (index >= 3)
          return Object.fromEntries(
            Object.entries(track).map(([key, c]) => {
              const n = key === 'matrix' ? 16 : ['translation', 'scale'].includes(key) ? 3 : 4;
              return [
                key,
                c.value ? structuredClone(c) : { samples: c.samples.slice(0, count * n) },
              ];
            }),
          );
        const bodyTrack = source.parts[0],
          parameters = [],
          translations = [],
          rotations = [],
          scales = [];
        const baseEyeY = sampled(original.clips.idle.parts[sourceIndex].scale, 3, 0)[1];
        for (let f = 0; f < count; f++) {
          const referenceBody = original.clips.idle.parts[0],
            referenceEye = original.clips.idle.parts[1],
            gazeTrack = source.parts[1];
          const position = sampled(bodyTrack.translation, 3, f).map(
            (v, k) => v - sampled(referenceBody.translation, 3, 0)[k],
          );
          const faceRotation = new Quaternion(...sampled(gazeTrack.rotation, 4, f))
            .normalize()
            .multiply(new Quaternion(...sampled(referenceEye.rotation, 4, 0)).normalize().invert());
          const sc = sampled(bodyTrack.scale, 3, f),
            baseSc = sampled(referenceBody.scale, 3, 0),
            uniform = Math.cbrt(
              Math.abs((sc[0] * sc[1] * sc[2]) / (baseSc[0] * baseSc[1] * baseSc[2])),
            );
          const roll = new Euler().setFromQuaternion(faceRotation, 'XYZ').z;
          faceRotation.setFromAxisAngle(new Vector3(0, 0, 1), roll);
          translations.push(...position.map(round));
          rotations.push(...faceRotation.toArray().map(round));
          scales.push(round(uniform), round(uniform), round(uniform));
          const blink = index > 0 ? sampled(track.scale, 3, f)[1] / baseEyeY : 1;
          parameters.push(0, 0, round(1 - blink), round((1 - blink) ** 2));
        }
        return {
          translation: compact(translations, 3),
          rotation: compact(rotations, 4),
          scale: compact(scales, 3),
          parameters: compact(parameters, 4),
          camera: structuredClone(bodyTrack.camera),
          coverage: structuredClone(track.coverage),
        };
      });
      clips[kind] = { duration, fps: source.fps, parts: tracks };
    }
    const data = {
      referenceFace: {
        center: bodySource.center,
        radius: bodySource.radius,
        gazeScale: 0.4,
        restBasis: bodySource.restBasis,
        restQuaternion: bodySource.restQuaternion,
        eyePlanes: bodySource.eyePlanes,
        sphereRadius: bodySource.sphereRadius,
      },
      identity: {
        id: `bot_${shape.name}`,
        name: shape.name,
        recipe: { shape: `bot_${shape.name}`, eyes: 'bot', eyewear: 'none', accessory: 'none' },
        kind: 'reference-svg-billboard-face',
        motion: 'Peri adapted to flat source contours',
      },
      parts,
      clips,
    };
    const json = JSON.stringify(data);
    await fs.writeFile(`${output}/shape-bot_${shape.name}.json`, json);
    manifest.push({
      id: shape.name,
      name: shape.name,
      file: `shape-bot_${shape.name}.json`,
      bytes: Buffer.byteLength(json),
      gzipBytes: gzipSync(json).length,
      points: parts.reduce((s, p) => s + p.points.length, 0),
      parts: parts.length,
      bodySamples: shape.body.length,
      eyeSamples: shape.eyes.map((p) => p.length),
    });
    console.log(shape.name, manifest.at(-1));
  }
  return manifest;
}
