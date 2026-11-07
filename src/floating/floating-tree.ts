/**
 * Which anchored surfaces were opened from inside which, so a press on a
 * surface opened FROM a panel counts as a press inside that panel.
 *
 * WEB ONLY, like `FloatingPanel`, its one reader. Every surface sits in a portal
 * of its own on `document.body`, so the DOM cannot say that a sub-menu's flyout
 * belongs to the menu it flew out of: the two panels are siblings there. React
 * can, because a portal keeps its place in the component tree, and this context
 * is how a panel hears about the surfaces rendered under it.
 *
 * What it decides is the NON-modal outside press (`FloatingPanel`). A modal
 * surface dismisses through its backdrop, and a surface opened from it mounts
 * later and paints above that backdrop, so a press on it never reaches the
 * backdrop to begin with. A non-modal one listens for `pointerdown` on the
 * document instead and has to be told what is still inside it. Without this a
 * menubar menu, the one non-modal menu, closed on the `pointerdown` of a press
 * on its own sub-menu's row, before the click that chooses the row.
 */
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

/** A surface as its parent sees it: does a press on this node land on it, or on one under it? */
export interface FloatingBranch {
  owns: (target: Node) => boolean;
}

/** What a panel offers the surfaces rendered under it. */
export interface FloatingTree {
  /** Joins a surface to this panel for as long as it is mounted; returns its leave. */
  adopt: (branch: FloatingBranch) => () => void;
}

const FloatingTreeContext = createContext<FloatingTree | null>(null);
FloatingTreeContext.displayName = 'BloomFloatingTreeContext';

export const FloatingTreeProvider = FloatingTreeContext.Provider;

/**
 * A panel's place in the tree: joins `node` to the panel it was opened from,
 * and returns the tree to provide to its own children plus `owns`, which is
 * true for a target inside `node` or inside any surface opened from it, at any
 * depth.
 */
export function useFloatingTree(node: Node | null): {
  tree: FloatingTree;
  owns: (target: Node) => boolean;
} {
  const parent = useContext(FloatingTreeContext);
  const branches = useRef(new Set<FloatingBranch>());
  const nodeRef = useRef(node);
  nodeRef.current = node;

  const value = useMemo(() => {
    const owns = (target: Node): boolean => {
      if (nodeRef.current?.contains(target)) return true;
      for (const branch of branches.current) if (branch.owns(target)) return true;
      return false;
    };
    const tree: FloatingTree = {
      adopt: (branch) => {
        branches.current.add(branch);
        return () => {
          branches.current.delete(branch);
        };
      },
    };
    return { tree, owns };
  }, []);

  // Joined while there is a panel on screen: a surface that renders nothing
  // (closed, or not yet placed) has nothing a press could land on.
  useEffect(() => {
    if (!parent || !node) return undefined;
    return parent.adopt({ owns: value.owns });
  }, [parent, node, value]);

  return value;
}
