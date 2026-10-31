/** Original authored assets and material equations, rendered by an independent
 * Three scene. Captured semantic clips are separate from the fixed reference fixture. */
import * as THREE from 'three';
import { readPixelsAsync } from './async-pixels';
import { boundBodyPigment } from '../../src/agent-avatar/body-pigment';
import type { AuthoredMotionPose, AuthoredMotionSampler } from './motion';
import { AvatarPoseSharing } from './pose-sharing';
import { loadAuthoredMotion, type MotionKind, type MotionSamplers } from './motion-catalog';
import { prepareCanonicalTuft } from './canonical-tuft';
import { advanceMotion, type MotionState } from './motion-controller';
import { AuthoredOcclusion } from './occlusion';
import { AvatarPointerController } from './pointer-controller';
import { AvatarGazeController } from './gaze-controller';
import { ReactionGazeComposer, reactionGazeEnvelope } from './reaction-gaze';
import {
  AvatarEyeGazeController,
  eyeClosureFromMorph,
  type EyeGazeProfile,
} from './eye-gaze-controller';
import rawEyeProfiles from './assets/eye-gaze-profiles.json';
import vertexShader from './assets/authored.vert.glsl?raw';
import fragmentShader from './assets/authored.frag.glsl?raw';
import fixture from './assets/reference-pose.json';
import {
  AVATAR_PRESETS,
  loadAuthoredAsset,
  type AvatarPreset,
  type AuthoredAsset,
  type AuthoredPart,
} from './catalog';
import ltc1Url from './assets/furLTC1.bin?url';
import ltc2Url from './assets/furLTC2.bin?url';

const eyeProfiles = rawEyeProfiles.presets as unknown as Partial<
  Record<AvatarPreset, Record<'0' | '1', Record<string, EyeGazeProfile>>>
