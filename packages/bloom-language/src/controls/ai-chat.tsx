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
import { type AiChatLineTone, type LengthToken, resolveLength, type SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length, slot } from './product';

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
  Drawn | 'actions' | 'header' | 'composer' | 'background'
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
export type AiChatShellView = ViewModifiers<AiChatShellView>;
/** Bloom `AiChatContainer`: the chat's header, its content, the composer under it. */
export type AiChatContainerView = ViewModifiers<AiChatContainerView>;
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

const optionsOf = <O,>(d: ControlDraw) => (d.node.props as { options: O }).options;
const width = (token: LengthToken | undefined) =>
  token === undefined ? undefined : resolveLength(token);

/**
 * A component drawn around the node's content, with its options as props. A
 * list of content (a reply's lines, a thread's turns) is its children as
 * Bloom takes them: one child each, keyed by `.id()`.
 */
function around(host: unknown, own: (d: ControlDraw) => Record<string, unknown>): ControlRenderer {
  return (d) =>
    d.pressAround((props) =>
      d.component(host, { ...props, ...own(d) }, d.render(d.node.children[0])),
    );
}

export const AI_CHATS: Record<AiChatKind, ControlRenderer> = {
  aiChatShell: around(BloomAiChatShell, (d) => {
    const options = optionsOf<AiChatShellOptions>(d);
    const { sidebar, panel } = options;
    return {
      ...options,
      sidebar:
        typeof sidebar === 'function'
          ? (props: SidebarProps) => d.render(sidebar(props))
          : d.render(sidebar),
      mobileSidebar: slot(d, options.mobileSidebar),
      panel: panel === undefined ? undefined : (w: number | '100%') => d.render(panel(w)),
      background: slot(d, options.background),
      sidebarWidth: length(options.sidebarWidth),
      collapsedSidebarWidth: length(options.collapsedSidebarWidth),
      defaultPanelWidth: length(options.defaultPanelWidth),
      minPanelWidth: length(options.minPanelWidth),
      maxPanelWidth: length(options.maxPanelWidth),
    };
  }),
  aiChatContainer: around(BloomAiChatContainer, (d) => {
    const options = optionsOf<AiChatContainerOptions>(d);
    return {
      ...options,
      actions: slot(d, options.actions),
      header: slot(d, options.header),
      composer: slot(d, options.composer),
      background: slot(d, options.background),
    };
  }),
  aiChatThread: around(BloomAiChatThread, optionsOf),
  aiChatUserMessage: around(BloomAiChatUserMessage, optionsOf),
  aiChatAssistantMessage: around(BloomAiChatAssistantMessage, optionsOf),
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
  aiChatHeader: around(BloomAiChatHeader, () => ({})),
  aiChatMobileHeader: (d) =>
    d.pressAround((props) =>
      d.component(BloomAiChatMobileHeader, {
        ...props,
        title: (d.node.props as { title: string }).title,
      }),
    ),
  aiChatCodePanel: (d) => {
    const { code, options } = d.node.props as { code: string; options: AiChatCodePanelOptions };
    return d.pressAround((props) =>
      d.component(BloomAiChatCodePanel, {
        ...props,
        ...options,
        code,
        browser: slot(d, options.browser),
        width: width(options.width),
      }),
    );
  },
  aiChatGalleryPanel: (d) => {
    const { generations, options } = d.node.props as {
      generations: readonly AiChatGeneration[];
      options: AiChatGalleryPanelOptions;
    };
    return d.pressAround((props) =>
      d.component(BloomAiChatGalleryPanel, {
        ...props,
        ...options,
        generations,
        stylePresets: slot(d, options.stylePresets),
        width: width(options.width),
      }),
    );
  },
};
