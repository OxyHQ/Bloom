import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
function finiteMatrix(matrix: Matrix4) {
  for (let i = 0; i < 16; i++) if (!Number.isFinite(matrix.elements[i])) return false;
  return true;
}

export type CancellationNeutral = {
  translation: readonly number[];
  scale: readonly number[];
};

/** Native reaction cancellation, decoded into explicit semantic body channels.
 * Evidence covers entry/core interruptions for seven custom presets. Entry
 * requires the frozen neutral breathing frame; natural outro continues its
 * existing transition and must not instantiate another cancellation.
 *
 * The source constructor separates neutral breathing (outside the reaction)
 * from reaction Euler YXZ and volume-preserving squash about the body's floor.
 * Combining those into TRS and interpolating loses native shear.
 */
export class ReactionCancellationBody {
  readonly world = new Matrix4();
  readonly normal = new Matrix4();
  readonly partParent = new Matrix4();
  readonly neutralScale = new Vector3();
  readonly neutralTranslation = new Vector3();
  readonly squashScale = new Vector3();
  readonly frozenSquashScale = new Vector3();
  private basis = new Matrix4().makeRotationY((8 * Math.PI) / 180);
  private local = new Matrix4();
  private rotation = new Euler(0, 0, 0, 'YXZ');
  private currentRotation = new Euler(0, 0, 0, 'YXZ');
  private translation = new Vector3();
  private pivot: Vector3;
  private scratch = new Vector3();
  private position = new Vector3();
  private quaternion = new Quaternion();
  private matrix = new Matrix4();
  private frozenNeutralTranslation = new Vector3();
  private frozenNeutralScale = new Vector3(1, 1, 1);

  constructor(frozenBody: Matrix4, groundY: number, neutral?: CancellationNeutral) {
    if (!Number.isFinite(groundY) || frozenBody.elements.some((v) => !Number.isFinite(v)))
      throw new Error('Invalid reaction body snapshot');
    if (frozenBody.determinant() <= 0) throw new Error('Invalid reaction body orientation');
    this.pivot = new Vector3(0, groundY, 0);
    if (neutral) {
      if (
        neutral.translation.length !== 3 ||
        neutral.scale.length !== 3 ||
        neutral.translation.some((v) => !Number.isFinite(v)) ||
        neutral.scale.some((v) => !Number.isFinite(v) || v <= 0)
      )
        throw new Error('Invalid frozen cancellation neutral frame');
      this.frozenNeutralTranslation.fromArray(neutral.translation);
      this.frozenNeutralScale.fromArray(neutral.scale);
    }
    this.local
      .copy(this.basis)
      .scale(this.frozenNeutralScale)
      .setPosition(this.frozenNeutralTranslation)
      .invert()
      .multiply(frozenBody);
    this.local.decompose(this.position, this.quaternion, this.frozenSquashScale);
    const sy = this.frozenSquashScale.y;
    if (
      sy <= 0 ||
      Math.max(
        Math.abs(this.frozenSquashScale.x - 1 / Math.sqrt(sy)),
        Math.abs(this.frozenSquashScale.z - 1 / Math.sqrt(sy)),
      ) > 3e-7
    )
      throw new Error('Snapshot is not the observed reaction-core squash');
    this.matrix.compose(this.position, this.quaternion, this.frozenSquashScale);
    if (this.matrix.elements.some((v, i) => Math.abs(v - this.local.elements[i]!) > 3e-7))
      throw new Error('Snapshot has a non-core affine deformation');
    this.rotation.setFromQuaternion(this.quaternion, 'YXZ');
    this.translation
      .copy(this.position)
      .add(this.scratch.copy(this.pivot).applyMatrix4(this.local.clone().setPosition(0, 0, 0)))
      .sub(this.pivot);
  }

