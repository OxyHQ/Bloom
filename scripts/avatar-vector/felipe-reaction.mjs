import { Matrix4, Quaternion, Vector3 } from 'three';

const round = (value) => +value.toFixed(5);
const first = (channel, width) => channel.value || channel.samples.slice(0, width);
function at(channel, width, frame) {
  if (channel.value) return channel.value;
  const values = channel.samples;
  const offset = Math.min(frame, values.length / width - 1) * width;
  return values.slice(offset, offset + width);
}
function world(track, frame) {
  if (track.matrix) return new Matrix4().fromArray(at(track.matrix, 16, frame));
  return new Matrix4().compose(
    new Vector3().fromArray(at(track.translation, 3, frame)),
    new Quaternion().fromArray(at(track.rotation, 4, frame)).normalize(),
    new Vector3().fromArray(at(track.scale, 3, frame)),
  );
}
function channel(values, width) {
  const start = values.slice(0, width);
  return values.every((value, index) => value === start[index % width])
    ? { value: start }
    : { samples: values };
}
const centerX = (part) =>
  part.points.reduce((sum, point) => sum + point[0], 0) / part.points.length;

/** Keep Felipe's fitted shapes, but use Peri's authored reaction per carrier.
 * The hat must follow its own authored track, independently of the body roll.
 * Rest-relative matrices preserve Felipe's baked geometry/eye placement.
 */
export function withPeriReaction(felipe, peri) {
  if (felipe.identity.id !== 'blue_beret') return felipe;
  const source = peri.clips.reaction;
  const count = Math.ceil(source.duration * source.fps) + 1;
  const sourceEyes = peri.parts
    .map((part, index) => ({ part, index }))
    .filter(({ part }) => part.label.startsWith('eye-'))
    .sort((a, b) => centerX(a.part) - centerX(b.part));
  const bodyIndex = peri.parts.findIndex((part) => part.label === 'body');
  const position = new Vector3(),
    rotation = new Quaternion(),
    scale = new Vector3();
  const parts = felipe.parts.map((part, index) => {
    const rest = felipe.clips.idle.parts[index];
    if (!rest) return null; // Computer props are absent during a reaction.
    const sourceIndex =
      part.role === 'body'
        ? bodyIndex
        : part.role === 'eye'
          ? sourceEyes[centerX(part) < 0 ? 0 : 1].index
          : peri.parts.findIndex((candidate) => candidate.label === part.label);
    if (sourceIndex < 0 || !source.parts[sourceIndex]) {
      throw new Error(`No authored reaction carrier for Felipe part ${part.label}`);
    }
    const donor = source.parts[sourceIndex];
    const donorRestInverse = world(peri.clips.idle.parts[sourceIndex], 0).invert();
    const fittedRest = world(rest, 0);
    const values = { matrix: [], translation: [], rotation: [], scale: [] };
    for (let frame = 0; frame < count; frame++) {
      const matrix = world(donor, frame).multiply(donorRestInverse).multiply(fittedRest);
      matrix.decompose(position, rotation, scale);
      values.matrix.push(...matrix.elements.map(round));
      values.translation.push(...position.toArray().map(round));
      values.rotation.push(...rotation.toArray().map(round));
      values.scale.push(...scale.toArray().map(round));
    }
    return {
      ...Object.fromEntries(
        Object.entries(values).map(([key, array]) => [
          key,
          channel(array, key === 'matrix' ? 16 : key === 'rotation' ? 4 : 3),
        ]),
      ),
      // Preserve Felipe's eyelid/morph construction, without the old reaction.
      parameters: { value: first(rest.parameters || { value: [0, 0, 0, 0] }, 4) },
      reference: rest.reference,
      camera: structuredClone(donor.camera || { value: [1, 1, 0, 1] }),
      coverage: structuredClone(donor.coverage || { value: [1, 0, 0, 0] }),
    };
  });
  return {
    ...felipe,
    clips: { ...felipe.clips, reaction: { duration: source.duration, fps: source.fps, parts } },
  };
}
