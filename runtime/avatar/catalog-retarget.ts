import { Matrix4, Vector3 } from 'three';
import { AuthoredMotionSampler, type AuthoredMotionClip, type AuthoredMotionPose } from './motion';

const sizeLinearFields = ['catalogSizeL0', 'catalogSizeL1', 'catalogSizeL2', 'catalogSizeL3'];
const sizeQuadraticFields = ['catalogSizeQ0', 'catalogSizeQ1', 'catalogSizeQ2', 'catalogSizeQ3'];

export type CatalogLocalBinding = {
  sourceId: string;
  sourceParentId?: string;
  /** A construction captured on its destination body needs no eye-height fit. */
  eyeHeightRatio?: number;
  /** Keep a fitted accessory attached to this point in body-local space. */
  attachmentAnchor?: readonly number[];
  /** Tuft is body tissue: use live body RGB, retaining its own roughness. */
  inheritBodyPigment?: boolean;
  preserveFields?: readonly string[];
  sourceSceneCenter?: readonly number[];
  targetId: string;
  category: 'body' | 'eyes' | 'eyewear' | 'accessory';
  sourcePivot: readonly number[];
  targetPivot: readonly number[];
  geometryTransform: Matrix4;
  /** Destination appearance, including geometry-dependent shader bounds. */
  fields: Record<string, number[]>;
  /** Original observed scene center minus composed scene center (Computer). */
  sceneCenterDelta?: readonly number[];
};
export type CatalogLocalDimensions = { ground: number; height: number };

/** Retarget an observed edited-catalog rig. Its source body has ZERO authored
 * yaw. A named original preset with Ry(8deg) is not a compatible input.
 * Source eye motion is pivot-based: lateral action displacement scales with
 * body height while blink depth remains absolute. Attachment geometry fitting
 * is a separate similarity transform. No matrices or field arrays are allocated
 * during sampling. Source channels can be shared; each createPose() is private.
 */
export class CatalogRetargetSampler extends AuthoredMotionSampler {
  private sourcePose: AuthoredMotionPose[];
  private basePose?: AuthoredMotionPose[];
  private sourceBodyIndex: number;
  private targetBodyIndex: number;
  private bodyPigmentTargets: number[];
  private baseBodyIndex = -1;
  private body = new Matrix4();
  private normal = new Matrix4();
  private sourceInverse = new Matrix4();
  private sourceNormalInverse = new Matrix4();
  private local = new Matrix4();
  private localNormal = new Matrix4();
  private linear = new Matrix4();
  private sizeDelta = new Matrix4();
  private semantic = new Vector3();
  private parentTurn = new Matrix4();
  private eyeTurn = new Matrix4();
  private pivotInParent = new Vector3();
  private transformed = new Vector3();
  private displacement = new Vector3();
  /** Where the destination body's centre sits relative to the donor's, along the body's own height. */
  private centerDelta: number;
  private heightRatio: number;
  private mappings: {
    source: number;
    parent: number;
    sourceSceneCenter: readonly number[];
    target: number;
    category: CatalogLocalBinding['category'];
    pivot: Vector3;
    shift: Vector3;
    fit: Matrix4;
    sizeDelta: number;
    eyeHeightRatio: number;
    attachmentAnchor?: Vector3;
    inverseFit: Matrix4;
    normalFit?: Matrix4;
    inverseNormalFit?: Matrix4;
    defaults: [string, number[]][];
    sceneCenterDelta: readonly number[];
    animated: string[];
  }[];
  private baseMappings: { source: number; target: number; fields: string[] }[];

