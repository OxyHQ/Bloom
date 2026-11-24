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
 * tree has no value there at all; or, for a value Bloom changed (`was`), only
 * where the Bloom 22 tree has exactly the old value there. Nothing else is
 * folded: any other difference, or the same key at another value, still fails.
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
  /** The key, or a path into the prop's value (`contentContainerStyle.1.paddingBottom`). */
  readonly key: string;
  readonly value: unknown;
  /** The value Bloom 22 drew there, when Bloom 23 changed it rather than added it. */
  readonly was?: unknown;
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
  // The bottom bar is 62pt (was 58), so a screen's first estimate of a bar's footprint (its height and
  // the 16pt gap) is 78 (was 74), before the bar is measured.
  ...(
    [
      ['bottomOffset', 78, 74],
      ['extraKeyboardSpace', 78, 74],
      ['contentContainerStyle.1.paddingBottom', 94, 90],
    ] as const
  ).map(
    ([key, value, was]): Bloom23Change => ({
      commit: '4de9ab0bc',
      what: "The bottom bar is Apple's 62pt, so the screen's first estimate of its footprint is 78",
      platform: 'native',
      in: 'props',
      key,
      value,
      was,
    }),
  ),
  // A floating header's scroll edge is its own height and a 12pt fade (was a 0.55x tail of the
  // whole header): over a 56pt header, a 68pt box, opaque to 56/68; the fade eases in and out
  // through 0.74 and 0.26 at its thirds (was 0.86 and 0.38 at 0.42 and 0.72).
  ...(
    [
      ['native', 'props', 'style.height', 68, 86.8],
      ...(['247, 235, 240', '31, 3, 29'] as const).map(
        (rgb) =>
          [
            'native',
            'props',
            'style.experimental_backgroundImage',
            `linear-gradient(to bottom, rgba(${rgb}, 1) 0%, rgba(${rgb}, 1) 82.35294117647058%, rgba(${rgb}, 0.74) 88.23529411764706%, rgba(${rgb}, 0.26) 94.11764705882352%, rgba(${rgb}, 0) 100%)`,
            `linear-gradient(to bottom, rgba(${rgb}, 1) 0%, rgba(${rgb}, 1) 64.51612903225806%, rgba(${rgb}, 0.86) 79.41935483870968%, rgba(${rgb}, 0.38) 90.06451612903226%, rgba(${rgb}, 0) 100%)`,
          ] as const,
      ),
      ['web', 'attributes', 'offset', '0.8235294117647058', '0.6451612903225806'],
      ['web', 'attributes', 'offset', '0.8823529411764706', '0.7941935483870968'],
      ['web', 'attributes', 'offset', '0.9411764705882353', '0.9006451612903226'],
      ['web', 'attributes', 'stop-opacity', '0.74', '0.86'],
      ['web', 'attributes', 'stop-opacity', '0.26', '0.38'],
    ] as const
  ).map(
    ([platform, where, key, value, was]): Bloom23Change => ({
      commit: '#874',
      what: "A floating header's scroll edge is the header's own height and a short, full-range fade",
      platform,
      in: where,
      key,
      value,
      was,
    }),
  ),
];

const label = (change: Bloom23Change) => `${change.commit} ${change.key}`;

/** The labels of the changes for `platform`, to check each is still met (one per commit and key). */
export function bloom23Labels(platform: Platform): string[] {
  return [...new Set(BLOOM_23_CHANGES.filter((c) => c.platform === platform).map(label))];
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
      if (change.was !== undefined) {
        // A changed value: the Bloom 22 tree has exactly the old one where the after tree has the new.
        const path = change.key.split('.');
        if (at(theirs, path) !== change.value || at(ours, path) !== change.was) continue;
        node[change.in] = replaced(ours, path, change.value);
        met.add(label(change));
        continue;
      }
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

/** The value at `path` inside `value` (objects and arrays), or undefined. */
function at(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const step of path) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[step];
  }
  return current;
}

/** `value` with `next` at `path`, copying each object or array on the way. */
function replaced(value: unknown, path: readonly string[], next: unknown): Tree {
  const [step, ...rest] = path as [string, ...string[]];
  const copy = (Array.isArray(value) ? [...value] : { ...(value as Tree) }) as Tree;
  copy[step] = rest.length === 0 ? next : replaced(copy[step], rest, next);
  return copy;
}
