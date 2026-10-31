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
