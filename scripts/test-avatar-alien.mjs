import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { InstancedBufferGeometry, BufferAttribute, Matrix4 } from 'three';
import ts from 'typescript';
const temp = await mkdtemp('.local/avatar-alien-test-');
for (const [name, path] of Object.entries({
  'catalog-alien': 'runtime/avatar/catalog-alien.ts',
  'catalog-fitting': 'runtime/avatar/catalog-fitting.ts',
  'expression-rig': 'src/agent-avatar/expression-rig.ts',
})) {
  const source = ts
    .transpileModule(await readFile(path, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replaceAll("'./catalog-fitting'", "'./catalog-fitting.mjs'");
  await writeFile(`${temp}/${name}.mjs`, source);
}
const { constructAlienEye } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/catalog-alien.mjs`)
);
const { expressionRig } = await import(
  pathToFileURL(`${process.cwd()}/${temp}/expression-rig.mjs`)
);
test.after(() => rm(temp, { recursive: true, force: true }));
const geometry = new InstancedBufferGeometry();
geometry.setAttribute(
  'position',
  new BufferAttribute(
    new Float32Array([-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0]),
    3,
  ),
);
geometry.setIndex([0, 1, 2, 0, 2, 3]);
const identity = new Matrix4().toArray();
const body = {
  body: { geometry },
  face: {
    radius: 0.2,
    centers: [
      [-0.3, 0.1, 0],
      [0.3, 0.1, 0],
    ],
  },
};
const fitted = {
  geometry: new InstancedBufferGeometry(),
  pivot: [-0.3, 0.1, 0],
  fields: { world: identity, normalMatrix: identity, parameters: [0, 0, 0, 0] },
  id: 1,
  kind: 0,
  fur: false,
  category: 'eyes',
};
const model = await readFile('src/agent-avatar/model.ts', 'utf8');
const block = model.match(/export const EYES = \[([\s\S]*?)\] as const/)[1];
const expressions = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.equal(expressions.length, 16);
for (const eyes of expressions) {
  const rig = expressionRig({ eyes, idle: false, expression: 100 });

  test(`Alien ${eyes}: finite normals, original parabolic arc and animated closure, no donor mutation`, () => {
    const original = structuredClone(fitted.fields);
    const face = { size: 28, gap: 62, tilt: 0, light: false, rig };
    const part = constructAlienEye(body, fitted, face, -1);
    assert.deepEqual(fitted.fields, original);
    assert.equal(fitted.geometry.getAttribute('position'), undefined);
    const p = part.geometry.getAttribute('position'),
      d0 = part.geometry.getAttribute('delta0'),
      d1 = part.geometry.getAttribute('delta1');
    assert.equal(p.count, 65);
    for (const attribute of Object.values(part.geometry.attributes))
      assert.ok([...attribute.array].every(Number.isFinite));
    for (const name of ['normal', 'normal0']) {
      const a = part.geometry.getAttribute(name);
      for (let i = 0; i < a.count; i++)
        assert.ok(
          Math.abs(Math.hypot(a.getX(i), a.getY(i), a.getZ(i)) - 1) < 2e-6,
        );
    }
    const angle = -(rig.leftAngle + 0.08 + 0.4 + rig.headTilt),
      c = Math.cos(angle),
      s = Math.sin(angle);
    const extent = (closure) => {
      const ys = [];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) + closure * (d0.getX(i) + d1.getX(i));
        const y = p.getY(i) + closure * (d0.getY(i) + d1.getY(i));
        ys.push(-s * x + c * y);
      }
      return Math.max(...ys) - Math.min(...ys);
    };
    assert.ok(Math.abs(extent(1) / extent(0) - 0.035) < 2e-5);
    assert.equal(part.universal, false);
    assert.deepEqual(part.fields.colorRoughness, [0.005, 0.005, 0.009, 0.24]);
    part.geometry.dispose();
  });
}

test('light eyes use their own material while geometry stays identical', () => {
  const face = {
    size: 24,
    gap: 52,
    tilt: 0.12,
    light: false,
    rig: expressionRig({ eyes: 'neutral', idle: false, expression: 100 }),
  };
  const dark = constructAlienEye(body, fitted, face, 1),
    light = constructAlienEye(body, fitted, { ...face, light: true }, 1);
  assert.equal(
    Buffer.from(dark.geometry.getAttribute('position').array.buffer).equals(
      Buffer.from(light.geometry.getAttribute('position').array.buffer),
    ),
    true,
  );
  assert.ok(light.fields.colorRoughness[0] > 0.9);
  dark.geometry.dispose();
  light.geometry.dispose();
});
