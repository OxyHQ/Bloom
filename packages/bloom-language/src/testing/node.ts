/** The test double's nodes (`@oxy.so/bloom-language/testing`). */

const DATA = Symbol('bloom-language/testing node');

/** What a node of the double holds: its constructor, its arguments and each modifier's last arguments. */
export interface TestNodeData {
  readonly constructorName: string;
  readonly args: readonly unknown[];
  readonly modifiers: ReadonlyMap<string, readonly unknown[]>;
  /** A `view()`'s body, drawn in its place. */
  readonly body?: () => unknown;
}

/** A node of the double: every modifier returns it, keeping its last call's arguments. */
export interface TestNode {
  readonly [DATA]: TestNodeData;
  readonly [modifier: string]: (...args: unknown[]) => TestNode;
}

/** A constructor of the double: the node it makes, drawn by its name. */
export function constructor(name: string): (...args: unknown[]) => TestNode {
  return (...args) => makeNode({ constructorName: name, args, modifiers: new Map() });
}

/** A `view()`'s node: its body, drawn where the node is. */
export function viewNode(name: string, body: () => unknown): TestNode {
  return makeNode({ constructorName: name, args: [], modifiers: new Map(), body });
}

function makeNode(data: TestNodeData & { modifiers: Map<string, readonly unknown[]> }): TestNode {
  const { modifiers } = data;
  {
    const chain: TestNode = new Proxy({} as TestNode, {
      get(_, key) {
        if (key === DATA) return data;
        if (typeof key === 'symbol') return undefined;
        return (...values: unknown[]) => {
          modifiers.set(key, values);
          return chain;
        };
      },
      has: (_, key) => key === DATA,
    });
    return chain;
  }
}

export function isNode(value: unknown): value is TestNode {
  return typeof value === 'object' && value !== null && DATA in value;
}

/** What `node` holds. */
export function nodeData(node: TestNode): TestNodeData {
  return node[DATA];
}
