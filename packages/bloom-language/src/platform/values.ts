import { isNode, type Child, type Node } from '../node';

/** A node's stored modifier values by kind; a later modifier of a kind wins. */
export function valuesOf(node: Node): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const modifier of node.modifiers) {
    values[modifier.kind] = 'value' in modifier ? modifier.value : true;
  }
  return values;
}

/** The nodes among children, in order, through arrays. */
export function nodesOf(children: readonly Child[], out: Node[] = []): Node[] {
  for (const child of children) {
    if (Array.isArray(child)) nodesOf(child, out);
    else if (isNode(child)) out.push(child);
  }
  return out;
}
