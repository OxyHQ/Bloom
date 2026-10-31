/** Internal transport contract; character validation and playback stay in the shared engine. */
export type RenderValue = {
  character: unknown;
  paused?: boolean;
  portrait?: boolean;
  reduced: boolean;
  previewPart?: 'eyes';
  interactive?: boolean;
  reactionKey?: string | number;
  workingKey?: string | number;
  entranceKey?: string | number;
  workingCycles?: number;
};
export type Capabilities = {
  key: string;
  available: Record<string, boolean>;
  selected: Record<string, string>;
};
export type Recipe = { preset: string; color?: string; capabilities: Capabilities };
export type SlotState = {
  props: RenderValue;
  ready: boolean;
  visible: boolean;
  dirty: boolean;
  painted: boolean;
};
export type SlotController = {
  update(
    value: RenderValue,
    recipe: Recipe,
    isCurrent?: () => boolean,
    superseded?: Promise<void>,
  ): Promise<void>;
  setPresentation(value: RenderValue): void;
  dispose?(): void;
};
export type AvatarController = {
  update(value: RenderValue): void | Promise<void>;
  dispose(): void;
};
export type Output = {
  framebuffer: { id: number };
  width: number;
  height: number;
  columns: number;
  rows: number;
  pixels: number;
  renderedIndices: readonly number[];
};
export type Engine = {
  loaded: Promise<void>;
  setCount(count: number): void;
  setSize(size: number): Promise<void>;
  setPreset(index: number, preset: string, isCurrent?: () => boolean): Promise<void>;
  getInstancePreset(index: number): string | undefined;
  hasPreset(preset: string): boolean;
  cancelPresetChange(index: number): void;
  resetAppearance(index: number): void;
  idle(index: number): void;
  setWander(index: number, value: boolean): void;
  setGaze(index: number, x: number, y: number): void;
  setInstanceRendering(index: number, value: boolean): void;
  setInstancePaused(index: number, value: boolean): void;
  beginPointer(x: number, y: number): number | null;
  point(x: number, y: number): void;
  endPointer(x?: number, y?: number): void;
  react(index: number): void;
  dispose(): void;
};
export type EngineHost = {
  context: WebGL2RenderingContext;
  getSize(): { width: number; height: number; pixelRatio: number };
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(id: number): void;
  isHidden(): boolean;
  subscribe(events: {
    resize(): void;
    visibility(): void;
    contextLost(): void;
    contextRestored(): void;
  }): () => void;
  onFrame(output: Output): void;
};
export type Runtime = {
  AuthoredAvatarEngine: new (
    canvas: null,
    options: {
      host: EngineHost;
      count: number;
      size: number;
      preset: string;
      lazyWork: boolean;
      resolveAsset: unknown;
    },
  ) => Engine;
  createCatalogMotion: unknown;
  createCatalogAssetResolver(motion: unknown): unknown;
  resolveCompleteEditorRecipe(value: RenderValue): Recipe;
  avatarPresentationFrozen(value: RenderValue): boolean;
  createAvatarReconciler(
    initial: RenderValue,
    slot: SlotController & { dispose(): void },
    callbacks: {
      resolveRecipe(value: RenderValue): Recipe;
      initialRecipe?: Recipe;
      onCapabilities?(value: Capabilities): void;
      onError(): void;
      onDispose?(): void;
    },
  ): AvatarController;
  createAvatarSlotController(
    engine: Engine,
    index: number,
    state: SlotState,
    initial: Recipe,
    host: {
      isDisposed(): boolean;
      wait<T>(promise: Promise<T>): Promise<T>;
      dispose(): void;
    },
  ): SlotController;
};
export type NativeBridge = {
  createContext(): Promise<number>;
  destroyContext(id: number): Promise<void>;
  multisampleStorage(
    id: number,
    target: number,
    samples: number,
    format: number,
    width: number,
    height: number,
  ): void;
  present(id: number, framebuffer: number, tiles: number[][]): Promise<number[]>;
  snapshot(surfaceId: number): Promise<string | null>;
  stats(): {
    contexts: number;
    views: {
      id: number;
      width: number;
      height: number;
      visible: boolean;
      presentedFrames: number;
    }[];
  };
};
export type ExpoContext = WebGL2RenderingContext & { contextId: number; flushEXP(): void };