>;
type Vectors = Record<string, number[]>;
// These joints are immutable identity transforms. Three accepts their flattened
// representation directly instead of copying 24 Matrix4 objects on every draw.
const identityJoints = Float32Array.from({ length: 24 * 16 }, (_, index) =>
  (index % 16) % 5 === 0 ? 1 : 0,
);
function uniforms(values: Vectors) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value.length === 16
        ? new THREE.Matrix4().fromArray(value)
        : new THREE.Vector4().fromArray(value),
    ]),
  );
}
async function binary(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Avatar resource failed (${response.status}): ${url}`);
  return response.arrayBuffer();
}
type RenderPart = {
  eyeProfile: EyeGazeProfile | null;
  source: AuthoredPart;
  motionTexture: THREE.DataTexture | null;
  motionPart: number;
  workPart: number;
  workLoopPart: number;
  material: THREE.RawShaderMaterial;
  depth: THREE.RawShaderMaterial | null;
};
export type ResolvedAvatarAsset = {
  source: AuthoredAsset;
  samplers: MotionSamplers | null;
  eyeProfiles?: Record<number, EyeGazeProfile>;
};
type LoadedAsset = {
  activities: boolean;
  source: AuthoredAsset;
  parts: RenderPart[];
  samplers: MotionSamplers | null;
};
type InstanceState = {
  rendering?: boolean;
  matrix: THREE.Matrix4;
  normalMatrix: THREE.Matrix4;
  motion?: MotionState;
  entrance?: { started: number; held?: number; pendingStart?: boolean };
  wander?: { next: number; step: number };
  pose?: AuthoredMotionPose[];
  poseSampler?: AuthoredMotionSampler;
  poseSampleTime?: number;
  reactionGaze?: {
    motion: MotionState;
    yaw: number;
    pitch: number;
    x: number;
    y: number;
    strength: number;
    frozen: boolean;
  };
  poseOverride?: Map<string, AuthoredMotionPose>;
  preset: string;
  color: THREE.Color;
  colorHex: string | null;
  look: THREE.Vector2;
  pointer: AvatarPointerController;
  gaze: AvatarGazeController;
  eyes: AvatarEyeGazeController;
  gazeTarget: THREE.Vector2;
  gazePending: boolean;
  phase: number;
  revision: number;
};
type AvatarBatch = {
  mesh: THREE.InstancedMesh;
  part: RenderPart;
  slots: number[];
  visible: boolean;
  renderedSlots?: number[];
};
/** A non-DOM owner supplies scheduling, visibility and a WebGL2 context. The
 * engine retains the same shaders, pixel density, MSAA and presentation crop. */
export type AvatarEngineHost = {
  context: WebGL2RenderingContext;
  getSize(): { width: number; height: number; pixelRatio: number };
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
  isHidden(): boolean;
  subscribe?(events: {
    resize(): void;
    visibility(): void;
    contextLost(): void;
    contextRestored(): void;
  }): () => void;
  onFrame(output: {
    framebuffer: WebGLFramebuffer;
    width: number;
    height: number;
    columns: number;
    rows: number;
    pixels: number;
    renderedIndices: readonly number[];
  }): void;
};
export class AuthoredAvatarEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1.82, 1.82, 1.82, -1.82, 0.1, 20);
  private batches: AvatarBatch[] = [];
  private assets = new Map<string, LoadedAsset>();
  private pendingAssets = new Map<string, Promise<LoadedAsset>>();
  private retiredAssets: LoadedAsset[] = [];
  private assetClaims = new Map<string, number>();
  private defaultPreset: string;
  private resolveAsset?: (
    key: string,
    detail: 'low' | 'high',
    activities?: boolean,
  ) => Promise<ResolvedAvatarAsset>;
  private lazyWork: boolean;
  private allowPoseOverrides: boolean;
  private assetLoader: typeof loadAuthoredAsset;
  private detail: 'low' | 'high';
  private sizeRevision = 0;
  private fits = new THREE.DataTexture(
    new Float32Array(200 * 4),
    200,
    1,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  private cameras = new THREE.DataTexture(
    new Float32Array(200 * 4),
    200,
    1,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  private materials: THREE.RawShaderMaterial[] = [];
  private textures: THREE.DataTexture[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private depthMaterials: THREE.RawShaderMaterial[] = [];
  private depthTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: true,
    depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
  });
  private disabledShadow = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  private occlusion: AuthoredOcclusion;
  private colorTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: true,
    samples: 4,
    resolveDepthBuffer: false,
    storeMultisampledDepthBuffer: false,
  });
  private renderBounds = new THREE.Vector4();
  private host?: AvatarEngineHost;
  private unsubscribeHost?: () => void;
  private outputTarget?: THREE.WebGLRenderTarget;
  private presentScene = new THREE.Scene();
  private presentGeometry = new THREE.PlaneGeometry(2, 2);
  private presentMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader:
      'precision highp float; in vec3 position; out vec2 uv; void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1);}',
    fragmentShader: `precision highp float;
      in vec2 uv; out vec4 color;
      uniform sampler2D image; uniform vec2 surface;
      uniform vec4 grid; uniform highp sampler2D fits;
      void main(){
        vec2 pixel=vec2(uv.x,1.-uv.y)*surface;
        vec2 cell=floor((pixel-surface*.5)/grid.x+grid.yz*.5);
        if(any(lessThan(cell,vec2(0)))||any(greaterThanEqual(cell,grid.yz))||cell.y*grid.y+cell.x>=grid.w){color=vec4(0);return;}
        vec4 fit=texelFetch(fits,ivec2(int(cell.y*grid.y+cell.x),0),0);
        vec2 origin=surface*.5+(cell-grid.yz*.5)*grid.x;
        vec2 local=(pixel-origin)/grid.x;
        vec2 sourceLocal=fit.xy+local*fit.zw;
        if(any(lessThan(sourceLocal,vec2(0)))||any(greaterThanEqual(sourceLocal,vec2(1)))){color=vec4(0);return;}
        vec2 halfPixel=surface/vec2(textureSize(image,0))*.5;
        vec2 samplePixel=origin+clamp(sourceLocal*grid.x,halfPixel,vec2(grid.x)-halfPixel);
        vec2 coordinate=samplePixel/surface;
        color=texture(image,vec2(coordinate.x,1.-coordinate.y));
      }`,
    uniforms: {
      image: { value: this.colorTarget.texture },
      surface: { value: new THREE.Vector2() },
      grid: { value: new THREE.Vector4() },
      fits: { value: this.fits },
    },
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
  });
  private raf = 0;
  private urgentFrame = true;
  private presentationCapacity = true;
  private presentationQueued = false;
  private maxFrameRate = 60;
  private disposed = false;
  private count = 1;
  private frames = 0;
  private fitPasses = 0;
  private elapsed = 0;
  private timedFrames = 0;
  private ready = false;
  private width = 320;
  private height = 320;
  private cols = 1;
  private rows = 1;
  private paused = true;
  private time = 0;
  private reactionComposer = new ReactionGazeComposer();
  private reactionEyes = new AvatarEyeGazeController();
  private previousTime = 0;
  private attributesDirty = true;
  private cropCache = new Map<string, number[]>();
  private fitsDirty = true;
  private fitGeneration = 0;
  private fitReads: ReturnType<typeof readPixelsAsync>[] = [];
  private renderFailure: Error | null = null;
  private fitPending = true;
  private backingPixels = 320;
  private poseObject = new THREE.Object3D();
  private pointerIndex: number | null = null;
  private hoverIndex: number | null = null;
  private pointerPivot = new THREE.Vector3();
  private rotatedPivot = new THREE.Vector3();
  private pointerBasis = new THREE.Matrix4().makeRotationY((8 * Math.PI) / 180);
  private pointerInverse = this.pointerBasis.clone().invert();
  private pointerMatrix = new THREE.Matrix4();
  private pointerPitch = new THREE.Matrix4();
  private eyeWorld = new THREE.Matrix4();
  private eyeNormal = new THREE.Matrix4();
  private projection = new THREE.Matrix4();
  private inverseProjection = new THREE.Matrix4();
  private partWorld = new THREE.Matrix4();
  private partNormal = new THREE.Matrix4();
  private states: InstanceState[] = [];
  private poseSharing = new AvatarPoseSharing();
  private observer?: ResizeObserver;
  private visibilityObserver?: IntersectionObserver;
  private inViewport = true;
  private contextLost = false;
  private visibilityChanged = () => {
    this.previousTime = 0;
    if (this.hidden() || !this.inViewport || this.contextLost) {
      // Hidden time must neither consume a readback deadline nor retain GPU
      // staging buffers. Visibility resumption requests a fresh reference fit.
      this.cancelFitReads();
      this.cancelFrame();
      this.raf = 0;
    } else this.invalidate();
  };
  private onContextLost = () => {
    this.cancelFitReads();
    this.contextLost = true;
    this.visibilityChanged();
  };
  private onContextRestored = () => {
    this.contextLost = false;
    this.previousTime = 0;
    this.resize();
  };
  private pixels: number;
  private onFrame?: () => void;
  private onError?: (error: Error) => void;
  readonly loaded: Promise<void>;
  constructor(
    private canvas: HTMLCanvasElement | null,
    options: {
      count?: number;
      size?: number;
      preset?: string;
      maxFrameRate?: number;
      poseOverrides?: boolean;
      assetLoader?: typeof loadAuthoredAsset;
      lazyWork?: boolean;
      host?: AvatarEngineHost;
      onFrame?: () => void;
      onError?: (error: Error) => void;
      resolveAsset?: (
        key: string,
        detail: 'low' | 'high',
        activities?: boolean,
      ) => Promise<ResolvedAvatarAsset>;
    } = {},
  ) {
    this.host = options.host;
    if (!canvas && !this.host) throw Error('Avatar engine requires a canvas or a render host');
    this.allowPoseOverrides = options.poseOverrides ?? false;
    this.onFrame = options.onFrame;
    this.onError = options.onError;
    this.resolveAsset = options.resolveAsset;
    this.lazyWork = options.lazyWork ?? false;
    this.assetLoader = options.assetLoader ?? loadAuthoredAsset;
    this.maxFrameRate = this.validFrameRate(options.maxFrameRate ?? 60);
    this.defaultPreset = options.preset ?? 'blue_beret';
    this.count = this.validCount(options.count ?? 1);
    this.pixels = Math.max(48, Number.isFinite(options.size) ? options.size! : 320);
    this.detail = this.pixels <= 128 ? 'low' : 'high';
    this.fits.needsUpdate = true;
    // Three requires a canvas-shaped event owner even with an injected context.
    // This facade is local to this renderer; native lifecycle arrives through
    // host.subscribe, without creating or replacing browser globals.
    const contextEvents = new Map<string, Set<EventListener>>();
    const dispatchContextEvent = (type: string) => {
      const event = { type, preventDefault() {} } as Event;
      for (const listener of contextEvents.get(type) ?? []) listener(event);
    };
    if (this.host && typeof this.host.context.texStorage2D !== 'function')
      throw Error('Avatar render host requires a WebGL2 context');
    const renderCanvas = this.host
      ? ({
          width: 1,
          height: 1,
          style: {},
          getContext: (kind: string) => (kind === 'webgl2' ? this.host!.context : null),
          addEventListener(type: string, listener: EventListener) {
            const listeners = contextEvents.get(type) ?? new Set<EventListener>();
            listeners.add(listener);
            contextEvents.set(type, listeners);
          },
          removeEventListener(type: string, listener: EventListener) {
            contextEvents.get(type)?.delete(listener);
          },
          setAttribute() {},
        } as unknown as HTMLCanvasElement)
      : canvas!;
    this.renderer = new THREE.WebGLRenderer({
      canvas: renderCanvas,
      // Expo's WebGL2 inherits WebGLRenderingContext. Requesting webgl2 from
      // the local facade avoids Three's supplied-context WebGL1 instanceof
      // rejection without mutating native or browser global prototypes.
      alpha: true,
      // Geometry is antialiased in colorTarget. The final pass is an aligned
      // fullscreen image; a second multisampled framebuffer adds no edge detail.
      antialias: false,
    });
    this.disabledShadow.compareFunction = THREE.LessEqualCompare;
    this.disabledShadow.needsUpdate = true;
    this.occlusion = new AuthoredOcclusion(this.renderer, fixture.frame);
    this.renderer.setPixelRatio(Math.min(this.pixelRatio(), 2));
    this.renderer.setClearColor(0, 0);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // Authored shader encodes sRGB once.
    this.presentScene.add(new THREE.Mesh(this.presentGeometry, this.presentMaterial));
    this.camera.position.z = 4;
    this.camera.updateMatrixWorld();
    if (this.host) {
      this.outputTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
      this.unsubscribeHost = this.host.subscribe?.({
        resize: () => this.resize(),
        visibility: this.visibilityChanged,
        contextLost: () => {
          dispatchContextEvent('webglcontextlost');
          this.onContextLost();
        },
        contextRestored: () => {
          dispatchContextEvent('webglcontextrestored');
          this.onContextRestored();
        },
      });
    } else {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas!);
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.inViewport = entry?.isIntersecting ?? false;
        this.visibilityChanged();
      });
      this.visibilityObserver.observe(canvas!);
      document.addEventListener('visibilitychange', this.visibilityChanged);
      canvas!.addEventListener('webglcontextlost', this.onContextLost);
      canvas!.addEventListener('webglcontextrestored', this.onContextRestored);
    }
    this.loaded = this.load();
  }
  private hidden() {
    return this.host ? this.host.isHidden() : document.hidden;
  }
  private pixelRatio() {
    return this.host ? this.host.getSize().pixelRatio : window.devicePixelRatio || 1;
  }
  private cancelFrame() {
    if (this.host) this.host.cancelFrame(this.raf);
    else cancelAnimationFrame(this.raf);
  }
  private async load() {
    const textures = await Promise.all([ltc1Url, ltc2Url].map(binary));
    if (this.disposed) return;
    this.textures = textures.map((data, i) => {
      const spec = fixture.sourceTextures[i + 2]!;
      const floating = spec.type === 5126;
      const texture = new THREE.DataTexture(
        floating ? new Float32Array(data) : new Uint8Array(data),
        spec.width,
        spec.height,
        THREE.RGBAFormat,
        floating ? THREE.FloatType : THREE.UnsignedByteType,
      );
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    });
    await this.ensureAsset(this.defaultPreset);
    if (this.disposed) return;
    this.ready = true;
    this.setCount(this.count);
  }
  private asset(preset: string) {
    return this.assets.get(`${preset}:${this.detail}`);
  }
  private ensureAsset(
    preset: string,
    detail = this.detail,
    activities = !this.lazyWork ||
      this.states.some((state) => state.preset === preset && state.motion?.kind === 'work'),
  ): Promise<LoadedAsset> {
    const key = `${preset}:${detail}`;
    const pendingKey = `${key}:${activities ? 'work' : 'base'}`;
    if (!AVATAR_PRESETS.includes(preset as AvatarPreset) && !this.resolveAsset)
      return Promise.reject(Error(`Unsupported avatar: ${preset}`));
    const existing = this.assets.get(key);
    if (existing && (!activities || existing.activities)) return Promise.resolve(existing);
    const pending = this.pendingAssets.get(pendingKey);
    if (pending) return pending;
    const resolved = AVATAR_PRESETS.includes(preset as AvatarPreset)
      ? Promise.all([
          this.assetLoader(preset as AvatarPreset, detail, activities),
          loadAuthoredMotion(preset as AvatarPreset, activities),
        ]).then(([source, samplers]) => {
          prepareCanonicalTuft(source.parts);
          return {
            source,
            samplers,
            eyeProfiles: undefined as Record<number, EyeGazeProfile> | undefined,
          };
        })
      : this.resolveAsset!(preset, detail, activities);
    const promise = resolved
      .then(({ source, samplers, eyeProfiles: customEyes }) => {
        if (this.disposed) {
          source.parts.forEach((part) => part.geometry.dispose());
          throw Error('Avatar engine disposed during loading');
        }
        const parts = source.parts.map((part) => {
          part.geometry.setAttribute(
            'instanceOffset',
            new THREE.InstancedBufferAttribute(new Float32Array(200 * 2), 2).setUsage(
              THREE.DynamicDrawUsage,
            ),
          );
          part.geometry.setAttribute(
            'instancePigment',
            new THREE.InstancedBufferAttribute(new Float32Array(200 * 3).fill(1), 3).setUsage(
              THREE.DynamicDrawUsage,
            ),
          );
          const motionTexture =
            samplers || this.allowPoseOverrides
              ? new THREE.DataTexture(
                  new Float32Array(64),
                  16,
                  1,
                  THREE.RGBAFormat,
                  THREE.FloatType,
                )
              : null;
          const motionPart =
            samplers?.idle.clip.parts.findIndex(
              (p) => p.id === `${part.fur ? 'fur' : 'mesh'}:${part.id}`,
            ) ?? -1;
          const workPart =
            samplers?.work?.clip.parts.findIndex(
              (p) => p.id === `${part.fur ? 'fur' : 'mesh'}:${part.id}`,
            ) ?? -1;
          const workLoopPart =
            samplers?.workLoop?.clip.parts.findIndex(
              (p) => p.id === `${part.fur ? 'fur' : 'mesh'}:${part.id}`,
            ) ?? -1;
          if (samplers && motionPart < 0 && !part.activity)
            throw Error(`Missing motion part: ${preset}/${part.id}`);
          const material = this.material(part, source.material.frame);
          if (motionTexture) {
            material.defines.AUTHORED_MOTION = 1;
            material.defines.AUTHORED_COMPUTER = 1;
            material.uniforms.instancePose = { value: motionTexture };
          }
          const depth =
            part.fur || part.depthWrite === false
              ? null
              : new THREE.RawShaderMaterial({
                  glslVersion: THREE.GLSL3,
                  vertexShader,
                  fragmentShader:
                    'precision highp float; out vec4 color; void main(){color=vec4(1);}',
                  uniforms: material.uniforms,
                  defines: motionTexture ? { AUTHORED_MOTION: 1, AUTHORED_COMPUTER: 1 } : {},
                  colorWrite: false,
                });
          this.geometries.push(part.geometry);
          this.materials.push(material);
          if (depth) this.depthMaterials.push(depth);
          return {
            source: part,
            material,
            depth,
            motionTexture,
            motionPart,
            workPart,
            workLoopPart,
            eyeProfile: !part.fur
              ? ((customEyes
                  ? customEyes[part.id]
                  : eyeProfiles[source.preset]?.[detail === 'high' ? '1' : '0']?.[part.id]) ?? null)
              : null,
          };
        });
        const asset = { source, parts, samplers, activities };
        const previous = this.assets.get(key);
        // A concurrent base request must never downgrade a completed activity rig.
        if (previous?.activities && !activities) {
          this.disposeAsset(asset);
          return previous;
        }
        if (previous) this.retiredAssets.push(previous);
        this.assets.set(key, asset);
        if (detail === 'high' && AVATAR_PRESETS.includes(preset as AvatarPreset))
          this.cropCache.set(`${preset}:high:320`, source.material.crop);
        return asset;
      })
      .finally(() => this.pendingAssets.delete(pendingKey));
    this.pendingAssets.set(pendingKey, promise);
    return promise;
  }
  private material(part: AuthoredPart, frameValues: Vectors) {
    const frame = uniforms(frameValues);
    return new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      defines: {
        ...(!part.universal ? { FELIPE_MATERIAL: 1, FELIPE_KIND: part.kind } : {}),
        ...(part.fur ? { FELIPE_FUR: 1 } : {}),
      },
      uniforms: {
        f: { value: frame },
        d: { value: uniforms(part.fields) },
        skin: {
          value: {
            joints: identityJoints,
          },
        },
        crowdProjection: { value: new THREE.Matrix4() },
        crowdInverseProjection: { value: this.inverseProjection },
        outputInverse: { value: new THREE.Vector2() },
        ambientOcclusion: { value: null },
        // The universal program declares several sampler TYPES even when the
        // authored material disables their features. Bind each through Three
        // so an unused 3D/shadow sampler cannot alias texture unit zero's 2D map.
        shadowMap: { value: this.disabledShadow },
        shadowDepth: { value: null },
        occlusionDepth: { value: this.depthTarget.depthTexture },
        environmentBRDF: { value: null },
        studioLighting: { value: null },
        paletteField: { value: null },
        referencePalette: { value: null },
        furLTC1: { value: this.textures[0] },
        furLTC2: { value: this.textures[1] },
      },
      premultipliedAlpha: true,
      transparent: part.transparent ?? (part.fur || part.fields.coverage![0]! < 1),
      depthWrite: part.depthWrite ?? !part.fur,
      depthTest: part.depthTest ?? true,
      side: part.doubleSided || part.fur ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  private validCount(value: number) {
    return Math.max(1, Math.min(200, Math.floor(Number.isFinite(value) ? value : 1)));
  }
  setCount(value: number) {
    if (this.disposed) return;
    const nextCount = this.validCount(value);
    if (this.ready && this.count === nextCount && this.states.length === nextCount) return;
    if (this.pointerIndex !== null && this.pointerIndex >= nextCount) this.endPointer();
    if (this.hoverIndex !== null && this.hoverIndex >= nextCount) this.selectHover(null);
    this.count = nextCount;
    if (!this.ready) return;
    while (this.states.length < this.count)
      this.states.push({
        preset: this.defaultPreset,
        matrix: new THREE.Matrix4(),
        normalMatrix: new THREE.Matrix4(),
        color: new THREE.Color(1, 1, 1),
        colorHex: null,
        look: new THREE.Vector2(),
        pointer: new AvatarPointerController(),
        gaze: new AvatarGazeController(),
        eyes: new AvatarEyeGazeController(),
        gazeTarget: new THREE.Vector2(0.5, 0.5),
        gazePending: false,
        phase: this.states.length * 2.399,
        revision: 0,
      });
    this.states.length = this.count;
    for (const state of this.states) this.resolvePigment(state);
    this.rebuildBatches();
  }
  private pruneAssets() {
    // Keep active/awaited recipes and a small recent cache. Editing hundreds of
    // combinations must not retain every geometry, shader and pose texture.
    const active = new Set([
      this.defaultPreset,
      ...this.states.map((s) => s.preset),
      ...this.assetClaims.keys(),
    ]);
    const unused = [...this.assets].filter(
      ([key]) =>
        !active.has(key.slice(0, key.lastIndexOf(':'))) &&
        !this.pendingAssets.has(`${key}:base`) &&
        !this.pendingAssets.has(`${key}:work`),
    );
    for (const [key, asset] of unused.slice(0, Math.max(0, unused.length - 4))) {
      this.assets.delete(key);
      this.disposeAsset(asset);
      for (const fit of this.cropCache.keys())
        if (fit.startsWith(key + ':')) this.cropCache.delete(fit);
    }
  }
  private disposeAsset(asset: LoadedAsset) {
    for (const part of asset.parts) {
      part.motionTexture?.dispose();
      part.source.geometry.dispose();
      part.material.dispose();
      part.depth?.dispose();
      this.geometries = this.geometries.filter((g) => g !== part.source.geometry);
      this.materials = this.materials.filter((m) => m !== part.material);
      if (part.depth) this.depthMaterials = this.depthMaterials.filter((m) => m !== part.depth);
    }
  }
  private async ensureCurrentDetail(presets: readonly string[], activities?: boolean) {
    for (const preset of presets)
      this.assetClaims.set(preset, (this.assetClaims.get(preset) ?? 0) + 1);
    const release = () => {
      for (const preset of presets) {
        const count = this.assetClaims.get(preset)! - 1;
        if (count) this.assetClaims.set(preset, count);
        else this.assetClaims.delete(preset);
      }
      if (!this.disposed) this.pruneAssets();
    };
    try {
      let detail: typeof this.detail;
      do {
        detail = this.detail;
        await Promise.all(presets.map((preset) => this.ensureAsset(preset, detail, activities)));
      } while (!this.disposed && detail !== this.detail);
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }
  getInstancePreset(index: number) {
    return this.states[index]?.preset;
  }
  hasPreset(preset: string) {
    return !!this.asset(preset);
  }
  cancelPresetChange(index: number) {
    const state = this.states[index];
    if (state) state.revision++;
  }
  async setPreset(index: number, preset: string, isCurrent = () => true) {
    await this.loaded;
    const state = this.states[index];
    if (!state || this.disposed) return;
    const revision = ++state.revision;
    if (state.preset === preset && this.asset(preset)) return;
    const release = await this.ensureCurrentDetail([preset]);
    try {
      if (
        this.disposed ||
        this.states[index] !== state ||
        revision !== state.revision ||
        !isCurrent()
      )
        return;
      if (state.preset !== preset) {
        if (this.pointerIndex === index) this.endPointer();
        state.pointer.reset();
        state.gaze.reset();
        state.eyes.reset();
        state.gazeTarget.set(0.5, 0.5);
        state.gazePending = false;
        state.motion = undefined;
        state.pose = undefined;
        state.poseOverride = undefined;
      }
      state.preset = preset;
      this.resolvePigment(state);
      this.rebuildBatches();
    } finally {
      release();
    }
  }
  async setPresets(presets: readonly string[]) {
    await this.loaded;
    const changes = this.states.map((state, i) => ({
      state,
      revision: ++state.revision,
      preset: presets[i % presets.length],
    }));
    if (changes.some((c) => !c.preset)) throw Error('An avatar preset is required');
    const release = await this.ensureCurrentDetail([...new Set(changes.map((c) => c.preset!))]);
    try {
      if (this.disposed) return;
      changes.forEach(({ state, revision, preset }, index) => {
        if (this.states[index] === state && state.revision === revision) {
          if (state.preset !== preset) {
            this.endPointer();
            state.pointer.reset();
            state.gaze.reset();
            state.eyes.reset();
            state.gazeTarget.set(0.5, 0.5);
            state.gazePending = false;
            state.motion = undefined;
            state.pose = undefined;
            state.poseOverride = undefined;
          }
          state.preset = preset!;
          this.resolvePigment(state);
        }
      });
      this.rebuildBatches();
    } finally {
      release();
    }
  }
  private rebuildBatches() {
    for (const { mesh } of this.batches) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.batches = [];
    for (const asset of this.retiredAssets) this.disposeAsset(asset);
    this.retiredAssets = [];
    const groups = new Map<string, number[]>();
    this.states.forEach((state, i) => {
      const slots = groups.get(state.preset) ?? [];
      slots.push(i);
      groups.set(state.preset, slots);
    });
    for (const [preset, slots] of groups) {
      const asset = this.asset(preset)!;
      for (const part of asset.parts) {
        if (part.motionTexture && part.motionTexture.image.height < slots.length) {
          // Allocate for the instances of this mesh, not the entire pool's
          // maximum. A diverse crowd otherwise reserves 200 pose rows for
          // every part even when each recipe appears only once.
          const height = Math.min(200, 2 ** Math.ceil(Math.log2(slots.length)));
          // WebGL2 textures use immutable storage. Retire the previous GPU
          // allocation before uploading a larger image through the same uniform.
          part.motionTexture.dispose();
          part.motionTexture.image = {
            data: new Float32Array(height * 64),
            width: 16,
            height,
          };
          part.motionTexture.needsUpdate = true;
        }
        const geometry = part.source.geometry;
        const mesh = new THREE.InstancedMesh(geometry, part.material, slots.length);
        mesh.frustumCulled = false;
        mesh.renderOrder = part.source.renderOrder ?? 0;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(mesh);
        this.batches.push({ mesh, part, slots, visible: true });
      }
      for (const index of slots)
        (this.fits.image.data as Float32Array).set(asset.source.material.crop, index * 4);
    }
    this.fits.needsUpdate = true;
    this.resize();
  }
  async setSize(value: number) {
    if (!Number.isFinite(value) || this.disposed) return;
    this.pixels = Math.max(48, value);
    const revision = ++this.sizeRevision;
    const detail = this.pixels <= 128 ? 'low' : 'high';
    this.resize();
    await this.loaded;
    while (!this.disposed && revision === this.sizeRevision && detail !== this.detail) {
      await Promise.all(
        [...new Set(this.states.map((state) => state.preset))].map((preset) =>
          this.ensureAsset(preset, detail),
        ),
      );
      if (this.disposed || revision !== this.sizeRevision) return;
      if (this.states.some((state) => !this.assets.has(`${state.preset}:${detail}`))) continue;
      this.detail = detail;
      this.rebuildBatches();
    }
  }
  /** Explicit held pose for editors and finite observation review, not an action controller. */
  setPose(index: number, pose: readonly AuthoredMotionPose[] | null) {
    if (!this.allowPoseOverrides) throw Error('Pose overrides were not enabled');
    if (this.disposed) return;
    const state = this.states[index];
    if (!state) return;
    if (pose) {
      const asset = this.asset(state.preset);
      if (!asset) throw Error('Avatar assets are not ready');
      const mapped = new Map(pose.map((part) => [part.id, part]));
      if (mapped.size !== pose.length || mapped.size !== asset.parts.length)
        throw Error('Pose parts must match the selected avatar');
      for (const part of asset.parts) {
        const value = mapped.get(`${part.source.fur ? 'fur' : 'mesh'}:${part.source.id}`);
        if (
          !value ||
          !value.world.elements.every(Number.isFinite) ||
          !value.normalMatrix.elements.every(Number.isFinite)
        )
          throw Error('Invalid pose transform or part identity');
        for (const name of [
          'parameters',
          'signatureDeform',
          'colorRoughness',
          'paletteClosure',
          'referencePose',
          'coverage',
          'eyeCurveOriginAmount',
          'eyeCurveRightWidth',
          'camera',
        ]) {
          const channel = value.fields[name];
          if (channel && (channel.length !== 4 || !channel.every(Number.isFinite)))
            throw Error(`Invalid pose field: ${name}`);
        }
        const camera = value.fields.camera;
        if (camera && (camera[0]! <= 0 || camera[1]! <= 0 || camera[3]! < 0 || camera[3]! > 1))
          throw Error('Invalid pose camera');
      }
      // Own the uploaded pose: callers may reuse their sampling buffer for a
      // second avatar. Reuse these allocations on subsequent editor frames.
      const owned = state.poseOverride ?? new Map<string, AuthoredMotionPose>();
      for (const value of mapped.values()) {
        const target = owned.get(value.id);
        if (!target) {
          owned.set(value.id, {
            id: value.id,
            world: value.world.clone(),
            normalMatrix: value.normalMatrix.clone(),
            fields: Object.fromEntries(
              Object.entries(value.fields).map(([key, channel]) => [key, channel.slice()]),
            ),
          });
        } else {
          target.world.copy(value.world);
          target.normalMatrix.copy(value.normalMatrix);
          for (const key of Object.keys(target.fields))
            if (!(key in value.fields)) delete target.fields[key];
          for (const [key, channel] of Object.entries(value.fields)) {
            const out = target.fields[key] ?? (target.fields[key] = []);
            for (let i = 0; i < channel.length; i++) out[i] = channel[i]!;
          }
        }
      }
      state.poseOverride = owned;
    } else state.poseOverride = undefined;
    this.invalidate();
  }
  resetAppearance(index?: number) {
    if (index === undefined || this.pointerIndex === index) this.endPointer();
    if (index === undefined || this.hoverIndex === index) this.hoverIndex = null;
    this.attributesDirty = true;
    for (const state of index === undefined ? this.states : this.states.slice(index, index + 1)) {
      state.motion = undefined;
      state.poseOverride = undefined;
      state.colorHex = null;
      this.resolvePigment(state);
      state.look.set(0, 0);
      state.pointer.reset();
      state.gaze.reset();
      state.eyes.reset();
      state.gazeTarget.set(0.5, 0.5);
      state.gazePending = false;
    }
    this.invalidate();
  }
  setMotionFrame(index: number, kind: MotionKind, seconds: number) {
    const state = this.states[index];
    if (
      !state ||
      !this.asset(state.preset)?.samplers ||
      !Number.isFinite(seconds) ||
      (kind !== 'idle' && kind !== 'reaction' && kind !== 'work') ||
      !this.asset(state.preset)?.samplers?.[kind]
    )
      return false;
    state.poseOverride = undefined;
    state.motion = { kind, started: this.time, held: Math.max(0, seconds) };
    this.invalidate();
    return true;
  }
  canReact(index: number) {
    const state = this.states[index];
    return !!state && !!this.asset(state.preset)?.samplers?.reaction;
  }
  canIdle(index: number) {
    const state = this.states[index];
    return !!state && !!this.asset(state.preset)?.samplers?.idle;
  }
  canWork(index: number) {
    const state = this.states[index];
    if (!state) return false;
    const asset = this.asset(state.preset);
    return (
      !!asset?.samplers?.work && asset.parts.some((part) => part.source.activity === 'computer')
    );
  }
  /** Prepare optional activity resources while the avatar keeps displaying its
   * current animation. Starting Work remains an explicit presentation event. */
  async prepareWork(index: number) {
    await this.loaded;
    const state = this.states[index];
    if (!state || this.disposed) return false;
    const preset = state.preset,
      revision = state.revision;
    if (this.asset(preset)?.activities) return this.canWork(index);
    const release = await this.ensureCurrentDetail([preset], true);
    try {
      if (this.disposed) return false;
      // Replacement assets can be shared with neighbours. Rebind their batches
      // even if the initiating instance was changed/disposed during the fetch.
      this.rebuildBatches();
      return (
        this.states[index] === state &&
        state.preset === preset &&
        state.revision === revision &&
        this.canWork(index)
      );
    } finally {
      release();
    }
  }
  work(index: number, continuous = false, cycles = 1) {
    const state = this.states[index];
    if (
      !state ||
      !this.canWork(index) ||
      (continuous && !this.asset(state.preset)?.samplers?.workLoop)
    )
      return false;
    state.poseOverride = undefined;
    state.motion = {
      kind: 'work',
      started: this.time,
      pendingStart: true,
      continuous,
      remainingCycles: Number.isFinite(cycles) ? Math.max(1, Math.floor(cycles)) : 1,
    };
    this.setPaused(false);
    return true;
  }
  react(index: number) {
    const state = this.states[index];
    if (!state || state.pointer.active || !this.asset(state.preset)?.samplers?.reaction)
      return false;
    const clip = this.asset(state.preset)!.samplers!.reaction!.clip;
    if (
      state.motion?.kind === 'reaction' &&
      state.motion.held === undefined &&
      (state.motion.pendingStart || this.time - state.motion.started < clip.duration)
    ) {
      // One pending request per avatar. Repeated clicks must not keep rewinding
      // the current action or grow an unbounded queue.
      state.motion.queuedReaction = true;
      this.invalidate();
      return true;
    }
    state.poseOverride = undefined;
    state.motion = { kind: 'reaction', started: this.time, pendingStart: true };
    state.reactionGaze = {
      motion: state.motion,
      yaw: state.gaze.yaw,
      pitch: state.gaze.pitch,
      x: state.eyes.x,
      y: state.eyes.y,
      strength: 1,
      frozen: true,
    };
    this.setPaused(false);
    return true;
  }
  idle(index: number) {
    const state = this.states[index];
    if (!state || !this.asset(state.preset)?.samplers) return false;
    state.poseOverride = undefined;
    state.motion = { kind: 'idle', started: this.time };
    this.setPaused(false);
    return true;
  }
  private validFrameRate(rate: number) {
    if (rate !== Infinity && (!Number.isFinite(rate) || rate < 1 || rate > 240))
      throw Error('Frame rate must be 1–240 or Infinity');
    return rate;
  }
  setMaxFrameRate(rate: number) {
    this.maxFrameRate = this.validFrameRate(rate);
    this.invalidate();
  }
  setPaused(value: boolean) {
    if (value)
      this.states.forEach((state) => {
        state.motion = undefined;
      });
    if (this.paused !== value) this.previousTime = 0;
    this.paused = value;
    this.invalidate();
  }
  /** Gaze coordinates use the same uncropped [0,1] space as native input. */
  entrance(index: number) {
    const state = this.states[index];
    if (!state) return;
    state.entrance = { started: this.time, pendingStart: true };
    this.invalidate();
  }
  setWander(index: number, enabled: boolean) {
    const state = this.states[index];
    if (!state) return;
    state.wander = enabled ? { next: this.time, step: 0 } : undefined;
    this.invalidate();
  }
  setGaze(index: number, x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw Error('Invalid avatar gaze');
    this.queueGaze(index, THREE.MathUtils.clamp(x, 0, 1), THREE.MathUtils.clamp(y, 0, 1));
  }
  setLook(index: number, x: number, y: number) {
    const state = this.states[index];
    if (!state) return;
    x = Number.isFinite(x) ? THREE.MathUtils.clamp(x, -1, 1) : 0;
    y = Number.isFinite(y) ? THREE.MathUtils.clamp(y, -1, 1) : 0;
    if (state.look.x === x && state.look.y === y) return;
    state.look.set(x, y);
    this.invalidate();
  }
  setColor(index: number, color: string) {
    const state = this.states[index];
    if (!state) return;
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw Error('Body color must be #RRGGBB');
    this.attributesDirty = true;
    state.colorHex = color;
    this.resolvePigment(state);
    this.invalidate();
  }
  clearColor(index: number) {
    const state = this.states[index];
    if (!state) return;
    state.colorHex = null;
    this.resolvePigment(state);
    this.attributesDirty = true;
    this.invalidate();
  }
  setInstancePaused(index: number, paused: boolean) {
    const state = this.states[index];
    if (!state) return;
    const motion = state.motion ?? (state.motion = { kind: 'idle', started: -state.phase });
    if (paused && motion.held === undefined) motion.held = this.time - motion.started;
    else if (!paused && motion.held !== undefined) {
      motion.started = this.time - motion.held;
      delete motion.held;
    }
    if (state.entrance) {
      if (paused && state.entrance.held === undefined)
        state.entrance.held = this.time - state.entrance.started;
      else if (!paused && state.entrance.held !== undefined) {
        state.entrance.started = this.time - state.entrance.held;
        delete state.entrance.held;
      }
    }
    this.invalidate();
  }
  /** A pooled output canvas retains its own painted pixels. Exclude an
   * offscreen or already-painted still from GPU batches without deleting its
   * independent pose, action clock, input state or position in the atlas. */
  setInstanceRendering(index: number, rendering: boolean) {
    const state = this.states[index];
    if (!state || state.rendering === rendering) return;
    state.rendering = rendering;
    if (rendering) {
      if (!this.cropCache.has(`${state.preset}:${this.detail}:${this.backingPixels}`))
        this.fitsDirty = this.fitPending = true;
      this.invalidate();
    }
  }
  private resolvePigment(state: InstanceState) {
    const base = this.asset(state.preset)!.source.material.parts[0]!.fields.colorRoughness!;
    if (state.colorHex) state.color.set(state.colorHex);
    else state.color.setRGB(base[0]!, base[1]!, base[2]!);
    boundBodyPigment(state.color);
    state.color.r /= Math.max(base[0]!, 1e-6);
    state.color.g /= Math.max(base[1]!, 1e-6);
    state.color.b /= Math.max(base[2]!, 1e-6);
  }
  hitTest(x: number, y: number) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x >= this.width ||
      y >= this.height
    )
      return null;
    const cols = Math.min(this.count, this.cols);
    const column = Math.floor((x - this.width / 2) / this.pixels + cols / 2),
      row = Math.floor((y - this.height / 2) / this.pixels + this.rows / 2);
    const index = row * this.cols + column;
    return column >= 0 && column < cols && row >= 0 && row < this.rows && index < this.count
      ? index
      : null;
  }
  private pointerCoordinates(index: number, x: number, y: number) {
    const left =
      this.width / 2 + ((index % this.cols) - Math.min(this.count, this.cols) / 2) * this.pixels;
    const top = this.height / 2 + (Math.floor(index / this.cols) - this.rows / 2) * this.pixels;
    const fit = this.fits.image.data as Float32Array;
    return [
      fit[index * 4]! + ((x - left) / this.pixels) * fit[index * 4 + 2]!,
      fit[index * 4 + 1]! + ((y - top) / this.pixels) * fit[index * 4 + 3]!,
    ] as const;
  }
  beginPointer(x: number, y: number) {
    if (!this.ready || this.fitPending || this.pointerIndex !== null) return null;
    const index = this.hitTest(x, y);
    if (index === null || !this.states[index]) return null;
    this.selectHover(index);
    this.pointerIndex = index;
    this.queueGaze(index, ...this.pointerCoordinates(index, x, y));
    this.states[index]!.pointer.down(
      ...this.pointerCoordinates(index, x, y),
      performance.now() / 1000,
    );
    this.invalidate();
    return index;
  }
  private queueGaze(index: number, x: number, y: number) {
    const state = this.states[index];
    if (
      !state ||
      this.asset(state.preset)?.source.preset === 'blue_beret' ||
      (state.gazeTarget.x === x && state.gazeTarget.y === y)
    )
      return;
    state.gazeTarget.set(x, y);
    state.gazePending = true;
    this.invalidate();
  }
  private selectHover(index: number | null) {
    if (this.hoverIndex === index) return;
    if (this.hoverIndex !== null) this.queueGaze(this.hoverIndex, 0.5, 0.5);
    this.hoverIndex = index;
  }
  endPointer(x?: number, y?: number) {
    if (this.pointerIndex === null) return;
    this.states[this.pointerIndex]?.pointer.up(performance.now() / 1000);
    this.pointerIndex = null;
    if (x !== undefined && y !== undefined) this.point(x, y);
    this.invalidate();
  }
  point(x: number, y: number) {
    if (!this.ready || this.fitPending || !Number.isFinite(x) || !Number.isFinite(y)) return;
    if (this.pointerIndex !== null) {
      const index = this.pointerIndex;
      const coordinates = this.pointerCoordinates(index, x, y);
      this.states[index]?.pointer.move(...coordinates);
      this.queueGaze(index, ...coordinates);
      this.invalidate();
      return;
    }
    const index = this.hitTest(x, y);
    this.selectHover(index);
    if (index !== null) this.queueGaze(index, ...this.pointerCoordinates(index, x, y));
  }
  private resize() {
    if (this.disposed) return;
    this.cancelFitReads();
    this.attributesDirty = true;
    this.fitsDirty = true;
    const scale = this.pixels <= 64 ? 1 : this.pixels <= 128 ? 1.5 : 2;
    this.backingPixels = Math.max(
      64,
      Math.min(512, Math.round(this.pixels * Math.min(this.pixelRatio(), scale))),
    );
    this.renderer.setPixelRatio(this.backingPixels / this.pixels);
    this.fitPending = this.states.some(
      (state) =>
        state.rendering !== false &&
        !this.cropCache.has(`${state.preset}:${this.detail}:${this.backingPixels}`),
    );
    const { width, height } = this.host
      ? this.host.getSize()
      : this.canvas!.getBoundingClientRect();
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.cols = Math.max(1, Math.floor(this.width / this.pixels));
    this.rows = Math.ceil(this.count / this.cols);
    for (const { part } of this.batches) {
      if (!part.source.fur) continue;
      const original = part.source.fields;
      const scale = new THREE.Vector3().setFromMatrixScale(
        new THREE.Matrix4().fromArray(original.world!),
      );
      const projected =
        original.fur![1]! *
        original.fur![2]! *
        Math.max(scale.x, scale.y, scale.z) *
        Math.abs(fixture.frame.viewProjection[5]!) *
        this.backingPixels *
        0.5;
      const budget =
        Math.min(8192, 160 + projected * projected * 0.027) *
        THREE.MathUtils.clamp((projected - 12) / 48, 0, 1);
      part.source.geometry.setDrawRange(0, Math.ceil(budget) * 12);
    }
    for (const material of this.materials)
      material.uniforms.f!.value.viewport.set(
        this.backingPixels,
        this.backingPixels,
        1 / this.backingPixels,
        1 / this.backingPixels,
      );
    const unit = 3.64 / this.pixels;
    this.camera.left = (-this.width * unit) / 2;
    this.camera.right = (this.width * unit) / 2;
    this.camera.top = (this.height * unit) / 2;
    this.camera.bottom = (-this.height * unit) / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    const ratio = this.renderer.getPixelRatio();
    this.colorTarget.setSize(Math.round(this.width * ratio), Math.round(this.height * ratio));
    this.depthTarget.setSize(this.colorTarget.width, this.colorTarget.height);
    this.outputTarget?.setSize(this.colorTarget.width, this.colorTarget.height);
    for (const material of this.materials)
      material.uniforms.outputInverse!.value.set(
        1 / this.colorTarget.width,
        1 / this.colorTarget.height,
      );
    this.presentMaterial.uniforms.surface!.value.set(this.width, this.height);
    this.presentMaterial.uniforms.grid!.value.set(
      this.pixels,
      Math.min(this.count, this.cols),
      this.rows,
      this.count,
    );
    this.invalidate();
  }
  /** A presenter may hold a bounded number of submitted frames. Coalesce new
   * render requests until capacity returns, retaining the newest state and
   * urgency without changing animation clocks or the configured frame rate. */
  setPresentationCapacity(available: boolean) {
    if (this.disposed || this.presentationCapacity === available) return;
    this.presentationCapacity = available;
    if (!available) {
      if (this.raf) {
        this.cancelFrame();
        this.raf = 0;
        this.presentationQueued = true;
      }
    } else if (this.presentationQueued) {
      this.presentationQueued = false;
      this.invalidate(false);
    }
  }
  private invalidate(urgent = true) {
    this.urgentFrame ||= urgent;
    if (!this.presentationCapacity) {
      this.presentationQueued = true;
      return;
    }
    if (!this.raf && !this.disposed && !this.hidden() && this.inViewport && !this.contextLost)
      this.raf = this.host ? this.host.requestFrame(this.tick) : requestAnimationFrame(this.tick);
  }
  private updateRenderBounds() {
    const width = this.colorTarget.width;
    const height = this.colorTarget.height;
    const bounds = this.renderBounds;
    bounds.set(0, 0, width, height);
    if (this.states.some((state) => state.rendering === false)) {
      let left = this.cols,
        right = 0,
        top = this.rows,
        bottom = 0;
      this.states.forEach((state, index) => {
        if (state.rendering === false) return;
        const column = index % this.cols;
        const row = Math.floor(index / this.cols);
        left = Math.min(left, column);
        right = Math.max(right, column + 1);
        top = Math.min(top, row);
        bottom = Math.max(bottom, row + 1);
      });
      const originX = (width - Math.min(this.count, this.cols) * this.backingPixels) / 2;
      const originY = (height - this.rows * this.backingPixels) / 2;
      // AO rays and bilateral resolve reject other avatar cells. Clear a guard
      // outside the active cells for the one-pixel depth-normal stencil and
      // half-resolution rounding, so old inactive depth cannot affect an edge.
      const guard = 8;
      const x = Math.max(0, Math.floor(originX + left * this.backingPixels) - guard);
      const y = Math.max(
        0,
        Math.floor(originY + (this.rows - bottom) * this.backingPixels) - guard,
      );
      const endX = Math.min(width, Math.ceil(originX + right * this.backingPixels) + guard);
      const endY = Math.min(
        height,
        Math.ceil(originY + (this.rows - top) * this.backingPixels) + guard,
      );
      bounds.set(x, y, Math.max(0, endX - x), Math.max(0, endY - y));
    }
    for (const target of [this.depthTarget, this.colorTarget]) {
      target.scissor.copy(bounds);
      target.scissorTest = bounds.z < width || bounds.w < height;
    }
    if (this.outputTarget) {
      this.outputTarget.scissor.copy(bounds);
      this.outputTarget.scissorTest = this.colorTarget.scissorTest;
    }
  }
  private tick = (timestamp: number) => {
    this.raf = 0;
    if (!this.presentationCapacity) {
      this.presentationQueued = true;
      return;
    }
    if (this.fitReads.length || this.renderFailure) return;
    if (this.disposed || !this.ready || this.hidden() || !this.inViewport || this.contextLost)
      return;
    if (this.states.every((state) => state.rendering === false)) {
      this.previousTime = 0;
      return;
    }
    // Pace continuous animation only. Interaction, asset changes and paused
    // updates paint immediately; animation time still advances by wall time.
    if (
      !this.urgentFrame &&
      this.previousTime &&
      timestamp - this.previousTime < 1000 / this.maxFrameRate - 1
    ) {
      this.invalidate(false);
      return;
    }
    this.urgentFrame = false;
    const frameDelta = this.previousTime ? (timestamp - this.previousTime) / 1000 : 0;
    if (!this.paused && this.previousTime) {
      this.time += frameDelta;
      this.elapsed += frameDelta;
      this.timedFrames++;
    }
    this.previousTime = timestamp;
    const projection = this.projection.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );
    this.inverseProjection.copy(projection).invert();
    // Match the original's one-time alpha fit at each backing resolution. The
    // readback is per unique preset/resolution, never per instance or animated frame.
    const measureFit = this.fitPending;
    this.poseSharing.beginFrame();
    if (!measureFit) {
      // Idle clocks have no pending action transition. Count exact duplicates
      // before sampling; independent clocks keep the direct, copy-free path.
      for (const state of this.states) {
        const motion = state.motion;
        if (
          state.rendering === false ||
          state.poseOverride ||
          motion?.kind !== 'idle' ||
          motion.pendingStart
        )
          continue;
        const sampler = this.asset(state.preset)?.samplers?.idle;
        if (!sampler) continue;
        const sampleTime = motion.held ?? this.time - motion.started;
        if (state.poseSampler !== sampler || state.poseSampleTime !== sampleTime)
          this.poseSharing.register(sampler, sampleTime);
      }
    }
    const object = this.poseObject;
    let cameraChanged = false;
    for (const [stateIndex, state] of this.states.entries()) {
      if (state.rendering === false && !measureFit) continue;
      const asset = this.asset(state.preset);
      object.position.set(
        0,
        this.paused || measureFit || state.poseOverride || asset?.samplers
          ? 0
          : Math.sin(this.time * 1.8 + state.phase) * 0.025,
        0,
      );
      object.rotation.set(
        measureFit ? 0 : -state.look.y * 0.12,
        measureFit ? 0 : state.look.x * 0.18,
        this.paused || measureFit || state.poseOverride || asset?.samplers
          ? 0
          : Math.sin(this.time + state.phase) * 0.02,
      );
      object.scale.setScalar(1);
      if (state.entrance && !measureFit) {
        if (state.entrance.pendingStart) {
          state.entrance.started = this.time;
          delete state.entrance.pendingStart;
        }
        const t = Math.min(
          1,
          Math.max(0, state.entrance.held ?? this.time - state.entrance.started),
        );
        const grow = 1 - (1 - t) ** 3;
        object.scale.setScalar(0.1 + 0.9 * grow);
        object.position.x -= 0.26 * Math.sin(Math.PI * t) * (1 - t);
        object.position.y -= 0.55 * (1 - grow);
        object.rotation.z -= 0.32 * (1 - grow);
        if (t === 1) state.entrance = undefined;
      }
      if (
        state.wander &&
        !measureFit &&
        !this.paused &&
        state.motion?.held === undefined &&
        (!state.motion || state.motion.kind === 'idle') &&
        this.hoverIndex !== stateIndex &&
        this.pointerIndex !== stateIndex &&
        this.time >= state.wander.next
      ) {
        const phase = state.phase + ++state.wander.step * 2.399963;
        this.queueGaze(
          stateIndex,
          0.5 + Math.sin(phase) * 0.28,
          0.5 + Math.sin(phase * 1.73) * 0.2,
        );
        state.wander.next = this.time + 1.8 + (1 + Math.sin(phase * 0.7)) * 1.2;
      }
      object.updateMatrix();
      state.matrix.copy(object.matrix);
      if (!state.poseOverride && asset?.samplers && !measureFit && (!this.paused || state.motion)) {
        const samplers = asset!.samplers!;
        const previousMotion = state.motion;
        state.motion = advanceMotion(state.motion, samplers, this.time);
        // Presentation activation must retain the gaze snapshot taken at input.
        if (previousMotion?.pendingStart && state.reactionGaze?.motion === previousMotion)
          state.reactionGaze.motion = state.motion!;
        const motion = state.motion;
        const sampler =
          motion?.kind === 'work' && motion.continuous
            ? samplers.workLoop!
            : samplers[motion?.kind ?? 'idle']!;
        // Equal part counts do not imply equal semantic channels (hidden blink).
        if (!state.pose || state.poseSampler !== sampler) {
          state.pose = sampler.createPose();
          state.poseSampler = sampler;
          state.poseSampleTime = undefined;
        }
        const sampleTime =
          motion?.held ?? (motion ? this.time - motion.started : this.time + state.phase);
        // Held neighbours still participate in the shared render, but their
        // semantic pose is immutable until its sampler or clock changes.
        if (state.poseSampleTime !== sampleTime) {
          this.poseSharing.sample(sampler, sampleTime, state.pose);
          state.poseSampleTime = sampleTime;
        }
      }
      const reactionTiming =
        state.motion?.kind === 'reaction' ? asset?.samplers?.reactionGaze : undefined;
      if (reactionTiming && state.motion) {
        if (state.reactionGaze?.motion !== state.motion) {
          state.reactionGaze = {
            motion: state.motion,
            yaw: state.gaze.yaw,
            pitch: state.gaze.pitch,
            x: state.eyes.x,
            y: state.eyes.y,
            strength: 1,
            frozen: true,
          };
        }
        const envelope = reactionGazeEnvelope(
          (state.motion.held ?? this.time - state.motion.started) - reactionTiming.entryTime,
          reactionTiming.coreSeconds,
        );
        state.reactionGaze.strength = envelope.strength;
        state.reactionGaze.frozen = envelope.frozen;
      } else state.reactionGaze = undefined;
      state.normalMatrix.copy(state.matrix).setPosition(0, 0, 0);
      state.pointer.sample(timestamp / 1000);
      // Native activity-mode ignores hover and captured drag, including Start/Stop.
      const work = state.motion?.kind === 'work';
      const reaction = state.reactionGaze;
      const strength = reaction?.strength ?? 1;
      const yaw = work
        ? 0
        : state.pointer.yaw + (reaction?.frozen ? reaction.yaw : state.gaze.yaw) * strength;
      const pitch = work
        ? 0
        : state.pointer.pitch + (reaction?.frozen ? reaction.pitch : state.gaze.pitch) * strength;
      if (!measureFit && (yaw || pitch)) {
        this.pointerMatrix
          .copy(this.pointerBasis)
          .multiply(this.pointerPitch.makeRotationY(yaw))
          .multiply(this.pointerPitch.makeRotationX(pitch))
          .multiply(this.pointerInverse);
        state.normalMatrix.premultiply(this.pointerMatrix);
        if (reaction) {
          const neutral = (state.poseOverride?.get('mesh:0') ?? state.pose?.[0])?.fields
            .gazeNeutralTranslation;
          if (!neutral) throw Error('Reaction is missing its independent neutral frame');
          this.pointerPivot.fromArray(neutral);
          this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix);
          this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot));
        } else if (asset?.source.preset !== 'blue_beret') {
          const body =
            state.poseOverride?.get('mesh:0')?.world ??
            (!this.paused || state.motion ? state.pose?.[0]?.world : undefined) ??
            asset!.parts[0]!.material.uniforms.d!.value.world;
          this.pointerPivot.setFromMatrixPosition(body);
          this.rotatedPivot.copy(this.pointerPivot).applyMatrix4(this.pointerMatrix);
          this.pointerMatrix.setPosition(this.pointerPivot.sub(this.rotatedPivot));
        }
        state.matrix.premultiply(this.pointerMatrix);
      }
      const camera = measureFit
        ? undefined
        : (state.poseOverride?.get('mesh:0')?.fields.camera ??
          (!this.paused || state.motion ? state.pose?.[0]?.fields.camera : undefined));
      const data = this.cameras.image.data as Float32Array;
      const index = stateIndex * 4;
      for (let k = 0; k < 4; k++) {
        const value = Math.fround(camera?.[k] ?? (k < 2 ? 1 : 0));
        if (data[index + k] !== value) {
          data[index + k] = value;
          cameraChanged = true;
        }
      }
    }
    if (cameraChanged) {
      this.cameras.clearUpdateRanges();
      this.cameras.addUpdateRange(0, this.count * 4);
      this.cameras.needsUpdate = true;
    }
    this.occlusion.setAvatars(
      this.cameras,
      Math.min(this.count, this.cols),
      this.rows,
      this.backingPixels,
      this.count,
    );
    for (const material of this.materials)
      material.uniforms.crowdProjection!.value.copy(projection);
    this.batches.forEach((batch) => {
      const { mesh, part } = batch;
      const slots = batch.slots.filter((index) => this.states[index]!.rendering !== false);
      const offsetsChanged =
        this.attributesDirty ||
        !batch.renderedSlots ||
        slots.length !== batch.renderedSlots.length ||
        slots.some((index, i) => index !== batch.renderedSlots![i]);
      batch.renderedSlots = slots;
      mesh.count = slots.length;
      batch.visible = false;
      let furBudget = 0;
      const offsets = mesh.geometry.getAttribute(
        'instanceOffset',
      ) as THREE.InstancedBufferAttribute;
      const pigments = mesh.geometry.getAttribute(
        'instancePigment',
      ) as THREE.InstancedBufferAttribute;
      slots.forEach((index, slot) => {
        const state = this.states[index]!;
        if (part.motionTexture) {
          const pose = measureFit
            ? undefined
            : (state.poseOverride?.get(`${part.source.fur ? 'fur' : 'mesh'}:${part.source.id}`) ??
              (!this.paused || state.motion
                ? state.pose?.[
                    state.motion?.kind === 'work'
                      ? state.motion.continuous
                        ? part.workLoopPart
                        : part.workPart
                      : part.motionPart
                  ]
                : undefined));
          if (pose) {
            this.partWorld.multiplyMatrices(state.matrix, pose.world);
            this.partNormal.multiplyMatrices(state.normalMatrix, pose.normalMatrix);
          } else {
            this.partWorld.multiplyMatrices(state.matrix, part.material.uniforms.d!.value.world);
            this.partNormal.multiplyMatrices(
              state.normalMatrix,
              part.material.uniforms.d!.value.normalMatrix,
            );
          }
          const reaction = state.reactionGaze;
          const neutralPose =
            state.poseOverride?.get('mesh:0') ??
            (!this.paused || state.motion ? state.pose?.[0] : undefined);
          const externalClosure = neutralPose?.fields.eyeBlink?.[0];
          const hasExternalBlink = !reaction || externalClosure !== undefined;
          if (
            !measureFit &&
            part.eyeProfile &&
            state.motion?.kind !== 'work' &&
            (part.eyeProfile.blink !== 'external' || hasExternalBlink) &&
            (reaction?.strength ?? 1) > 0 &&
            ((reaction?.frozen ? reaction.x : state.eyes.x) ||
              (reaction?.frozen ? reaction.y : state.eyes.y))
          ) {
            const closure =
              part.eyeProfile.blink === 'external'
                ? (externalClosure ?? 0)
                : eyeClosureFromMorph(
                    pose?.fields.parameters ?? part.source.fields.parameters!,
                    part.eyeProfile.blink,
                  );
            if (reaction) {
              this.reactionEyes.x = reaction.frozen ? reaction.x : state.eyes.x;
              this.reactionEyes.y = reaction.frozen ? reaction.y : state.eyes.y;
              const fields = neutralPose?.fields;
              if (!fields?.gazeNeutralTranslation || !fields.gazeNeutralScale)
                throw Error('Reaction is missing its independent ocular frame');
              this.reactionComposer.writeEyeCorrection(
                this.reactionEyes,
                part.eyeProfile,
                closure,
                reaction.strength,
                fields.gazeNeutralTranslation,
                fields.gazeNeutralScale,
                pose?.world ?? part.material.uniforms.d!.value.world,
                this.eyeWorld,
                this.eyeNormal,
              );
            } else {
              state.eyes.writeCorrection(part.eyeProfile, closure, this.eyeWorld, this.eyeNormal);
            }
            this.partWorld.multiply(this.eyeWorld);
            this.partNormal.multiply(this.eyeNormal);
          }
          mesh.setMatrixAt(slot, this.partWorld);
          const data = part.motionTexture.image.data as Float32Array;
          for (let channel = 0; channel < 12; channel++)
            data[slot * 64 + channel] = this.partNormal.elements[channel]!;
          data.set(pose?.fields.parameters ?? part.source.fields.parameters!, slot * 64 + 12);
          data.set(
            pose?.fields.signatureDeform ?? part.source.fields.signatureDeform!,
            slot * 64 + 16,
          );
          data.set(
            pose?.fields.colorRoughness ?? part.source.fields.colorRoughness!,
            slot * 64 + 20,
          );
          data.set(
            pose?.fields.paletteClosure ?? part.source.fields.paletteClosure!,
            slot * 64 + 24,
          );
          data.set(pose?.fields.referencePose ?? part.source.fields.referencePose!, slot * 64 + 28);
          data.set(pose?.fields.coverage ?? part.source.fields.coverage!, slot * 64 + 32);
          const camera = pose?.fields.camera;
          const cameraOffset = slot * 64 + 36;
          data[cameraOffset] = camera?.[0] ?? 1;
          data[cameraOffset + 1] = camera?.[1] ?? 1;
          data[cameraOffset + 2] = camera?.[2] ?? 0;
          data[cameraOffset + 3] = camera?.[3] ?? (part.source.activity ? 0 : 1);
          batch.visible ||= data[cameraOffset + 3]! > 0;
          data.set(
            pose?.fields.eyeCurveOriginAmount ?? part.source.fields.eyeCurveOriginAmount!,
            slot * 64 + 40,
          );
          data.set(
            pose?.fields.eyeCurveRightWidth ?? part.source.fields.eyeCurveRightWidth!,
            slot * 64 + 44,
          );
          data.set(this.partWorld.elements, slot * 64 + 48);
          if (part.source.fur) {
            const e = this.partWorld.elements;
            const scale = Math.max(
              Math.hypot(e[0]!, e[1]!, e[2]!),
              Math.hypot(e[4]!, e[5]!, e[6]!),
              Math.hypot(e[8]!, e[9]!, e[10]!),
            );
            const projected =
              part.source.fields.fur![1]! *
              part.source.fields.fur![2]! *
              scale *
              Math.abs(fixture.frame.viewProjection[5]!) *
              (camera?.[1] ?? 1) *
              this.backingPixels *
              0.5;
            furBudget = Math.max(
              furBudget,
              Math.min(8192, 160 + projected * projected * 0.027) *
                THREE.MathUtils.clamp((projected - 12) / 48, 0, 1),
            );
          }
        } else {
          mesh.setMatrixAt(slot, state.matrix);
          batch.visible = true;
        }
        if (!offsetsChanged) return;
        offsets.setXY(
          slot,
          ((index % this.cols) - (Math.min(this.count, this.cols) - 1) / 2) * 3.64,
          ((this.rows - 1) / 2 - Math.floor(index / this.cols)) * 3.64,
        );
        const color = state.color;
        if (part.source.colorRole !== 'body') pigments.setXYZ(slot, 1, 1, 1);
        else if (part.source.attachment === 'three_lobe' || part.source.activity === 'computer') {
          // Body attachments and hands may have a different source pigment.
          // Normalize it to the coat so Tuft also matches untouched presets.
          const bodyPaint = this.asset(state.preset)!.source.material.parts[0]!.fields
            .colorRoughness!;
          const handPaint = part.source.fields.colorRoughness!;
          pigments.setXYZ(
            slot,
            (color.r * bodyPaint[0]!) / Math.max(handPaint[0]!, 1e-6),
            (color.g * bodyPaint[1]!) / Math.max(handPaint[1]!, 1e-6),
            (color.b * bodyPaint[2]!) / Math.max(handPaint[2]!, 1e-6),
          );
        } else pigments.setXYZ(slot, color.r, color.g, color.b);
      });
      if (slots.length) {
        mesh.instanceMatrix.clearUpdateRanges();
        mesh.instanceMatrix.addUpdateRange(0, slots.length * 16);
        mesh.instanceMatrix.needsUpdate = true;
      }
      if (part.source.fur && part.motionTexture)
        mesh.geometry.setDrawRange(0, Math.ceil(furBudget) * 12);
      if (slots.length && part.motionTexture) {
        part.motionTexture.clearUpdateRanges();
        // Three's texture ranges are single-row uploads. A lone populated row
        // can replace a capacity-sized upload without adding GL calls; larger
        // batches keep the single whole-image upload rather than one per row.
        if (slots.length === 1 && part.motionTexture.image.height > 1)
          part.motionTexture.addUpdateRange(0, 64);
        part.motionTexture.needsUpdate = true;
      }
      if (offsetsChanged && slots.length) {
        offsets.clearUpdateRanges();
        offsets.addUpdateRange(0, slots.length * 2);
        pigments.clearUpdateRanges();
        pigments.addUpdateRange(0, slots.length * 3);
        offsets.needsUpdate = pigments.needsUpdate = true;
      }
    });
    this.attributesDirty = false;
    this.updateRenderBounds();
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    this.batches.forEach(({ mesh, part, visible }) => {
      mesh.visible = visible && part.depth !== null;
      if (part.depth) mesh.material = part.depth;
    });
    this.renderer.setRenderTarget(this.depthTarget);
    this.renderer.render(this.scene, this.camera);
    const ao = this.occlusion.render(
      this.depthTarget.depthTexture!,
      projection,
      this.depthTarget.width,
      this.depthTarget.height,
      this.renderBounds,
    );
    this.batches.forEach(({ mesh, part, visible }) => {
      mesh.visible = visible;
      mesh.material = part.material;
      part.material.uniforms.ambientOcclusion!.value = ao;
    });
    this.renderer.setRenderTarget(this.colorTarget);
    this.renderer.render(this.scene, this.camera);
    this.updateCrops();
    if (measureFit) {
      // Reference geometry is rendered only to measure its alpha bounds. It
      // must never be delivered as the requested live or held pose, including
      // when every clock is paused and would otherwise schedule no next frame.
      this.fitPasses++;
      if (!this.fitReads.length) this.invalidate();
      return;
    }
    const ratio = this.renderer.getPixelRatio();
    this.renderer.setScissor(
      this.renderBounds.x / ratio,
      this.renderBounds.y / ratio,
      this.renderBounds.z / ratio,
      this.renderBounds.w / ratio,
    );
    this.renderer.setScissorTest(this.colorTarget.scissorTest);
    this.renderer.setRenderTarget(this.outputTarget ?? null);
    this.renderer.render(this.presentScene, this.camera);
    this.renderer.setScissorTest(false);
    this.frames++;
    if (this.host && this.outputTarget) {
      const { __webglFramebuffer: framebuffer } = this.renderer.properties.get(
        this.outputTarget,
      ) as { __webglFramebuffer: WebGLFramebuffer };
      this.host.onFrame({
        framebuffer,
        width: this.outputTarget.width,
        height: this.outputTarget.height,
        columns: Math.min(this.count, this.cols),
        rows: this.rows,
        pixels: this.backingPixels,
        renderedIndices: this.states.flatMap((state, index) =>
          state.rendering === false ? [] : [index],
        ),
      });
    }
    this.onFrame?.();
    let gazeChanged = false;
    for (const state of this.states) {
      if (state.rendering === false) continue;
      const yaw = state.gaze.yaw,
        pitch = state.gaze.pitch,
        eyeX = state.eyes.x,
        eyeY = state.eyes.y;
      state.gaze.advance(frameDelta);
      state.eyes.advance(frameDelta);
      if (state.gazePending) {
        state.gaze.point(state.gazeTarget.x, state.gazeTarget.y);
        if (this.asset(state.preset)?.parts.some((part) => part.eyeProfile))
          state.eyes.point(state.gazeTarget.x, state.gazeTarget.y);
        state.gazePending = false;
      }
      gazeChanged ||=
        yaw !== state.gaze.yaw ||
        pitch !== state.gaze.pitch ||
        state.gaze.moving ||
        eyeX !== state.eyes.x ||
        eyeY !== state.eyes.y ||
        state.eyes.moving;
    }
    if (
      gazeChanged ||
      this.states.some(
        (state) =>
          state.rendering !== false &&
          (state.pointer.moving ||
            (!this.paused && state.entrance && state.entrance.held === undefined)),
      ) ||
      (!this.paused &&
        this.states.some(
          (state) =>
            state.rendering !== false &&
            !state.poseOverride &&
            (!this.asset(state.preset)?.samplers ||
              !state.motion ||
              (state.motion.held === undefined &&
                (state.motion.kind === 'idle' ||
                  state.motion.continuous ||
                  this.time - state.motion.started <
                    this.asset(state.preset)!.samplers![state.motion.kind]!.clip.duration))),
        ))
    )
      this.invalidate(false);
    // A quiescent renderer has no running animation clock. Otherwise the next
    // reaction/work would consume the entire wall-clock gap on its first frame.
    else this.previousTime = 0;
  };
  private cancelFitReads() {
    this.fitGeneration++;
    for (const read of this.fitReads) read.cancel();
    this.fitReads = [];
  }
  private fittedCrop(pixels: Uint8Array, size: number, fallback: number[]) {
    let minX = size,
      minY = size,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        if (pixels[((size - y - 1) * size + x) * 4 + 3]! <= 24) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    if (maxX < minX) return fallback;
    const extent = Math.max(maxX - minX + 1, maxY - minY + 1) * 1.22;
    return [
      (minX + maxX - extent) / (2 * size),
      (minY + maxY - extent) / (2 * size),
      extent / size,
      extent / size,
    ];
  }
  private applyCachedFits() {
    let changed = false;
    const size = this.backingPixels;
    this.states.forEach((state, index) => {
      if (state.rendering === false) return;
      const crop = this.cropCache.get(`${state.preset}:${this.detail}:${size}`);
      if (!crop) return;
      const values = this.fits.image.data as Float32Array;
      if (crop.some((v, channel) => Math.abs(values[index * 4 + channel]! - v) > 1e-7)) {
        values.set(crop, index * 4);
        changed = true;
      }
    });
    if (changed) this.fits.needsUpdate = true;
    this.fitPending = this.states.some(
      (state) =>
        state.rendering !== false && !this.cropCache.has(`${state.preset}:${this.detail}:${size}`),
    );
    this.fitsDirty = this.fitPending;
  }
  private updateCrops() {
    if (!this.fitsDirty || this.fitReads.length) return;
    const size = this.backingPixels;
    const ratio = this.renderer.getPixelRatio();
    const captures = new Map<string, { left: number; bottom: number; fallback: number[] }>();
    this.states.forEach((state, index) => {
      if (state.rendering === false) return;
      const key = `${state.preset}:${this.detail}:${size}`;
      if (this.cropCache.has(key) || captures.has(key)) return;
      const left = Math.round(
        (this.width * ratio) / 2 +
          ((index % this.cols) - Math.min(this.count, this.cols) / 2) * size,
      );
      const top = Math.round(
        (this.height * ratio) / 2 + (Math.floor(index / this.cols) - this.rows / 2) * size,
      );
      captures.set(key, {
        left,
        bottom: this.colorTarget.height - top - size,
        fallback: this.asset(state.preset)!.source.material.crop.slice(),
      });
    });
    if (!captures.size) {
      this.applyCachedFits();
      return;
    }
    if (this.host) {
      // ExpoGL does not provide the web PBO readback operations. Its host keeps
      // the existing synchronous one-time fit, not an exception-based fallback.
      for (const [key, capture] of captures) {
        const pixels = new Uint8Array(size * size * 4);
        this.renderer.readRenderTargetPixels(
          this.colorTarget,
          capture.left,
          capture.bottom,
          size,
          size,
          pixels,
        );
        this.cropCache.set(key, this.fittedCrop(pixels, size, capture.fallback));
      }
      this.applyCachedFits();
      return;
    }
    const generation = this.fitGeneration;
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const { __webglFramebuffer: framebuffer } = this.renderer.properties.get(this.colorTarget) as {
      __webglFramebuffer: WebGLFramebuffer;
    };
    const pending = captures.entries();
    const results: { key: string; crop: number[] }[] = [];
    const drain = async () => {
      for (const [key, capture] of pending) {
        if (this.disposed || generation !== this.fitGeneration) return;
        const read = readPixelsAsync(gl, framebuffer, capture.left, capture.bottom, size, size);
        this.fitReads.push(read);
        try {
          const pixels = await read.promise;
          results.push({ key, crop: this.fittedCrop(pixels, size, capture.fallback) });
        } finally {
          const index = this.fitReads.indexOf(read);
          if (index >= 0) this.fitReads.splice(index, 1);
        }
      }
    };
    // Bound temporary GPU storage to two tiles even for a large cold catalog.
    // Rendering stays suspended so the source framebuffer remains unchanged.
    void Promise.all([drain(), drain()])
      .then(() => {
        if (this.disposed || generation !== this.fitGeneration) return;
        this.fitReads = [];
        for (const { key, crop } of results) this.cropCache.set(key, crop);
        this.applyCachedFits();
        this.invalidate();
      })
      .catch((error: unknown) => {
        if (this.disposed || generation !== this.fitGeneration) return;
        if (gl.isContextLost()) {
          this.onContextLost();
          return;
        }
        this.cancelFitReads();
        this.renderFailure = error instanceof Error ? error : new Error(String(error));
        this.cancelFrame();
        this.raf = 0;
        this.onError?.(this.renderFailure);
      });
  }

  stats() {
    return {
      ready: this.ready,
      surfaceFinish: 'smooth',
      retainedCanvasCulling: true,
      activeAtlasScissor: true,
      asyncFitReadback: !this.host,
      pendingFitReads: this.fitReads.length,
      presentationCapacity: this.presentationCapacity,
      presentationQueued: this.presentationQueued,
      renderFailure: this.renderFailure?.message ?? null,
      renderedPixels: this.renderBounds.z * this.renderBounds.w,
      atlasPixels: this.colorTarget.width * this.colorTarget.height,
      renderBounds: this.renderBounds.toArray(),
      lazyWork: this.lazyWork,
      renderer: 'original-assets-three',
      parity: false,
      missing: [
        'full animation controllers and transitions',
        'cross-phase action entry and interruptions',
        'reaction pointer blending and input arbitration',
        'catalog part mixing beyond the eight presets',
      ],
      presets: [...new Set(this.states.map((state) => state.preset))],
      detail: this.detail,
      motionPresets: [...this.assets]
        .filter(([, asset]) => asset.samplers)
        .map(([, asset]) => asset.source.preset),
      count: this.count,
      renderedInstances: this.states.filter((state) => state.rendering !== false).length,
      frames: this.frames,
      fitPasses: this.fitPasses,
      poseEvaluations: this.poseSharing.evaluations,
      sharedPoseCopies: this.poseSharing.copies,
      suspended: this.hidden() || !this.inViewport || this.contextLost,
      frameRateLimit: this.maxFrameRate === Infinity ? null : this.maxFrameRate,
      observedFrameRate: this.elapsed ? this.timedFrames / this.elapsed : 0,
      columns: this.cols,
      rows: this.rows,
      width: this.width,
      height: this.height,
      requiredHeight: this.rows * this.pixels,
      pixelRatio: this.renderer.getPixelRatio(),
      backingPixelsPerAvatar: this.backingPixels,
      cachedFits: this.cropCache.size,
      cachedAssets: this.assets.size,
      pendingAssets: this.pendingAssets.size,
      poseTextureBytes: [...this.assets.values()].reduce(
        (total, asset) =>
          total +
          asset.parts.reduce(
            (bytes, part) => bytes + (part.motionTexture?.image.data?.byteLength ?? 0),
            0,
          ),
        0,
      ),
      resources: {
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        programs: this.renderer.info.programs?.length,
      },
      states: this.states.map((s, i) => ({
        index: i,
        phase: s.phase,
        motion: s.poseOverride
          ? 'held-pose'
          : this.asset(s.preset)?.samplers
            ? (s.motion?.kind ?? (this.paused ? 'reference' : 'idle'))
            : 'provisional',
        motionTime:
          s.motion?.held ?? (s.motion ? this.time - s.motion.started : this.time + s.phase),
        preset: s.preset,
        renderedParts: this.asset(s.preset)?.source.parts.map((part) => ({
          id: part.id,
          label: part.label,
          colorRole: part.colorRole,
        })),
        pigment: s.color.toArray(),
        look: s.look.toArray(),
        pointer: {
          active: s.pointer.active,
          yaw: s.pointer.yaw,
          pitch: s.pointer.pitch,
        },
        gaze: {
          yaw: s.gaze.yaw,
          pitch: s.gaze.pitch,
          target: s.gazeTarget.toArray(),
        },
        eyes: { x: s.eyes.x, y: s.eyes.y },
      })),
      contexts: this.disposed ? 0 : 1,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    };
  }
  dispose() {
    this.cancelFitReads();
    if (this.disposed) return;
    this.disposed = true;
    this.cancelFrame();
    this.observer?.disconnect();
    this.visibilityObserver?.disconnect();
    this.unsubscribeHost?.();
    if (!this.host) {
      document.removeEventListener('visibilitychange', this.visibilityChanged);
      this.canvas!.removeEventListener('webglcontextlost', this.onContextLost);
      this.canvas!.removeEventListener('webglcontextrestored', this.onContextRestored);
    }
    this.batches.forEach(({ mesh }) => mesh.dispose());
    this.fits.dispose();
    this.cameras.dispose();
    this.assets.forEach((asset) => asset.parts.forEach((part) => part.motionTexture?.dispose()));
    this.retiredAssets.forEach((asset) =>
      asset.parts.forEach((part) => part.motionTexture?.dispose()),
    );
    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.occlusion.dispose();
    this.depthTarget.dispose();
    this.disabledShadow.dispose();
    this.depthMaterials.forEach((m) => m.dispose());
    this.colorTarget.dispose();
    this.outputTarget?.dispose();
    this.presentGeometry.dispose();
    this.presentMaterial.dispose();
    this.renderer.dispose();
    if (!this.host) this.renderer.forceContextLoss();
  }
}