  /** u is the native quintic transition fraction, zero at the first displayed
   * post-move frame, one after .18 seconds. No wall-clock or dispatch offset is
   * inferred here. idleBody must be the paired CURRENT neutral idle body. */
  sample(idleBody: Matrix4, u: number) {
    if (!Number.isFinite(u) || u < 0 || u > 1 || !finiteMatrix(idleBody))
      throw new Error('Invalid reaction cancellation sample');
    idleBody.decompose(this.position, this.quaternion, this.neutralScale);
    this.neutralTranslation.copy(this.frozenNeutralTranslation).lerp(this.position, u);
    this.neutralScale.set(
      this.frozenNeutralScale.x + (this.neutralScale.x - this.frozenNeutralScale.x) * u,
      this.frozenNeutralScale.y + (this.neutralScale.y - this.frozenNeutralScale.y) * u,
      this.frozenNeutralScale.z + (this.neutralScale.z - this.frozenNeutralScale.z) * u,
    );
    const remaining = 1 - u;
    const sy = 1 + (this.frozenSquashScale.y - 1) * remaining;
    const sxz = 1 / Math.sqrt(sy);
    this.squashScale.set(sxz, sy, sxz);
    this.currentRotation.set(
      this.rotation.x * remaining,
      this.rotation.y * remaining,
      this.rotation.z * remaining,
      'YXZ',
    );
    this.local.makeRotationFromEuler(this.currentRotation).scale(this.squashScale);
    this.position
      .copy(this.translation)
      .multiplyScalar(remaining)
      .add(this.pivot)
      .sub(this.scratch.copy(this.pivot).applyMatrix4(this.local));
    this.local.setPosition(this.position);
    this.world
      .copy(this.basis)
      .scale(this.neutralScale)
      .setPosition(this.neutralTranslation)
      .multiply(this.local);
    this.normal.copy(this.world).setPosition(0, 0, 0).invert().transpose();
    this.partParent.copy(this.world).multiply(this.matrix.makeScale(1 / sxz, 1 / sy, 1 / sxz));
    return this;
  }
}

export type CancellationPose = {
  id: string;
  world: Matrix4;
  normalMatrix: Matrix4;
  fields: Record<string, number[]>;
};
export type CancellationGeometry = {
  groundY: number;
  /** Geometry manifest pose.deformationCenter; fur uses its source mesh ID. */
  pivots: Readonly<Record<number, readonly number[]>>;
};

function signatureAnchor(
  output: Matrix4,
  pivot: Vector3,
  signature: readonly number[],
  weight: number,
  scale: Vector3,
  scratch: Matrix4,
) {
  const height = signature[3]!;
  const h = height > 0 ? Math.max(0, Math.min(1, (pivot.y - signature[2]!) / height)) : 0;
  const dx = -signature[0]! * h * h * height * 0.5 * weight;
  const dz = signature[1]! * h * h * height * 0.5 * weight;
  // Attachment positions use scaled anchors plus unscaled spine offsets.
  // The native rig uses bend*h as an angle (not atan of the Jacobian).
  output.makeTranslation(pivot.x * scale.x + dx, pivot.y * scale.y, pivot.z * scale.z + dz);
  output.multiply(scratch.makeRotationZ(signature[0]! * h * weight));
  output.multiply(scratch.makeRotationX(signature[1]! * h * weight));
  output.multiply(scratch.makeTranslation(-pivot.x, -pivot.y, -pivot.z));
}

/** Complete semantic pose interpolation for observed entry/core
 * cancellation. The caller still owns drag, gaze/eyes, presentation timing and
 * action arbitration. Construction snapshots its input; sample reuses outputs.
 * No original renderer, buffers, binary or opaque command streams are used.
 */
export class ReactionCancellationPose {
  readonly body: ReactionCancellationBody;
  readonly poses: CancellationPose[];
  private frozen: CancellationPose[];
  private parts: {
    pivot: Vector3;
    translation: Vector3;
    rotation: Euler;
    scale: Vector3;
  }[];
  private signature: number[];
  private anchor = new Matrix4();
  private anchorScratch = new Matrix4();
  private bodyIndex: number;
  private fieldEntries: { name: string; values: number[]; from: number[] }[][];
  private local = new Matrix4();
  private idleInverse = new Matrix4();
  private position = new Vector3();
  private quaternion = new Quaternion();
  private scale = new Vector3();
  private rotation = new Euler(0, 0, 0, 'YXZ');
  private scratch = new Vector3();
  private currentRotation = new Euler(0, 0, 0, 'YXZ');
  private localLinear = new Matrix4();

