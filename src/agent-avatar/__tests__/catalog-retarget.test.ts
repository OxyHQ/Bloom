import { Matrix4, Quaternion, Vector3 } from 'three';
import {
  type CatalogLocalBinding,
  CatalogRetargetSampler,
} from '../../../runtime/avatar/catalog-retarget';
import { AuthoredMotionSampler } from '../../../runtime/avatar/motion';

/**
 * The eyes of a retargeted avatar keep their separation through a body that rolls.
 *
 * The six-lobed body rolls 180° in plane during the reaction, which its own outline hides,
 * while its eyes stay put; the heart's eyes roll with its body. Both are donor data, and the
 * retarget has to carry its pivot offset by whatever the eye really rides. Writing it in the
 * parent's frame dragged the flower's eyes together (a gap of 0.26 of rest, held to the end of
 * the clip) and, in the first repair, did the same to the heart (0.20). The measure is the
 * only thing that distinguishes them: the gap between the two painted eye centres.
 */

const TIMES = [0, 0.5, 1, 1.5, 2];
const roll = (degrees: number) =>
  new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), (degrees * Math.PI) / 180);
const ROLLS = [0, 60, 130, 180, 180];
const quaternions = (angles: number[]) =>
  angles.flatMap((angle) => {
    const q = roll(angle);
    return [q.x, q.y, q.z, q.w];
  });
const still = quaternions(ROLLS.map(() => 0));
const rolling = quaternions(ROLLS);

const part = (id: string, rotation: number[]) => ({
  id,
  translation: { value: [0, 0, 0] },
  rotation: { samples: rotation },
  scale: { value: [1, 1, 1] },
  fields: {},
});

const PIVOTS = [
  [-0.205, 0.2, 0.844],
  [0.205, 0.2, 0.844],
];
/** Where the destination's eyes sit relative to the donor's. */
const SHIFTS = [
  [-0.092, -0.017, -0.036],
  [0.092, -0.017, -0.032],
];

function sampler(eyeRotation: number[], destinationHeight = 1.83) {
  const clip = {
    duration: 2,
    loop: false,
    times: TIMES,
    parts: [part('mesh:0', rolling), part('mesh:1', eyeRotation), part('mesh:2', eyeRotation)],
  };
  const bindings: CatalogLocalBinding[] = [
    {
      sourceId: 'mesh:0',
      targetId: 'mesh:0',
      category: 'body',
      sourcePivot: [0, 0, 0],
      targetPivot: [0, 0, 0],
      geometryTransform: new Matrix4(),
      fields: {},
    },
    ...PIVOTS.map((pivot, k) => ({
      sourceId: `mesh:${k + 1}`,
      targetId: `mesh:${k + 1}`,
      category: 'eyes' as const,
      sourcePivot: pivot,
      targetPivot: pivot.map((v, axis) => v + SHIFTS[k]![axis]!),
      geometryTransform: new Matrix4(),
      fields: {},
    })),
  ];
  return new CatalogRetargetSampler(
    new AuthoredMotionSampler(clip as never),
    bindings,
    { ground: -1, height: 2 },
    { ground: -destinationHeight / 2, height: destinationHeight },
  );
}

/** The two painted eye centres at `seconds`, and the body's translation. */
function painted(retarget: CatalogRetargetSampler, seconds: number) {
  const pose = retarget.createPose();
  retarget.sample(seconds, pose);
  const centres = [1, 2].map((id, k) => {
    const world = pose.find((p) => p.id === `mesh:${id}`)!.world;
    return new Vector3(...PIVOTS[k]!.map((v, axis) => v + SHIFTS[k]![axis]!)).applyMatrix4(world);
  });
  const body = pose.find((p) => p.id === 'mesh:0')!.world;
  return {
    gap: centres[0]!.distanceTo(centres[1]!),
    body: new Vector3().setFromMatrixPosition(body),
  };
}

const REST_GAP = new Vector3(...PIVOTS[0]!.map((v, k) => v + SHIFTS[0]![k]!)).distanceTo(
  new Vector3(...PIVOTS[1]!.map((v, k) => v + SHIFTS[1]![k]!)),
);

describe('CatalogRetargetSampler eyes under a rolling body', () => {
  it.each([
    ['eyes that stay put while the body rolls (six-lobed flower)', still],
    ['eyes that roll with the body (heart)', rolling],
  ])('keep their separation: %s', (_label, eyeRotation) => {
    const retarget = sampler(eyeRotation);
    for (let t = 0; t <= 2; t += 0.1)
      expect(painted(retarget, t).gap / REST_GAP).toBeGreaterThan(0.95);
  });

  it('keeps them apart with a shorter destination body too', () => {
    const retarget = sampler(still, 1.6);
    for (let t = 0; t <= 2; t += 0.1)
      expect(painted(retarget, t).gap / REST_GAP).toBeGreaterThan(0.95);
  });

  it('rolls the body about its own centre, so a symmetric roll leaves it where it was', () => {
    // 180° in plane about the origin, with a destination whose centre is above it:
    // rotating about the ground instead of the centre moved the whole character up.
    const retarget = sampler(still, 1.6);
    const end = painted(retarget, 2).body;
    expect(Math.abs(end.y)).toBeLessThan(0.01);
  });
});
