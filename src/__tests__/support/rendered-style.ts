/**
 * Reading what actually landed on a rendered node — shared by every suite that
 * asserts the "className lands on the node the parent lays out" rule.
 *
 * Three components had the same two-node defect (`Button`, then `Fab` and
 * `FrostedIconButton`), and asserting it needs the same two things each time:
 * the HOST tree (composites do not appear in `toJSON()`, so a wrapper is only
 * visible there) and a deep flatten of the `style` prop, because react-native-css
 * merges a caller's class in as a `{ $$css: true, className }` descriptor
 * ALONGSIDE the style objects rather than in a prop of its own.
 */
import type { ReactTestRendererJSON } from 'react-test-renderer';

export type StyleEntry = Record<string, unknown>;

export interface HostNode {
  type: string;
  props: Record<string, unknown>;
  children: Array<HostNode | string> | null;
}

/**
 * Deep-flatten an RN `style` prop (nested arrays, `false`/`null` holes) into the
 * list of style objects that actually reached the node.
 */
export function styleEntries(style: unknown, out: StyleEntry[] = []): StyleEntry[] {
  if (!style || typeof style !== 'object') return out;
  if (Array.isArray(style)) {
    for (const entry of style) styleEntries(entry, out);
    return out;
  }
  out.push(style as StyleEntry);
  return out;
}

/** Every style key/value that landed on a node, later entries winning. */
export function resolvedStyle(style: unknown): StyleEntry {
  return Object.assign({}, ...styleEntries(style)) as StyleEntry;
}

/** The class tokens react-native-css accepted for a node, in arrival order. */
export function classNamesOn(style: unknown): string[] {
  return styleEntries(style)
    .filter((entry) => entry.$$css === true && typeof entry.className === 'string')
    .map((entry) => String(entry.className));
}

export function isHostNode(value: unknown): value is HostNode {
  return (
    typeof value === 'object' && value !== null && typeof (value as HostNode).type === 'string'
  );
}

/** Walk the HOST tree (composites are absent from `toJSON()`) for a testID. */
export function findHost(
  node: ReactTestRendererJSON | ReactTestRendererJSON[] | unknown,
  testID: string,
): HostNode | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findHost(child, testID);
      if (hit) return hit;
    }
    return null;
  }
  if (!isHostNode(node)) return null;
  if (node.props.testID === testID) return node;
  return findHost(node.children, testID);
}

/**
 * Every host node in a rendered tree, in document order.
 *
 * The reason to walk `toJSON()` rather than `UNSAFE_root.findAll` is that the
 * latter yields COMPOSITE instances too, so a `memo(fn)` component contributes
 * two matches for one rendered element and every count is silently doubled —
 * which reads as "the component rendered the thing twice", not as an artefact
 * of the query.
 */
export function hostNodes(tree: unknown, out: HostNode[] = []): HostNode[] {
  if (Array.isArray(tree)) {
    for (const child of tree) hostNodes(child, out);
    return out;
  }
  if (!isHostNode(tree)) return out;
  out.push(tree);
  return hostNodes(tree.children, out);
}

/**
 * The host nodes a parent laid out. Callers assert the LENGTH themselves —
 * "exactly one" is the property, and a helper that returned only the first would
 * hide the second.
 */
export function renderedChildren(tree: unknown, hostTestID: string): HostNode[] {
  const host = findHost(tree, hostTestID);
  if (host === null) throw new Error(`no host rendered for testID "${hostTestID}"`);
  return (host.children ?? []).filter(isHostNode);
}
