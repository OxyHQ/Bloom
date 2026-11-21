import {
  ComposerPanel as BloomComposerPanel,
  type ComposerPanelProps,
  ComposerPanelStatusTab as BloomComposerPanelStatusTab,
  type ComposerPanelStatusTabProps,
  ComposerPill as BloomComposerPill,
  type ComposerPillProps,
} from '@oxy.so/bloom/composer-panel';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The agent composer: the two-row panel, the pill and the status tab above it. */
export type ComposerPanelKind = 'composerPanel' | 'composerPill' | 'composerPanelStatusTab';

/** What both composers' options replace: their slots, as language children. */
interface Slots {
  readonly question?: Child;
  readonly status?: Child;
  readonly emptyAction?: Child;
}
type Replaced =
  | 'style'
  | 'testID'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'disabled'
  | 'question'
  | 'status'
  | 'emptyAction';

/** Bloom `ComposerPanel`'s data: its menus, models, voice and handlers; its slots as children. */
export type ComposerPanelOptions = Omit<ComposerPanelProps, Replaced> & Slots;
/** Bloom `ComposerPill`'s data, as the panel's. */
export type ComposerPillOptions = Omit<ComposerPillProps, Replaced | 'surface'> & Slots;
export type ComposerPanelStatusTabOptions = Omit<ComposerPanelStatusTabProps, 'style' | 'testID'>;

/** Bloom `ComposerPanel`: prompt, add menu, permissions, model and effort, voice and send. */
export interface ComposerPanelView extends ViewModifiers<ComposerPanelView> {
  disabled(value?: boolean): ComposerPanelView;
}
/** Bloom `ComposerPill`: the composer in one pill, which grows as it is written in. */
export interface ComposerPillView extends ViewModifiers<ComposerPillView> {
  disabled(value?: boolean): ComposerPillView;
  /** `false` draws it without its own surface (on a surface of yours). */
  surface(value?: boolean): ComposerPillView;
}
/** Bloom `ComposerPanelStatusTab`: the branch, project and context above the panel. */
export type ComposerPanelStatusTabView = ViewModifiers<ComposerPanelStatusTabView>;

/** Bloom `ComposerPanel`, writing the prompt the binding holds. */
export function ComposerPanel(
  prompt: Binding<string>,
  options: ComposerPanelOptions = {},
): ComposerPanelView {
  return new Node('composerPanel', { binding: prompt, options }, []);
}
/** Bloom `ComposerPill`, writing the prompt the binding holds. */
export function ComposerPill(
  prompt: Binding<string>,
  options: ComposerPillOptions = {},
): ComposerPillView {
  return new Node('composerPill', { binding: prompt, options }, []);
}
export function ComposerPanelStatusTab(
  options: ComposerPanelStatusTabOptions = {},
): ComposerPanelStatusTabView {
  return new Node('composerPanelStatusTab', { options }, []);
}

const composer = {
  binding: ['value', 'onValueChange'],
  slots: ['question', 'status', 'emptyAction'],
} as const;

export const COMPOSER_PANELS: Record<ComposerPanelKind, ControlRenderer> = {
  composerPanel: product(BloomComposerPanel, {
    ...composer,
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  composerPill: product(BloomComposerPill, {
    ...composer,
    own: (d) => ({ disabled: d.own('disabled')?.value, surface: d.own('surface')?.value }),
  }),
  composerPanelStatusTab: product(BloomComposerPanelStatusTab),
};
