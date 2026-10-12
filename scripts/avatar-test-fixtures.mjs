import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { InstancedBufferGeometry, Float32BufferAttribute } from 'three';
/** Frozen observations contain geometry/expected values only, never renderer code. */
export async function avatarFixture(name) {
  return JSON.parse(
    gunzipSync(await readFile(new URL(`./fixtures/avatar/${name}.json.gz`, import.meta.url))),
  );
}
export function fixtureAssembly(source) {
  const pieces = source.pieces.map(({ attributes, indices, ...part }) => {
    const geometry = new InstancedBufferGeometry();
    for (const [name, attr] of Object.entries(attributes))
      geometry.setAttribute(name, new Float32BufferAttribute(attr.values, attr.size));
    if (indices) geometry.setIndex(indices);
    return { ...part, geometry };
  });
  return { body: pieces[0], pieces, face: source.face };
}
