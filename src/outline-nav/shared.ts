/**
 * Turning a flat list of headings into the tree a screen reader needs, and
 * deciding where the reader is in it.
 *
 * Both are pure and both are the part a render tree cannot show you: a list
 * that is visually indented and structurally flat looks identical to a correctly
 * nested one, and a progress bar reading the wrong index is still a progress
 * bar.
 */
import type { OutlineHeading } from './types';

/** One heading with whatever sits under it. */
export interface OutlineNode {
  heading: OutlineHeading;
  children: OutlineNode[];
}

/**
 * Nest the headings by their levels.
 *
 * Levels SKIP in real documents (1, 3, 3 is ordinary), so a node's parent is
 * the nearest preceding heading with a SMALLER level — not the one exactly one
 * level up. A document that opens at level 3 and later has a level 1 gets two
 * roots, in order, rather than a lost subtree.
 */
export function buildOutlineTree(headings: ReadonlyArray<OutlineHeading>): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  for (const heading of headings) {
    const node: OutlineNode = { heading, children: [] };
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top !== undefined && top.heading.level < heading.level) break;
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent === undefined) roots.push(node);
    else parent.children.push(node);
    stack.push(node);
  }
  return roots;
}

/** The headings `compact` draws: everything down to `maxLevel`, in order. */
export function compactHeadings(
  headings: ReadonlyArray<OutlineHeading>,
  maxLevel: number,
): ReadonlyArray<OutlineHeading> {
  return headings.filter((heading) => heading.level <= maxLevel);
}

/**
 * Where the reader is, 0 to 1, from the active heading's position.
 *
 * The LAST heading is 1 and the first is `1/n`, not 0: a reader who has reached
 * the first heading has read something. An empty outline, or one with no active
 * heading, is 0 — the honest answer, not a guess.
 */
export function outlineProgress(
  headings: ReadonlyArray<OutlineHeading>,
  activeId: string | undefined,
): number {
  if (headings.length === 0 || activeId === undefined) return 0;
  const index = headings.findIndex((heading) => heading.id === activeId);
  if (index < 0) return 0;
  return (index + 1) / headings.length;
}
