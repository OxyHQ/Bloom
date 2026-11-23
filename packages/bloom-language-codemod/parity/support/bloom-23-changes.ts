/**
 * What Bloom 23 changed on its own in components a Bloom 22 region draws.
 *
 * A region that hands a Bloom component a class is drawn, before, with Bloom 22
 * (`native-frames.tsx`, `web-frames.tsx`), and the after side with this
 * checkout's Bloom. Where the two Blooms draw a component differently for a
 * reason of Bloom's own, the difference is not the codemod's. Each such change
 * is listed here with its commit, as the one value it adds (a prop, an
 * attribute or a CSS declaration with exactly that value), and the Bloom 22 tree
 * takes it only where the after tree has it at the same place and the Bloom 22
 * tree has no value there at all. Nothing else is folded: any other difference,
 * or the same key at another value, still fails.
 *
 * The package's own suites fail when a listed change is no longer met, so the
 * list holds only what still differs (`bloom-22` updated to a release that has
 * the change, the entry goes).
 */
type Platform = 'native' | 'web';

export interface Bloom23Change {
  readonly commit: string;
  readonly what: string;
  readonly platform: Platform;
  /** Where the value sits: a native host's prop, a DOM attribute, or a CSS declaration. */
  readonly in: 'props' | 'attributes' | 'css';
  readonly key: string;
  readonly value: unknown;
}

export const BLOOM_23_CHANGES: readonly Bloom23Change[] = [
  {
    commit: '22e4fc8d0',
    what: "The Screen's root view forms a stacking context on Android (collapsable={false}), so a floating header's fade is not clipped",
    platform: 'native',
    in: 'props',
    key: 'collapsable',
    value: false,
  },
  {
    commit: '8ea10f8ac',
    what: 'The surface paint layer is found by its data-bloom-surface-paint attribute, no longer a class',
    platform: 'web',
    in: 'attributes',
    key: 'data-bloom-surface-paint',
    value: '',
  },
  {
    commit: '669dc15a5',
    what: "PressableScale's press feedback runs on Bloom's motion engine, a CSS transition of its scale on the web",
    platform: 'web',
    in: 'css',
    key: 'transition',
    value: 'scale 100ms cubic-bezier(0.455,0.03,0.515,0.955)',
  },
];

const label = (change: Bloom23Change) => `${change.commit} ${change.key}`;

/** The labels of the changes for `platform`, to check each is still met. */
export function bloom23Labels(platform: Platform): string[] {
  return BLOOM_23_CHANGES.filter((c) => c.platform === platform).map(label);
}

type Tree = Record<string, unknown>;

/**
 * The Bloom 22 tree `before` with each listed change of `platform` that the
 * after tree has at the same place, walked together while both have the same
 * children. Each change met is added to `met`.
 */
export function withBloom23Changes(
  before: unknown,
  after: unknown,
  platform: Platform,
  met: Set<string>,
): unknown {
  const changes = BLOOM_23_CHANGES.filter((c) => c.platform === platform);
  const visit = (b: unknown, a: unknown): unknown => {
    if (Array.isArray(b) && Array.isArray(a))
      return b.map((node, i) => (i < a.length ? visit(node, a[i]) : node));
    if (b === null || a === null || typeof b !== 'object' || typeof a !== 'object') return b;
    const node = { ...(b as Tree) };
    const other = a as Tree;
    for (const change of changes) {
      const theirs = other[change.in] as Tree | undefined;
      const ours = node[change.in] as Tree | undefined;
      if (theirs?.[change.key] !== change.value) continue;
      if (ours !== undefined && change.key in ours) continue;
      node[change.in] = Object.fromEntries(
        Object.entries({ ...ours, [change.key]: change.value }).sort(([x], [y]) =>
          x < y ? -1 : x > y ? 1 : 0,
        ),
      );
      met.add(label(change));
    }
    if (Array.isArray(node.children) && Array.isArray(other.children))
      node.children = visit(node.children, other.children);
    return node;
  };
  return visit(before, after);
}
