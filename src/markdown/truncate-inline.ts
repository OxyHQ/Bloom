import type { MarkdownInline } from './types';

/** Visible Unicode code points; Markdown markers and link destinations cost nothing. */
export function inlineMarkdownTextLength(nodes: readonly MarkdownInline[]): number {
  return nodes.reduce((length, node) => {
    if (node.type === 'break') return length + 1;
    if ('value' in node) return length + Array.from(node.value).length;
    return length + inlineMarkdownTextLength(node.children);
  }, 0);
}

export interface InlineMarkdownTruncation {
  nodes: MarkdownInline[];
  isTruncated: boolean;
}

/**
 * Retain at most maxChars visible code points, then append one ellipsis inside
 * the final retained style/link. Link URLs and raw labels remain intact. Never
 * mutates the input tree. Non-positive/NaN limits retain only the ellipsis;
 * Infinity retains everything. Empty input never produces an ellipsis.
 */
export function truncateInlineMarkdown(
  nodes: readonly MarkdownInline[],
  maxChars: number,
): InlineMarkdownTruncation {
  let remaining = Number.isNaN(maxChars) ? 0 : Math.max(0, Math.floor(maxChars));
  if (inlineMarkdownTextLength(nodes) <= remaining) {
    return { nodes: [...nodes], isTruncated: false };
  }
  const take = (list: readonly MarkdownInline[]): MarkdownInline[] => {
    const result: MarkdownInline[] = [];
    for (const node of list) {
      if (remaining <= 0) break;
      if (node.type === 'break') {
        result.push(node);
        remaining -= 1;
      } else if ('value' in node) {
        const points = Array.from(node.value);
        const value = points.slice(0, remaining).join('');
        remaining -= Math.min(points.length, remaining);
        result.push({ ...node, value });
      } else {
        result.push({ ...node, children: take(node.children) });
      }
    }
    return result;
  };
  const appendEllipsis = (list: MarkdownInline[]): MarkdownInline[] => {
    const last = list[list.length - 1];
    if (!last || last.type === 'break') return [...list, { type: 'text', value: '…' }];
    const tail: MarkdownInline =
      'value' in last
        ? { ...last, value: `${last.value}…` }
        : { ...last, children: appendEllipsis(last.children) };
    return [...list.slice(0, -1), tail];
  };
  return { nodes: appendEllipsis(take(nodes)), isTruncated: true };
}
