import type { AuthoredAvatarEngine } from './avatar/authored-engine';
import type { EditorRenderProps, EditorRecipe } from './avatar-contract';

export const avatarPresentationFrozen = (props: EditorRenderProps) =>
  !!(props.paused || props.portrait || props.reduced);

/** Presentation belongs to the host: ready means the slot can be copied, while
 * painted changes only after its destination actually presents the image. */
export type AvatarSlotState = {
  props: EditorRenderProps;
  ready: boolean;
  visible: boolean;
  dirty: boolean;
  painted: boolean;
};

type SlotEngine = Pick<
  AuthoredAvatarEngine,
  | 'prepareWork'
  | 'setPreset'
  | 'idle'
  | 'setWander'
  | 'setGaze'
  | 'setColor'
  | 'clearColor'
  | 'work'
  | 'entrance'
  | 'react'
  | 'setInstancePaused'
  | 'setInstanceRendering'
>;

/** The host initializes/recycles the slot and owns its lifetime. Both browser
 * canvases and native surfaces then use this same action and recipe controller. */
export function createAvatarSlotController(
  engine: SlotEngine,
  index: number,
  state: AvatarSlotState,
  initialRecipe: EditorRecipe,
  host: {
    isDisposed(): boolean;
    wait<T>(promise: Promise<T>): Promise<T>;
    onPresentation?(props: EditorRenderProps): void;
    dispose(): void;
  },
) {
  let currentPreset = initialRecipe.preset;
  let currentColor: string | undefined;
  let previous = state.props;
  let presentation = state.props;
  const applyPresentation = () => {
    state.props = presentation;
    host.onPresentation?.(presentation);
    engine.setInstancePaused(index, avatarPresentationFrozen(presentation) || !state.visible);
    engine.setInstanceRendering(
      index,
      state.visible && (!avatarPresentationFrozen(presentation) || state.dirty || !state.painted),
    );
  };
  const setPresentation = (props: EditorRenderProps) => {
    if (host.isDisposed()) return;
    presentation = props;
    applyPresentation();
  };
  const update = async (
    props: EditorRenderProps,
    next: EditorRecipe,
    isCurrent = () => true,
    superseded?: Promise<void>,
  ) => {
    if (host.isDisposed()) return;
    setPresentation(props);
    const startWork = props.workingKey !== previous.workingKey && props.workingKey !== undefined;
    let workPrepared = false;
    // Preparation may populate the shared cache, but a newer character or
    // action must not wait behind an optional activity's network request.
    const prepareWork = () => {
      const prepared = host.wait(engine.prepareWork(index));
      return superseded ? Promise.race([prepared, superseded.then(() => false)]) : prepared;
    };
    try {
      if (startWork && currentPreset === next.preset) {
        workPrepared = await prepareWork();
        if (host.isDisposed() || !workPrepared || !isCurrent()) return;
      }
      state.ready = false;
      if (currentPreset !== next.preset) {
        await host.wait(engine.setPreset(index, next.preset));
        if (host.isDisposed()) return;
        currentPreset = next.preset;
        engine.idle(index);
        engine.setWander(index, true);
        engine.setGaze(index, 0.5, 0.5);
      }
      if (!isCurrent()) {
        state.ready = true;
        applyPresentation();
        return;
      }
      if (currentColor !== next.color) {
        if (next.color) engine.setColor(index, next.color);
        else engine.clearColor(index);
        currentColor = next.color;
      }
      if (startWork) {
        if (!workPrepared) workPrepared = await prepareWork();
        if (host.isDisposed()) return;
        if (!workPrepared || !isCurrent()) {
          state.ready = true;
          applyPresentation();
          return;
        }
        engine.work(index, false, props.workingCycles);
      }
      if (
        props.entranceKey !== previous.entranceKey &&
        props.entranceKey !== undefined &&
        !avatarPresentationFrozen(presentation)
      )
        engine.entrance(index);
      if (props.reactionKey !== previous.reactionKey && props.reactionKey !== undefined)
        engine.react(index);
      previous = props;
      state.ready = state.dirty = true;
      applyPresentation();
    } catch (error) {
      host.dispose();
      throw error;
    }
  };
  return { update, setPresentation };
}

/** Serialize recipe commits while applying presentation constraints immediately.
 * Both hosts use the same latest-intent and cancellation boundary. */
export function createAvatarReconciler(
  initial: EditorRenderProps,
  slot: ReturnType<typeof createAvatarSlotController> & { dispose(): void },
  callbacks: {
    resolveRecipe(props: EditorRenderProps): EditorRecipe;
    initialRecipe?: EditorRecipe;
    onCapabilities?(value: EditorRecipe['capabilities']): void;
    onError(): void;
    onDispose?(): void;
  },
) {
  let latest = initial;
  let applied = initial;
  let disposed = false;
  let running: Promise<void> | undefined;
  let supersedeUpdate: (() => void) | undefined;
  callbacks.onCapabilities?.(
    (callbacks.initialRecipe ?? callbacks.resolveRecipe(initial)).capabilities,
  );
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    supersedeUpdate?.();
    callbacks.onDispose?.();
    slot.dispose();
  };
  const reconcile = async () => {
    while (!disposed && applied !== latest) {
      const props = latest;
      const next = callbacks.resolveRecipe(props);
      let supersede!: () => void;
      const superseded = new Promise<void>((resolve) => {
        supersede = resolve;
      });
      supersedeUpdate = supersede;
      await slot.update(props, next, () => !disposed && latest === props, superseded);
      if (supersedeUpdate === supersede) supersedeUpdate = undefined;
      if (!disposed && latest === props) callbacks.onCapabilities?.(next.capabilities);
      applied = props;
    }
  };
  const drain = async () => {
    try {
      // Even a no-op reconciliation yields a completion microtask. An update
      // arriving after its loop exits must join this drain, rather than being
      // stranded behind a still-truthy promise which is already completing.
      do {
        await reconcile();
      } while (!disposed && applied !== latest);
    } catch {
      if (!disposed) {
        dispose();
        callbacks.onError();
      }
    } finally {
      running = undefined;
    }
  };
  return {
    update(props: EditorRenderProps) {
      if (disposed) return;
      const changed = latest !== props;
      latest = props;
      if (changed) supersedeUpdate?.();
      slot.setPresentation(props);
      if (!running) running = drain();
      return running;
    },
    dispose,
  };
}
