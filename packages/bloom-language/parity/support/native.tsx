/**
 * Native parity: a language node and the Bloom element it stands for, each
 * mounted under Bloom's real provider, compared as committed host trees.
 *
 * A host is compared on its type, every prop (styles flattened, so an array
 * and the object it merges to are the same paint; handlers by presence), and
 * its children in order. Nothing is allowed to differ.
 */
import { isValidElement, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import TestRenderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { BloomThemeProvider } from '@oxy.so/bloom/theme';
import { PortalOutlet, PortalProvider } from '@oxy.so/bloom/portal';

import type { ParityCase, Scheme } from './cases';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface HostTree {
  type: string;
  props: Record<string, unknown>;
  children: (HostTree | string)[];
}

/** React's `useId` counts across roots; an id is compared by its order in the tree, not its count. */
const REACT_ID = /_r_[0-9a-z]+_|(?<=[-_:«#])r[0-9a-z]+(?=[-_:»)]|$)/g;
let ids: Map<string, string> = new Map();

function value(input: unknown): unknown {
  if (typeof input === 'function') return '[function]';
  if (typeof input === 'string')
    return input.replace(REACT_ID, (id) => {
      let seen = ids.get(id);
      if (seen === undefined) {
        seen = `id${ids.size}`;
        ids.set(id, seen);
      }
      return seen;
    });
  if (Array.isArray(input)) return input.map(value);
  // An element handed to a host as a prop (a scroll view's refresh control) is
  // what it draws: its type and props, not who created it.
  if (isValidElement(input)) {
    const type = input.type as string | { displayName?: string; name?: string } | undefined;
    return {
      element: typeof type === 'object' ? (type.displayName ?? type.name) : type,
      props: value(input.props),
    };
  }
  if (input !== null && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      const entry = (input as Record<string, unknown>)[key];
      if (entry !== undefined) out[key] = value(entry);
    }
    return out;
  }
  return input;
}

function normalize(node: ReactTestRendererJSON | string): HostTree | string {
  if (typeof node === 'string') return node;
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(node.props).sort()) {
    // A ref is how a host is reached, never what it draws.
    if (key === 'ref') continue;
    const prop = node.props[key];
    if (prop === undefined) continue;
    props[key] = key === 'style' ? value(StyleSheet.flatten(prop) ?? {}) : value(prop);
  }
  if (props.style !== undefined && Object.keys(props.style as object).length === 0)
    delete props.style;
  return {
    type: node.type,
    props,
    children: (node.children ?? []).map(normalize),
  };
}

/**
 * What `element` commits, under Bloom's provider in `scheme`, with the portal
 * host an app root mounts on native: what a modal portals is drawn after the
 * element, as the app's outlet draws it.
 */
export function nativeTree(element: ReactNode, scheme: Scheme = 'light'): unknown {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider fonts={false} mode={scheme}>
        <PortalProvider>
          {element}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    );
  });
  const json = renderer.toJSON();
  ids = new Map();
  act(() => renderer.unmount());
  const roots = json === null ? [] : Array.isArray(json) ? json : [json];
  return roots.map(normalize);
}

/** Every case, in both schemes: the language tree commits exactly what Bloom's does. */
export function describeNativeParity(title: string, cases: readonly ParityCase[]): void {
  const consoleError = console.error;
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (String(args[0]).includes('react-test-renderer is deprecated')) return;
      consoleError(...args);
    });
  });
  describe(title, () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(scheme, () => {
        it.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
          const bloom = nativeTree(c.bloom(), scheme);
          // Two empty trees are equal and prove nothing, unless that is the claim.
          if (c.drawsNothing?.includes('native')) expect(bloom).toEqual([]);
          else expect(bloom).not.toEqual([]);
          expect(nativeTree(c.language(), scheme)).toEqual(bloom);
        });
      });
    }
  });
}
