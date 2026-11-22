import {
  AiChatAssistantMessage as BloomAiChatAssistantMessage,
  type AiChatAssistantMessageProps,
  AiChatCodePanel as BloomAiChatCodePanel,
  type AiChatCodePanelProps,
  AiChatContainer as BloomAiChatContainer,
  type AiChatContainerProps,
  AiChatGalleryPanel as BloomAiChatGalleryPanel,
  type AiChatGalleryPanelProps,
  type AiChatGeneration,
  AiChatHeader as BloomAiChatHeader,
  AiChatMessageLine as BloomAiChatMessageLine,
  AiChatMobileHeader as BloomAiChatMobileHeader,
  AiChatShell as BloomAiChatShell,
  type AiChatShellProps,
  AiChatThread as BloomAiChatThread,
  type AiChatThreadProps,
  AiChatUserMessage as BloomAiChatUserMessage,
  type AiChatUserMessageProps,
} from '@oxy.so/bloom/ai-chat';
import type { SidebarProps } from '@oxy.so/bloom/sidebar';

import { type Child, Node, type ViewModifiers } from '../node';
import {
  type AiChatLineTone,
  type LengthToken,
  resolveLength,
  type ScrollbarSide,
  type SidebarSurface,
  type SpaceToken,
} from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The AI chat workspace: its shell and container, the thread, its turns and panels. */
export type AiChatKind =
  | 'aiChatShell'
  | 'aiChatContainer'
  | 'aiChatThread'
  | 'aiChatUserMessage'
  | 'aiChatAssistantMessage'
  | 'aiChatMessageLine'
  | 'aiChatHeader'
  | 'aiChatMobileHeader'
  | 'aiChatCodePanel'
  | 'aiChatGalleryPanel';

type Drawn = 'style' | 'testID' | 'children';
type PanelWidth = 'width';

export type AiChatShellOptions = Omit<
  AiChatShellProps,
  | Drawn
  | 'sidebar'
  | 'mobileSidebar'
  | 'panel'
  | 'background'
  | 'sidebarWidth'
  | 'collapsedSidebarWidth'
  | 'defaultPanelWidth'
  | 'minPanelWidth'
  | 'maxPanelWidth'
  | 'sidebarSurface'
  | 'sidebarScrollbarSide'
  | 'surface'
> & {
  /** The sidebar, or a function of Bloom's sidebar props that returns it. */
  readonly sidebar: Child | ((props: SidebarProps) => Child);
  readonly mobileSidebar?: Child;
  /** The side panel at its width. */
  readonly panel?: (width: number | '100%') => Child;
  readonly background?: Child;
  readonly sidebarWidth?: SpaceToken;
  readonly collapsedSidebarWidth?: SpaceToken;
  readonly defaultPanelWidth?: SpaceToken;
  readonly minPanelWidth?: SpaceToken;
  readonly maxPanelWidth?: SpaceToken;
};
export type AiChatContainerOptions = Omit<
  AiChatContainerProps,
  Drawn | 'actions' | 'header' | 'composer' | 'background' | 'surface' | 'floatingChrome'
> & {
  readonly actions?: Child;
  readonly header?: Child;
  readonly composer?: Child;
  readonly background?: Child;
};
export type AiChatThreadOptions = Omit<AiChatThreadProps, Drawn>;
export type AiChatUserMessageOptions = Omit<AiChatUserMessageProps, Drawn | 'bubbleStyle'>;
export type AiChatAssistantMessageOptions = Omit<AiChatAssistantMessageProps, Drawn>;
export type AiChatCodePanelOptions = Omit<
  AiChatCodePanelProps,
  'style' | 'testID' | 'code' | 'browser' | PanelWidth
> & { readonly browser?: Child; readonly width?: LengthToken };
export type AiChatGalleryPanelOptions = Omit<
  AiChatGalleryPanelProps,
  'style' | 'testID' | 'generations' | 'stylePresets' | PanelWidth
> & { readonly stylePresets?: Child; readonly width?: LengthToken };

/** Bloom `AiChatShell`: the sidebar, the chat and its side panel. */
export interface AiChatShellView extends ViewModifiers<AiChatShellView> {
  /** The sidebar's edge: a `card`, `plain` or `docked`. */
  sidebarSurface(value: SidebarSurface): AiChatShellView;
  /** The side the sidebar's web scrollbar is drawn on: `end` or `start`. */
  sidebarScrollbarSide(value: ScrollbarSide): AiChatShellView;
  /** `false` draws the shell without its own surface (on a surface of yours). */
  surface(value?: boolean): AiChatShellView;
}
/** Bloom `AiChatContainer`: the chat's header, its content, the composer under it. */
export interface AiChatContainerView extends ViewModifiers<AiChatContainerView> {
  /** `false` draws the chat without its own surface. */
  surface(value?: boolean): AiChatContainerView;
  /** The header and composer float over the thread. */
  floatingChrome(value?: boolean): AiChatContainerView;
}
/** Bloom `AiChatThread`: the turns, kept at the bottom as they stream. */
export type AiChatThreadView = ViewModifiers<AiChatThreadView>;
/** Bloom `AiChatUserMessage`: what the person wrote, in its bubble. */
export type AiChatUserMessageView = ViewModifiers<AiChatUserMessageView>;
/** Bloom `AiChatAssistantMessage`: the agent's reply, with its feedback row. */
export type AiChatAssistantMessageView = ViewModifiers<AiChatAssistantMessageView>;
/** Bloom `AiChatMessageLine`: one line of a reply. */
export interface AiChatMessageLineView extends ViewModifiers<AiChatMessageLineView> {
  /** `primary` (default) or `secondary` (a thought, a step). */
  tint(value: AiChatLineTone): AiChatMessageLineView;
  /** `false`: the line's text cannot be selected (it can by default). */
  selectable(value: boolean): AiChatMessageLineView;
}
/** Bloom `AiChatHeader`: the chat's header row. */
export type AiChatHeaderView = ViewModifiers<AiChatHeaderView>;
/** Bloom `AiChatMobileHeader`: the chat's header on a phone. */
export type AiChatMobileHeaderView = ViewModifiers<AiChatMobileHeaderView>;
/** Bloom `AiChatCodePanel`: the code a turn changed, and its browser. */
export type AiChatCodePanelView = ViewModifiers<AiChatCodePanelView>;
/** Bloom `AiChatGalleryPanel`: the images a chat generated. */
export type AiChatGalleryPanelView = ViewModifiers<AiChatGalleryPanelView>;

