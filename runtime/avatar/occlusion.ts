/** Independent live AO passes. Input depth is a normal OpenGL [0,1] depth
 * texture and width/height are its physical pixels, not CSS dimensions. */
import * as THREE from 'three';
import vertexShader from './assets/ao.vert.glsl?raw';
import fragmentShader from './assets/ao.frag.glsl?raw';

type FrameValues = Record<string, readonly number[]>;
type FrameUniforms = Record<string, THREE.Matrix4 | THREE.Vector4>;

export class AuthoredOcclusion {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly geometry = new THREE.BufferGeometry();
  private readonly mesh: THREE.Mesh;
  private readonly sampleMaterial: THREE.RawShaderMaterial;
  private readonly resolveMaterial: THREE.RawShaderMaterial;
  private readonly sampled: THREE.WebGLRenderTarget;
  private readonly resolved: THREE.WebGLRenderTarget;
  private readonly frame: FrameUniforms;
  private width = 0;
  private height = 0;
  private disposed = false;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    frameValues: FrameValues,
  ) {
    this.frame = Object.fromEntries(
      Object.entries(frameValues).map(([name, values]) => {
        if (![4, 16].includes(values.length) || !values.every(Number.isFinite)) {
          throw new Error(`Invalid authored AO frame field: ${name}`);
        }
        return [
          name,
          values.length === 16
            ? new THREE.Matrix4().fromArray(values)
            : new THREE.Vector4().fromArray(values),
        ];
      }),
    );
    for (const name of ['viewProjection', 'inverseViewProjection']) {
      if (!(this.frame[name] instanceof THREE.Matrix4))
        throw new Error(`Missing authored AO matrix: ${name}`);
    }
    for (const name of ['viewport', 'cameraPosition', 'effects']) {
      if (!(this.frame[name] instanceof THREE.Vector4))
        throw new Error(`Missing authored AO vector: ${name}`);
    }
    if ((this.frame.cameraPosition as THREE.Vector4).w !== 0)
      throw new Error('AuthoredOcclusion requires an orthographic scene');
    // Position merely provides the draw count. gl_VertexID generates the exact
    // original oversize fullscreen triangle without a quad seam.
    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(9), 3),
    );
    this.geometry.setDrawRange(0, 3);
    const target = () =>
      new THREE.WebGLRenderTarget(1, 1, {
        format: THREE.RedFormat,
        type: THREE.UnsignedByteType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
        colorSpace: THREE.NoColorSpace,
        samples: 0,
      });
    this.sampled = target();
    this.resolved = target();
    const material = (define: string) =>
      new THREE.RawShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader,
        fragmentShader,
        defines: { [define]: 1 },
        uniforms: {
          f: { value: this.frame },
          cameraDepth: { value: null },
          ambientOcclusion: { value: this.sampled.texture },
          avatarCameras: { value: null },
          avatarGrid: { value: new THREE.Vector4() },
        },
        depthTest: false,
        depthWrite: false,
        blending: THREE.NoBlending,
        toneMapped: false,
      });
    this.sampleMaterial = material('ORBIT_ORTHOGRAPHIC_AO');
    // Sampling does not read ambientOcclusion, but do not leave the currently
    // written texture bound to that uniform even when it is compiled out.
    this.sampleMaterial.uniforms.ambientOcclusion!.value = null;
    this.resolveMaterial = material('ORBIT_RESOLVE_AO');
    this.mesh = new THREE.Mesh(this.geometry, this.sampleMaterial);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  resize(width: number, height: number) {
    if (this.disposed) throw new Error('AuthoredOcclusion is disposed');
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new Error('Authored AO dimensions must be positive physical pixel integers');
    }
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.sampled.setSize(Math.max(1, Math.ceil(width / 2)), Math.max(1, Math.ceil(height / 2)));
    this.resolved.setSize(width, height);
    (this.frame.viewport as THREE.Vector4).set(width, height, 1 / width, 1 / height);
  }

  setAvatars(cameras: THREE.Texture, columns: number, rows: number, pixels: number, count: number) {
    for (const material of [this.sampleMaterial, this.resolveMaterial]) {
      material.uniforms.avatarCameras!.value = cameras;
      material.uniforms.avatarGrid!.value.set(columns, rows, pixels, count);
    }
  }

  render(
    depthTexture: THREE.Texture,
    projectionMatrix: THREE.Matrix4,
    width: number,
    height: number,
    bounds?: THREE.Vector4,
  ): THREE.Texture {
    this.resize(width, height);
    for (const target of [this.sampled, this.resolved]) {
      target.scissorTest = !!bounds && (bounds.z < width || bounds.w < height);
      if (bounds) {
        const x = Math.floor((bounds.x * target.width) / width);
        const y = Math.floor((bounds.y * target.height) / height);
        target.scissor.set(
          x,
          y,
          Math.ceil(((bounds.x + bounds.z) * target.width) / width) - x,
          Math.ceil(((bounds.y + bounds.w) * target.height) / height) - y,
        );
      }
    }
    if (
      !projectionMatrix.elements.every(Number.isFinite) ||
      Math.abs(projectionMatrix.determinant()) < 1e-15
    ) {
      throw new Error('Authored AO requires a finite invertible view-projection matrix');
    }
    const elements = projectionMatrix.elements;
    if (elements[3] !== 0 || elements[7] !== 0 || elements[11] !== 0 || elements[15] !== 1) {
      throw new Error('Authored AO requires an orthographic view-projection matrix');
    }
    (this.frame.viewProjection as THREE.Matrix4).copy(projectionMatrix);
    (this.frame.inverseViewProjection as THREE.Matrix4).copy(projectionMatrix).invert();
    this.sampleMaterial.uniforms.cameraDepth!.value = depthTexture;
    this.resolveMaterial.uniforms.cameraDepth!.value = depthTexture;
    const renderer = this.renderer;
    const previousTarget = renderer.getRenderTarget();
    const previousFace = renderer.getActiveCubeFace();
    const previousMip = renderer.getActiveMipmapLevel();
    const previousAutoClear = renderer.autoClear;
    const previousXrEnabled = renderer.xr.enabled;
    try {
      renderer.autoClear = false;
      renderer.xr.enabled = false;
      this.mesh.material = this.sampleMaterial;
      // setRenderTarget applies the target's physical-pixel viewport and
      // scissor. setViewport here would apply canvas DPR a second time.
      renderer.setRenderTarget(this.sampled);
      renderer.render(this.scene, this.camera);
      this.mesh.material = this.resolveMaterial;
      renderer.setRenderTarget(this.resolved);
      renderer.render(this.scene, this.camera);
    } finally {
      renderer.setRenderTarget(previousTarget, previousFace, previousMip);
      renderer.autoClear = previousAutoClear;
      renderer.xr.enabled = previousXrEnabled;
    }
    return this.resolved.texture;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.geometry.dispose();
    this.sampleMaterial.dispose();
    this.resolveMaterial.dispose();
    this.sampled.dispose();
    this.resolved.dispose();
    this.scene.clear();
  }
}