  constructor(
    private observed: AuthoredMotionSampler,
    bindings: CatalogLocalBinding[],
    sourceDimensions: CatalogLocalDimensions,
    destinationDimensions: CatalogLocalDimensions,
    private base?: AuthoredMotionSampler,
  ) {
    const body = observed.clip.parts.find((p) => p.id === 'mesh:0');
    if (!body) throw Error('Catalog observations require an explicit body frame');
    const templateParts = bindings.map((binding) => ({
      id: binding.targetId,
      translation: { value: [0, 0, 0] },
      rotation: { value: [0, 0, 0, 1] },
      scale: { value: [1, 1, 1] },
      fields: Object.fromEntries(
        Object.entries(binding.fields)
          .filter(([, values]) => values.length === 4)
          .map(([name, values]) => [name, { value: values }]),
      ),
    }));
    for (const part of base?.clip.parts ?? []) {
      const existing = templateParts.find((p) => p.id === part.id);
      if (existing)
        existing.fields = {
          ...existing.fields,
          ...part.fields,
        } as typeof existing.fields;
      else templateParts.push(part as (typeof templateParts)[number]);
    }
    // Camera is the original per-avatar projection shared by all of its parts.
    if (base?.clip.parts.some((p) => 'camera' in p.fields))
      for (const part of templateParts) part.fields.camera ??= { value: [1, 1, 0, 1] };
    const clock = base?.clip ?? observed.clip;
    super({ ...clock, parts: templateParts } as AuthoredMotionClip);
    for (const dimensions of [sourceDimensions, destinationDimensions])
      if (
        !Number.isFinite(dimensions.ground) ||
        !Number.isFinite(dimensions.height) ||
        dimensions.height <= 0
      )
        throw Error('Invalid catalog retarget dimensions');
    this.centerDelta =
      destinationDimensions.ground +
      destinationDimensions.height / 2 -
      (sourceDimensions.ground + sourceDimensions.height / 2);
    this.heightRatio = destinationDimensions.height / sourceDimensions.height;
    this.targetBodyIndex = this.clip.parts.findIndex((p) => p.id === 'mesh:0');
    this.bodyPigmentTargets = bindings
      .filter((binding) => binding.inheritBodyPigment)
      .map((binding) => this.clip.parts.findIndex((p) => p.id === binding.targetId));
    if (
      this.bodyPigmentTargets.length &&
      (this.targetBodyIndex < 0 ||
        !this.clip.parts[this.targetBodyIndex]!.fields.colorRoughness ||
        this.bodyPigmentTargets.some(
          (index) => index < 0 || !this.clip.parts[index]!.fields.colorRoughness,
        ))
    )
      throw Error('Body pigment inheritance requires explicit RGB channels');
    this.sourcePose = observed.createPose();
    this.sourceBodyIndex = this.sourcePose.findIndex((p) => p.id === 'mesh:0');
    this.basePose = base?.createPose();
    if (this.basePose) {
      this.baseBodyIndex = this.basePose.findIndex((p) => p.id === 'mesh:0');
      if (this.baseBodyIndex < 0) throw Error('Catalog activity requires its captured body frame');
      if (base!.clip.duration > observed.clip.duration + 1e-9)
        throw Error('Catalog activity exceeds observed attachment timeline');
    }
    this.mappings = bindings.map((binding) => {
      const source = this.sourcePose.findIndex((p) => p.id === binding.sourceId);
      const target = this.clip.parts.findIndex((p) => p.id === binding.targetId);
      if (source < 0 || target < 0) throw Error('Missing observed catalog motion binding');
      if (
        binding.sourcePivot.length !== 3 ||
        binding.targetPivot.length !== 3 ||
        ![...binding.sourcePivot, ...binding.targetPivot].every(Number.isFinite)
      )
        throw Error('Invalid catalog motion pivot');
      const pivot = new Vector3().fromArray(binding.sourcePivot);
      const rotated =
        binding.geometryTransform.elements[1] !== 0 || binding.geometryTransform.elements[4] !== 0;
      const normalFit = rotated
        ? binding.geometryTransform.clone().setPosition(0, 0, 0)
        : undefined;
      if (
        binding.attachmentAnchor &&
        (binding.category !== 'accessory' ||
          binding.attachmentAnchor.length !== 3 ||
          !binding.attachmentAnchor.every(Number.isFinite))
      )
        throw Error('Invalid catalog attachment anchor');
      return {
        source,
        parent: this.sourcePose.findIndex((p) => p.id === (binding.sourceParentId ?? 'mesh:0')),
        sourceSceneCenter: binding.sourceSceneCenter ?? [0, 0],
        target,
        category: binding.category,
        pivot,
        shift: new Vector3().fromArray(binding.targetPivot).sub(pivot),
        fit: binding.geometryTransform.clone(),
        sizeDelta: Math.cbrt(binding.geometryTransform.determinant()) - 1,
        eyeHeightRatio: binding.eyeHeightRatio ?? this.heightRatio,
        attachmentAnchor: binding.attachmentAnchor
          ? new Vector3().fromArray(binding.attachmentAnchor)
          : undefined,
        inverseFit: binding.geometryTransform.clone().invert(),
        normalFit,
        inverseNormalFit: normalFit?.clone().invert(),
        sceneCenterDelta: binding.sceneCenterDelta ?? [0, 0],
        defaults: Object.entries(binding.fields).filter(([, values]) => values.length === 4),
        animated: Object.entries(observed.clip.parts[source]!.fields)
          .filter(
            ([name, channel]) =>
              'samples' in channel &&
              binding.fields[name]?.length === 4 &&
              !binding.preserveFields?.includes(name),
          )
          .map(([name]) => name),
      };
    });
    this.baseMappings = (this.basePose ?? []).map((part, source) => ({
      source,
      target: this.clip.parts.findIndex((p) => p.id === part.id),
      fields: Object.keys(part.fields),
    }));
  }

