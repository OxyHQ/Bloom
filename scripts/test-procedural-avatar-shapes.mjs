import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { ShapeUtils, Vector2 } from 'three';
import { proceduralShapes } from './avatar-vector/procedural-shapes.mjs';
const shapes = proceduralShapes();
const area = (points) =>
  Math.abs(
    points.reduce((sum, a, i) => {
      const b = points[(i + 1) % points.length];
      return sum + a[0] * b[1] - b[0] * a[1];
    }, 0),
  ) / 2;
const read = (name) => {
  const packed = JSON.parse(
    fs.readFileSync(
      new URL(`../src/agent-avatar/vector-assets/shape-bot_${name}.json`, import.meta.url),
    ),
  );
  return JSON.parse(packed.data);
};
test('all thirteen canonical silhouettes are deterministic, finite and triangulate without lost area', () => {
  assert.deepEqual(
    shapes.map((shape) => shape.name),
    [
      'blob',
      'star',
      'hex',
      'heart',
      'square',
      'tablet',
      'sparkle',
      'flower',
      'wedge',
      'clover',
      'teardrop',
      'pebble',
      'cloud',
    ],
  );
  assert.deepEqual(proceduralShapes(), shapes);
  for (const { name, body } of shapes) {
    assert(
      body.every((point) => point.length === 2 && point.every(Number.isFinite)),
      name,
    );
    const faces = ShapeUtils.triangulateShape(
      body.map((point) => new Vector2(...point)),
      [],
    );
    const triangulatedArea = faces.reduce(
      (sum, face) => sum + area(face.map((index) => body[index])),
      0,
    );
    assert(Math.abs(triangulatedArea - area(body)) < 1e-10, `${name}: triangulation`);
    const span = [0, 1].map(
      (axis) => Math.max(...body.map((p) => p[axis])) - Math.min(...body.map((p) => p[axis])),
    );
    assert(Math.abs(Math.max(...span) - 2) < 1e-10, `${name}: uniform normalized size`);
  }
});
test('circle has constant radius and semantic axes stay upright without inverse projection', () => {
  for (const [x, y] of shapes[0].body) assert(Math.abs(Math.hypot(x, y - 0.12) - 1) < 1e-12);
  for (const name of ['star', 'sparkle', 'flower', 'teardrop', 'cloud']) {
    const body = shapes.find((shape) => shape.name === name).body;
    const top = body.reduce((a, b) => (b[1] > a[1] ? b : a));
    assert(Math.abs(top[0]) < 0.04, `${name}: central upper axis`);
  }
  const square = shapes.find((shape) => shape.name === 'square').body;
  assert.equal(Math.max(...square.map((p) => p[0])), 1);
  assert.equal(Math.max(...square.map((p) => p[1])), 1.12);
});
test('generated bodies, bounded neutral eyes and uniform motion share one coordinate frame', () => {
  for (const { name, body } of shapes) {
    const data = read(name),
      head = data.parts.find((part) => part.role === 'body');
    assert.deepEqual(
      head.points,
      JSON.parse(JSON.stringify(body.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6), 0]))),
    );
    const face = data.referenceFace;
    assert(face.radius > 0 && face.sphereRadius > 0, name);
    for (const eye of data.parts.filter((part) => part.role === 'eye'))
      for (const [x, y] of eye.points)
        assert(
          Math.hypot(x - face.center[0], y - face.center[1]) <= face.radius + 0.000002,
          `${name}: eyes stay inside inscribed body`,
        );
    for (const clip of Object.values(data.clips)) {
      const scale = clip.parts[0].scale;
      const values = scale.samples ?? scale.value;
      for (let i = 0; i < values.length; i += 3)
        assert(
          values[i] === values[i + 1] && values[i] === values[i + 2],
          `${name}: uniform body motion`,
        );
      assert.equal(clip.parts.length, data.parts.length);
    }
    assert(
      data.parts.some((part) => part.role === 'panel') &&
        data.parts.some((part) => part.role === 'hand'),
      name,
    );
  }
});