  constructor(
    frozen: readonly CancellationPose[],
    geometry: CancellationGeometry,
    neutral?: CancellationNeutral,
  ) {
    this.bodyIndex = frozen.findIndex((p) => p.id === 'mesh:0');
    const first = frozen[this.bodyIndex];
    if (!first) throw new Error('Cancellation requires the body pose');
    this.body = new ReactionCancellationBody(first.world, geometry.groundY, neutral);
    this.signature = [...(first.fields.signatureDeform ?? [0, 0, 0, 0])];
    if (this.signature.length !== 4 || this.signature.some((v) => !Number.isFinite(v)))
      throw new Error('Invalid cancellation spine parameters');
    this.frozen = frozen.map((p) => ({
      id: p.id,
      world: p.world.clone(),
      normalMatrix: p.normalMatrix.clone(),
      fields: Object.fromEntries(Object.entries(p.fields).map(([k, v]) => [k, [...v]])),
    }));
    this.poses = frozen.map((p) => ({
      id: p.id,
      world: new Matrix4(),
      normalMatrix: new Matrix4(),
      fields: Object.fromEntries(
        Object.entries(p.fields).map(([k, v]) => [k, Array(v.length).fill(0)]),
      ),
    }));
    this.fieldEntries = this.poses.map((p, i) =>
      Object.entries(p.fields).map(([name, values]) => ({
        name,
        values,
        from: this.frozen[i]!.fields[name]!,
      })),
    );
    const scale = this.body.frozenSquashScale;
    const inverseParent = first.world
      .clone()
      .multiply(new Matrix4().makeScale(1 / scale.x, 1 / scale.y, 1 / scale.z))
      .invert();
    this.parts = frozen.map((p) => {
      const id = Number(p.id.split(':')[1]);
      const values = geometry.pivots[id];
      if (!values || values.length !== 3 || values.some((v) => !Number.isFinite(v)))
        throw new Error(`Missing native cancellation anchor ${p.id}`);
      const pivot = new Vector3().fromArray(values);
      signatureAnchor(this.anchor, pivot, this.signature, 1, scale, this.anchorScratch);
      this.local.copy(this.anchor).invert().multiply(inverseParent).multiply(p.world);
      this.local.decompose(this.position, this.quaternion, this.scale);
      this.position
        .add(this.scratch.copy(pivot).applyMatrix4(this.local.clone().setPosition(0, 0, 0)))
        .sub(pivot);
      return {
        pivot,
        translation: this.position.clone(),
        rotation: new Euler().setFromQuaternion(this.quaternion, 'YXZ'),
        scale: this.scale.clone(),
      };
    });
  }

  /** u comes from quintic((presentationTime-origin)/.18). At the first u=1
   * presentation native spine descriptors persist with amplitude zero. Pass
   * clearSignatureDescriptors only on the subsequent idle presentation. */
  sample(idle: readonly CancellationPose[], u: number, clearSignatureDescriptors = false) {
    if (idle.length !== this.poses.length) throw new Error('Cancellation pose topology changed');
    for (let i = 0; i < idle.length; i++)
      if (idle[i]!.id !== this.poses[i]!.id) throw new Error('Cancellation pose topology changed');
    const idleBody = idle[this.bodyIndex]!;
    this.body.sample(idleBody.world, u);
    this.idleInverse.copy(idleBody.world).invert();
    const remaining = 1 - u;
    for (let i = 0; i < this.poses.length; i++) {
      const out = this.poses[i]!,
        target = idle[i]!,
        part = this.parts[i]!;
      if (out.id === 'mesh:0' || out.id === 'fur:0') out.world.copy(this.body.world);
      else {
        this.local.copy(this.idleInverse).multiply(target.world);
        this.local.decompose(this.position, this.quaternion, this.scale);
        this.position
          .add(
            this.scratch
              .copy(part.pivot)
              .applyMatrix4(this.localLinear.copy(this.local).setPosition(0, 0, 0)),
          )
          .sub(part.pivot);
        this.rotation.setFromQuaternion(this.quaternion, 'YXZ');
        this.currentRotation.set(
          part.rotation.x * remaining + this.rotation.x * u,
          part.rotation.y * remaining + this.rotation.y * u,
          part.rotation.z * remaining + this.rotation.z * u,
          'YXZ',
        );
        this.position.multiplyScalar(u).addScaledVector(part.translation, remaining);
        this.scale.multiplyScalar(u).addScaledVector(part.scale, remaining);
        this.local.makeRotationFromEuler(this.currentRotation).scale(this.scale);
        this.position.add(part.pivot).sub(this.scratch.copy(part.pivot).applyMatrix4(this.local));
        this.local.setPosition(this.position);
        signatureAnchor(
          this.anchor,
          part.pivot,
          this.signature,
          remaining,
          this.body.squashScale,
          this.anchorScratch,
        );
        out.world.copy(this.body.partParent).multiply(this.anchor).multiply(this.local);
      }
      out.normalMatrix.copy(out.world).setPosition(0, 0, 0).invert().transpose();
      for (const { name, values, from } of this.fieldEntries[i]!) {
        const to = target.fields[name];
        if (!to || to.length !== from.length)
          throw new Error(`Cancellation field changed: ${name}`);
        for (let j = 0; j < values.length; j++) {
          values[j] =
            name === 'signatureDeform' && j >= 2 && !clearSignatureDescriptors
              ? from[j]!
              : from[j]! * remaining + to[j]! * u;
        }
      }
    }
    return this.poses;
  }
}