/** Bloom `AiChatShell` around the chat (`content`). */
export function AiChatShell(content: Child, options: AiChatShellOptions): AiChatShellView {
  return new Node('aiChatShell', { options }, [content]);
}
/** Bloom `AiChatContainer` around the chat's content (its thread). */
export function AiChatContainer(
  content: Child,
  options: AiChatContainerOptions = {},
): AiChatContainerView {
  return new Node('aiChatContainer', { options }, [content]);
}
/** Bloom `AiChatThread` of these turns (a list, keyed by `.id()`). */
export function AiChatThread(turns: Child, options: AiChatThreadOptions = {}): AiChatThreadView {
  return new Node('aiChatThread', { options }, [turns]);
}
export function AiChatUserMessage(
  content: Child,
  options: AiChatUserMessageOptions = {},
): AiChatUserMessageView {
  return new Node('aiChatUserMessage', { options }, [content]);
}
export function AiChatAssistantMessage(
  content: Child,
  options: AiChatAssistantMessageOptions = {},
): AiChatAssistantMessageView {
  return new Node('aiChatAssistantMessage', { options }, [content]);
}
/**
 * Bloom `AiChatMessageLine`: a string is the line's text; a view is drawn as a
 * block of the reply (Bloom's `block`), a code block or a quote.
 */
export function AiChatMessageLine(content: string | Child): AiChatMessageLineView {
  return typeof content === 'string'
    ? new Node('aiChatMessageLine', { text: content }, [])
    : new Node('aiChatMessageLine', { text: undefined }, [content]);
}
export function AiChatHeader(content: Child): AiChatHeaderView {
  return new Node('aiChatHeader', {}, [content]);
}
export function AiChatMobileHeader(title: string): AiChatMobileHeaderView {
  return new Node('aiChatMobileHeader', { title }, []);
}
export function AiChatCodePanel(
  code: string,
  options: AiChatCodePanelOptions = {},
): AiChatCodePanelView {
  return new Node('aiChatCodePanel', { code, options }, []);
}
export function AiChatGalleryPanel(
  generations: readonly AiChatGeneration[],
  options: AiChatGalleryPanelOptions = {},
): AiChatGalleryPanelView {
  return new Node('aiChatGalleryPanel', { generations, options }, []);
}

const width = (token: LengthToken | undefined) =>
  token === undefined ? undefined : resolveLength(token);

export const AI_CHATS: Record<AiChatKind, ControlRenderer> = {
  aiChatShell: product(BloomAiChatShell, {
    slots: ['mobileSidebar', 'background'],
    lengths: [
      'sidebarWidth',
      'collapsedSidebarWidth',
      'defaultPanelWidth',
      'minPanelWidth',
      'maxPanelWidth',
    ],
    own: (d) => {
      const { sidebar, panel } = (d.node.props as { options: AiChatShellOptions }).options;
      return {
        sidebar:
          typeof sidebar === 'function'
            ? (props: SidebarProps) => d.render(sidebar(props))
            : d.render(sidebar),
        panel: panel === undefined ? undefined : (w: number | '100%') => d.render(panel(w)),
        sidebarSurface: d.own('sidebarSurface')?.value,
        sidebarScrollbarSide: d.own('sidebarScrollbarSide')?.value,
        surface: d.own('surface')?.value,
      };
    },
  }),
  aiChatContainer: product(BloomAiChatContainer, {
    slots: ['actions', 'header', 'composer', 'background'],
    own: (d) => ({
      surface: d.own('surface')?.value,
      floatingChrome: d.own('floatingChrome')?.value,
    }),
  }),
  aiChatThread: product(BloomAiChatThread),
  aiChatUserMessage: product(BloomAiChatUserMessage),
  aiChatAssistantMessage: product(BloomAiChatAssistantMessage),
  aiChatMessageLine: (d) => {
    const { text } = d.node.props as { text: string | undefined };
    const own = { tone: d.own('tint')?.value, selectable: d.own('selectable')?.value };
    return d.pressAround((props) =>
      text === undefined
        ? d.component(
            BloomAiChatMessageLine,
            { ...props, ...own, block: true },
            d.render(d.node.children[0]),
          )
        : d.component(BloomAiChatMessageLine, { ...props, ...own }, text),
    );
  },
  aiChatHeader: product(BloomAiChatHeader),
  aiChatMobileHeader: product(BloomAiChatMobileHeader),
  aiChatCodePanel: product(BloomAiChatCodePanel, {
    slots: ['browser'],
    own: (d) => ({
      width: width((d.node.props as { options: AiChatCodePanelOptions }).options.width),
    }),
  }),
  aiChatGalleryPanel: product(BloomAiChatGalleryPanel, {
    slots: ['stylePresets'],
    own: (d) => ({
      width: width((d.node.props as { options: AiChatGalleryPanelOptions }).options.width),
    }),
  }),
};
