import {
  InlineMarkdown as BloomInlineMarkdown,
  Markdown as BloomMarkdown,
  type InlineMarkdownLink,
  type MarkdownInline,
} from '@oxy.so/bloom/markdown';

import { Node, type Child, type ViewModifiers } from '../node';
import type { MarkdownSize } from '../tokens';
import type { ControlRenderer } from './draw';

/** Markdown in Bloom's type ramp, built for text that arrives token by token (Bloom `markdown`). */
export type MarkdownKind = 'markdown' | 'inlineMarkdown';

/**
 * Bloom `Markdown`: headings, lists, quotes, tables, links and code. Inline
 * markdown inside a line is `InlineMarkdown`, or the language's own nested
 * `Text` spans.
 */
export interface MarkdownView extends ViewModifiers<MarkdownView> {
  /** The text is still arriving: an unclosed span or block is drawn as it will close. */
  streaming(value?: boolean): MarkdownView;
  /** The ramp it is set in: `sm`, `md` (default) or `lg`. */
  size(value: MarkdownSize): MarkdownView;
  /** What a link does (opened outside the app by default). */
  onLinkPress(value: (url: string) => void): MarkdownView;
  /** A code block of your own, in place of Bloom's code card. */
  codeBlock(value: (code: string, language: string | undefined) => Child): MarkdownView;
}

/** Bloom `InlineMarkdown`: emphasis, code and links inside a line, a run of a `Text`. */
export interface InlineMarkdownView extends ViewModifiers<InlineMarkdownView> {
  /** The text is still arriving: an unclosed span is drawn as it will close. */
  streaming(value?: boolean): InlineMarkdownView;
  /** What a link does (opened outside the app by default). */
  onLinkPress(value: (url: string) => void): InlineMarkdownView;
  /** A view of your own for each plain run (mentions, tags); not inside links or code. */
  plainRun(value: (text: string) => Child): InlineMarkdownView;
  /** A link of your own; `undefined` keeps Bloom's. */
  linkView(value: (link: InlineMarkdownLink) => Child | undefined): InlineMarkdownView;
  /** What follows the runs, in the line (a "Read more"). */
  suffix(value: Child): InlineMarkdownView;
}

/**
 * Bloom `InlineMarkdown`: `source` (or Bloom's parsed runs) as spans, inside a
 * `Text`: `Text(InlineMarkdown(reply.summary))`.
 */
export function InlineMarkdown(source: string | readonly MarkdownInline[]): InlineMarkdownView {
  return new Node('inlineMarkdown', { source }, []);
}

/** Bloom `Markdown`: `source` as blocks. */
export function Markdown(source: string): MarkdownView {
  return new Node('markdown', { source }, []);
}

export const MARKDOWN: Record<MarkdownKind, ControlRenderer> = {
  markdown: (d) => {
    const props = d.props();
    const codeBlock = d.own('codeBlock')?.value;
    Object.assign(props, {
      streaming: d.own('streaming')?.value,
      size: d.own('size')?.value,
      onLinkPress: d.own('onLinkPress')?.value,
      renderCodeBlock:
        codeBlock === undefined
          ? undefined
          : (code: string, language?: string) => d.render(codeBlock(code, language)),
    });
    return d.component(BloomMarkdown, props, (d.node.props as { source: string }).source);
  },
  inlineMarkdown: (d) => {
    const { source } = d.node.props as { source: string | readonly MarkdownInline[] };
    const plainRun = d.own('plainRun')?.value;
    const linkView = d.own('linkView')?.value;
    const suffix = d.own('suffix')?.value as Child | undefined;
    const props = d.props();
    Object.assign(props, typeof source === 'string' ? { source } : { nodes: source }, {
      streaming: d.own('streaming')?.value,
      onLinkPress: d.own('onLinkPress')?.value,
      renderText: plainRun === undefined ? undefined : (text: string) => d.render(plainRun(text)),
      renderLink:
        linkView === undefined
          ? undefined
          : (link: InlineMarkdownLink) => {
              const view = linkView(link);
              return view === undefined ? undefined : d.render(view);
            },
      suffix: suffix === undefined ? undefined : d.render(suffix),
    });
    return d.component(BloomInlineMarkdown, props);
  },
};
