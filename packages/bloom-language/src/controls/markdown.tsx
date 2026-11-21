import { Markdown as BloomMarkdown } from '@oxy.so/bloom/markdown';

import { Node, type Child, type ViewModifiers } from '../node';
import type { MarkdownSize } from '../tokens';
import type { ControlRenderer } from './draw';

/** Markdown in Bloom's type ramp, built for text that arrives token by token (Bloom `markdown`). */
export type MarkdownKind = 'markdown';

/**
 * Bloom `Markdown`: headings, lists, quotes, tables, links and code. Inline
 * markdown inside a line is the language's own: nested `Text` spans.
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
};
