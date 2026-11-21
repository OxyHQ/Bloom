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
import type { ControlDraw, ControlRenderer } from './draw';
import { slot } from './product';

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
  return new Node('composerPanel', { prompt, options }, []);
}
/** Bloom `ComposerPill`, writing the prompt the binding holds. */
export function ComposerPill(
  prompt: Binding<string>,
  options: ComposerPillOptions = {},
): ComposerPillView {
  return new Node('composerPill', { prompt, options }, []);
}
export function ComposerPanelStatusTab(
  options: ComposerPanelStatusTabOptions = {},
): ComposerPanelStatusTabView {
  return new Node('composerPanelStatusTab', { options }, []);
}

interface ComposerProps {
  readonly prompt: Binding<string>;
  readonly options: ComposerPanelOptions & ComposerPillOptions;
}

/** A composer's own props: its prompt and its slots drawn. */
function composer(d: ControlDraw): Record<string, unknown> {
  const { prompt, options } = d.node.props as ComposerProps;
  const [value, onValueChange] = prompt;
  return {
    ...options,
    value,
    onValueChange,
    disabled: d.own('disabled')?.value,
    question: slot(d, options.question),
    status: slot(d, options.status),
    emptyAction: slot(d, options.emptyAction),
  };
}

export const COMPOSER_PANELS: Record<ComposerPanelKind, ControlRenderer> = {
  composerPanel: (d) =>
    d.pressAround((props) => d.component(BloomComposerPanel, { ...props, ...composer(d) })),
  composerPill: (d) =>
    d.pressAround((props) =>
      d.component(BloomComposerPill, {
        ...props,
        ...composer(d),
        surface: d.own('surface')?.value,
      }),
    ),
  composerPanelStatusTab: (d) => {
    const { options } = d.node.props as { options: ComposerPanelStatusTabOptions };
    return d.pressAround((props) =>
      d.component(BloomComposerPanelStatusTab, { ...props, ...options }),
    );
  },
};
