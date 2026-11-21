import { createElement, type ReactElement } from 'react';
import {
  Code as BloomCode,
  CodeBlock as BloomCodeBlock,
  CodeLines as BloomCodeLines,
  Pre as BloomPre,
  type CodeBlockLabels,
  type CodeLanguage,
  type PreProps,
} from '@oxy.so/bloom/code';

import { Node, type Child, type ViewModifiers } from '../node';
import type { CodeLinesSize } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** Inline monospace, preformatted text, numbered lines and code cards (Bloom `code`). */
export type CodeKind = 'code' | 'pre' | 'codeLines' | 'codeBlock';

interface Lines<Self> {
  /** Its language: JavaScript and TypeScript (`js`, `jsx`, `ts`, `tsx`) are highlighted. */
  language(value: CodeLanguage): Self;
  /** Line numbers in a gutter. */
  lineNumbers(value?: boolean): Self;
}
interface NumberedLines<Self> extends Lines<Self> {
  /** Lines marked as added, removed or highlighted (`+3`, `-4`, `5`). */
  highlight(value: readonly string[]): Self;
  /** Long lines wrap (they scroll sideways by default). */
  wrap(value?: boolean): Self;
}

/** Bloom `Code`: inline monospace. */
export type CodeView = ViewModifiers<CodeView>;
/** Bloom `Pre`: preformatted text in its well. */
export type PreView = ViewModifiers<PreView> & Lines<PreView>;
/** Bloom `CodeLines`: numbered, highlighted lines. */
export interface CodeLinesView extends ViewModifiers<CodeLinesView>, NumberedLines<CodeLinesView> {
  size(value: CodeLinesSize): CodeLinesView;
}
/** Bloom `CodeBlock`: a code card with a header, a copy button and its lines. */
export interface CodeBlockView extends ViewModifiers<CodeBlockView>, NumberedLines<CodeBlockView> {
  /** The header's language name, in place of the language's own. */
  languageLabel(value: string): CodeBlockView;
  /** The header's file name. */
  filename(value: string): CodeBlockView;
  /** The header's change counts. */
  diff(additions: number, deletions: number): CodeBlockView;
  /** The header's copy button (shown by default). */
  copyable(value: boolean): CodeBlockView;
  /** What copying does (the clipboard by default). */
  onCopy(value: (code: string) => void | Promise<void>): CodeBlockView;
  /** What else sits in the header, before the copy button. */
  headerContent(value: Child): CodeBlockView;
  labels(value: CodeBlockLabels): CodeBlockView;
}

/** Bloom `Code`: `text` in monospace. */
export function Code(text: string): CodeView {
  return new Node('code', { code: text }, []);
}
/** Bloom `Pre`: `code` as it is written. */
export function Pre(code: string): PreView {
  return new Node('pre', { code }, []);
}
/** Bloom `CodeLines`: `code`, a line each. */
export function CodeLines(code: string): CodeLinesView {
  return new Node('codeLines', { code }, []);
}
/** Bloom `CodeBlock`: `code` in a card. */
export function CodeBlock(code: string): CodeBlockView {
  return new Node('codeBlock', { code }, []);
}

/** Bloom `Pre` with the view's box as its well (`containerStyle`), as an app writes it. */
function PreWell({ style, ...props }: PreProps): ReactElement {
  return createElement(BloomPre, { ...props, containerStyle: style });
}

const code = (d: ControlDraw) => (d.node.props as { code: string }).code;

function lines(d: ControlDraw): Record<string, unknown> {
  const props = d.props();
  Object.assign(props, {
    code: code(d),
    language: d.own('language')?.value,
    highlight: d.own('highlight')?.value,
    lineNumbers: d.own('lineNumbers')?.value,
    wrap: d.own('wrap')?.value,
  });
  return props;
}

export const CODES: Record<CodeKind, ControlRenderer> = {
  code: (d) => d.component(BloomCode, d.props(), code(d)),
  pre: (d) => {
    const props = d.props();
    props.language = d.own('language')?.value;
    props.lineNumbers = d.own('lineNumbers')?.value;
    return d.component(PreWell, props, code(d));
  },
  codeLines: (d) => {
    const props = lines(d);
    props.size = d.own('size')?.value;
    return d.component(BloomCodeLines, props);
  },
  codeBlock: (d) => {
    const props = lines(d);
    const diff = d.own('diff')?.value;
    const accessory = d.own('headerContent')?.value;
    Object.assign(props, {
      languageLabel: d.own('languageLabel')?.value,
      filename: d.own('filename')?.value,
      copyable: d.own('copyable')?.value,
      onCopy: d.own('onCopy')?.value,
      headerAccessory: accessory === undefined ? undefined : d.render(accessory),
      labels: d.own('labels')?.value,
    });
    if (diff !== undefined) [props.additions, props.deletions] = diff;
    return d.component(BloomCodeBlock, props);
  },
};