  override sample(seconds: number, target: AuthoredMotionPose[]) {
    if (!Number.isFinite(seconds) || target.length !== this.clip.parts.length)
      throw Error('Invalid catalog motion output');
    this.observed.sample(seconds, this.sourcePose);
    const inputBody = this.sourcePose[this.sourceBodyIndex]!;
    this.sourceInverse.copy(inputBody.world).invert();
    this.sourceNormalInverse.copy(inputBody.normalMatrix).invert();
    if (this.base && this.basePose) {
      this.base.sample(seconds, this.basePose);
      const baseBody = this.basePose[this.baseBodyIndex]!;
      this.body.copy(baseBody.world);
      this.normal.copy(baseBody.normalMatrix);
    } else {
      this.body.copy(inputBody.world);
      this.normal.copy(inputBody.normalMatrix);
      const b = this.body.elements;
      b[12]! -= b[4]! * this.centerDelta;
      b[13]! += (Math.hypot(b[4]!, b[5]!, b[6]!) - b[5]!) * this.centerDelta;
      b[14]! -= b[6]! * this.centerDelta;
    }
    for (const mapping of this.mappings) {
      const input = this.sourcePose[mapping.source]!,
        output = target[mapping.target]!;
      if (output.id !== this.clip.parts[mapping.target]!.id)
        throw Error('Catalog pose identity changed');
      if (mapping.category === 'body') {
        output.world.copy(this.body);
        output.normalMatrix.copy(this.normal);
      } else {
        const sourceParent = this.sourcePose[mapping.parent]!;
        this.sourceInverse.copy(sourceParent.world).invert();
        this.sourceNormalInverse.copy(sourceParent.normalMatrix).invert();
        const centerWeight = input.fields.catalogCenterWeight?.[0] ?? 0;
        this.local.copy(input.world);
        this.local.elements[12]! += mapping.sourceSceneCenter[0]! * centerWeight;
        this.local.elements[13]! += mapping.sourceSceneCenter[1]! * centerWeight;
        this.local.premultiply(this.sourceInverse);
        this.localNormal.copy(this.sourceNormalInverse).multiply(input.normalMatrix);
        if (mapping.category === 'eyes' && this.base && input.fields.catalogAnchorX) {
          const x = input.fields.catalogAnchorX!,
            y = input.fields.catalogAnchorY!,
            z = input.fields.catalogAnchorZ!;
          this.displacement.set(
            x[0]! * mapping.shift.x + y[0]! * mapping.shift.y + z[0]! * mapping.shift.z,
            x[1]! * mapping.shift.x + y[1]! * mapping.shift.y + z[1]! * mapping.shift.z,
            x[2]! * mapping.shift.x + y[2]! * mapping.shift.y + z[2]! * mapping.shift.z,
          );
          if (input.fields.catalogSizeL0 && mapping.sizeDelta !== 0) {
            const delta = this.sizeDelta.elements,
              s = mapping.sizeDelta;
            for (let column = 0; column < 4; column++) {
              const l = input.fields[sizeLinearFields[column]!]!,
                q = input.fields[sizeQuadraticFields[column]!]!;
              for (let row = 0; row < 4; row++)
                delta[column * 4 + row] = l[row]! * s + q[row]! * s * s;
            }
            this.displacement.x +=
              delta[12]! -
              delta[0]! * mapping.shift.x -
              delta[4]! * mapping.shift.y -
              delta[8]! * mapping.shift.z;
            this.displacement.y +=
              delta[13]! -
              delta[1]! * mapping.shift.x -
              delta[5]! * mapping.shift.y -
              delta[9]! * mapping.shift.z;
            this.displacement.z +=
              delta[14]! -
              delta[2]! * mapping.shift.x -
              delta[6]! * mapping.shift.y -
              delta[10]! * mapping.shift.z;
            // Retain the original normal residual while changing the semantic
            // surface projection; translating its anchor never rotates normals.
            this.linear
              .copy(this.local)
              .setPosition(0, 0, 0)
              .transpose()
              .multiply(this.localNormal);
            delta[12] = delta[13] = delta[14] = 0;
            this.sizeDelta.premultiply(this.sourceInverse);
            for (let k = 0; k < 16; k++) this.local.elements[k]! += delta[k]!;
            this.localNormal
              .copy(this.local)
              .setPosition(0, 0, 0)
              .invert()
              .transpose()
              .multiply(this.linear);
          }
          this.displacement.applyMatrix4(this.linear.copy(this.sourceInverse).setPosition(0, 0, 0));
          const e = this.local.elements;
          e[12]! += this.displacement.x;
          e[13]! += this.displacement.y;
          e[14]! += this.displacement.z;
        } else if (mapping.category === 'eyes') {
          // The pivot offset between the donor's eye and this one is carried by whatever
          // the eye actually rides, which is read off the eye's own world turn `eyeTurn`
          // rather than assumed to be its parent's: a heart's eyes roll with its body, a
          // six-lobed flower's body rolls 180° in plane under eyes that stay put. Scale
          // and any turn the eye makes about itself still pivot on the offset (`linear`),
          // and both terms are written into the parent's frame at this instant.
          this.eyeTurn.makeBasis(
            this.semantic
              .set(input.world.elements[0]!, input.world.elements[1]!, input.world.elements[2]!)
              .normalize(),
            this.transformed
              .set(input.world.elements[4]!, input.world.elements[5]!, input.world.elements[6]!)
              .normalize(),
            this.displacement
              .set(input.world.elements[8]!, input.world.elements[9]!, input.world.elements[10]!)
              .normalize(),
          );
          this.parentTurn.copy(this.sourceInverse).setPosition(0, 0, 0);
          this.linear.copy(this.local).setPosition(0, 0, 0);
          this.pivotInParent
            .copy(mapping.pivot)
            .applyMatrix4(this.eyeTurn)
            .applyMatrix4(this.parentTurn);
          this.semantic
            .copy(mapping.pivot)
            .applyMatrix4(this.linear)
            .sub(this.pivotInParent)
            .add(this.displacement.setFromMatrixPosition(this.local));
          this.transformed.copy(mapping.shift).applyMatrix4(this.linear);
          this.displacement
            .copy(mapping.shift)
            .applyMatrix4(this.eyeTurn)
            .applyMatrix4(this.parentTurn);
          const e = this.local.elements;
          e[12]! +=
            this.semantic.x * (mapping.eyeHeightRatio - 1) +
            this.displacement.x -
            this.transformed.x;
          e[13]! +=
            this.semantic.y * (mapping.eyeHeightRatio - 1) +
            this.displacement.y -
            this.transformed.y;
          e[14]! += this.displacement.z - this.transformed.z;
        } else {
          this.local.premultiply(mapping.fit).multiply(mapping.inverseFit);
          if (mapping.normalFit)
            this.localNormal.premultiply(mapping.normalFit).multiply(mapping.inverseNormalFit!);
        }
        if (mapping.attachmentAnchor) {
          // Retain native local rotation/scale (and its normal transform), but
          // enforce the editor's attached-accessory contract at every pose.
          this.linear.copy(this.local).setPosition(0, 0, 0);
          this.transformed.copy(mapping.attachmentAnchor).applyMatrix4(this.linear);
          this.displacement.copy(mapping.attachmentAnchor).sub(this.transformed);
          this.local.setPosition(this.displacement);
        }
        output.world.copy(this.body).multiply(this.local);
        // Fitting is a positive uniform similarity; its scalar cancels from
        // the local normal conjugation. Pivots never translate directions.
        output.normalMatrix.copy(this.normal).multiply(this.localNormal);
        output.world.elements[12]! +=
          (mapping.sceneCenterDelta[0]! - mapping.sourceSceneCenter[0]!) *
          (mapping.attachmentAnchor ? 0 : centerWeight);
        output.world.elements[13]! +=
          (mapping.sceneCenterDelta[1]! - mapping.sourceSceneCenter[1]!) *
          (mapping.attachmentAnchor ? 0 : centerWeight);
      }
      for (const [name, values] of mapping.defaults) {
        const out = output.fields[name]!;
        for (let k = 0; k < 4; k++) out[k] = values[k]!;
      }
      for (const name of mapping.animated) {
        const out = output.fields[name]!,
          values = input.fields[name]!;
        for (let k = 0; k < 4; k++) out[k] = values[k]!;
      }
    }
    if (this.basePose) {
      for (const mapping of this.baseMappings) {
        const source = this.basePose[mapping.source]!,
          output = target[mapping.target]!;
        output.world.copy(source.world);
        output.normalMatrix.copy(source.normalMatrix);
        for (const name of mapping.fields)
          for (let k = 0; k < 4; k++) output.fields[name]![k] = source.fields[name]![k]!;
      }
      const camera = this.basePose[this.baseBodyIndex]!.fields.camera;
      if (camera)
        for (const output of target)
          for (let k = 0; k < 4; k++) output.fields.camera![k] = camera[k]!;
    }
    // Multiplication cannot recover a donor's zero RGB channel. Copy the real
    // body pigment after activity overrides, keeping independent roughness.
    if (this.bodyPigmentTargets.length) {
      const bodyPaint = target[this.targetBodyIndex]!.fields.colorRoughness!;
      for (const index of this.bodyPigmentTargets) {
        const paint = target[index]!.fields.colorRoughness!;
        for (let k = 0; k < 3; k++) paint[k] = bodyPaint[k]!;
      }
    }
  }
}
