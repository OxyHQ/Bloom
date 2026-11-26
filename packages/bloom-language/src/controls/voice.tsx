import {
  VoiceControls as BloomVoiceControls,
  type VoiceControlsProps,
  type VoiceState,
} from '@oxy.so/bloom/voice';

import type { Bound } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { VoiceSize } from '../tokens';
import { type ControlRenderer, defineControls } from './draw';
import { product } from './product';

/** The voice session's controls. */
export type VoiceKind = 'voiceControls';

type Slots = 'leading' | 'trailing';
/**
 * Bloom `VoiceControls`' state and handlers (each handler shows its control);
 * `leading` and `trailing` are language children.
 */
export type VoiceControlsOptions = Omit<
  VoiceControlsProps,
  | 'state'
  | 'size'
  | 'disabled'
  | 'className'
  | 'style'
  | 'ref'
  | 'testID'
  | Slots
  | 'muted'
  | 'onMutedChange'
  | 'paused'
  | 'onPausedChange'
> & { readonly [K in Slots]?: Child };

/** Bloom `VoiceControls`: mute, pause, end and type instead. */
export interface VoiceControlsView extends ViewModifiers<VoiceControlsView> {
  muted(value: Bound<VoiceControlsProps, 'muted'>): VoiceControlsView;
  paused(value: Bound<VoiceControlsProps, 'paused'>): VoiceControlsView;
  /** `sm`, `md` or `lg` (the default, or the nearest scope's). */
  size(value: VoiceSize): VoiceControlsView;
  /** Disables every control. */
  disabled(value?: boolean): VoiceControlsView;
}

/** Bloom `VoiceControls` of a session in `state` (`listening` by default, as Bloom's). */
export function VoiceControls(
  state?: VoiceState,
  options: VoiceControlsOptions = {},
): VoiceControlsView {
  return new Node('voiceControls', { state, options }, []);
}

const VOICES: Record<VoiceKind, ControlRenderer> = {
  voiceControls: product(BloomVoiceControls, {
    bindings: { muted: ['muted', 'onMutedChange'], paused: ['paused', 'onPausedChange'] },
    slots: ['leading', 'trailing'],
    own: (d) => ({ size: d.own('size')?.value, disabled: d.own('disabled')?.value }),
  }),
};
defineControls(VOICES);
