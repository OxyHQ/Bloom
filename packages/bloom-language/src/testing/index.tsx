/**
 * `@oxy.so/bloom-language/testing`: the language for an app's jsdom suites,
 * where React Native is a stub and Bloom's families cannot load. A chain is
 * drawn as plain DOM carrying what a test reads: its text, its press
 * (`onClick`), its accessible name, role, test id, disabled and busy states, a
 * field's value and a toggle's state. Every node the language exports is here
 * by the same name (`constructors.generated.ts`), from the root and from every
 * family's entry, so one mapping covers them all:
 *
 *   // jest.config.js
 *   moduleNameMapper: {
 *     '^@oxy\\.so/bloom-language(/[a-z-]+)?$': require.resolve('@oxy.so/bloom-language/testing'),
 *   }
 *
 * What a chain draws on a platform is not this module's claim: that is the
 * language's parity suite's, and the compiler's and TypeScript's checks hold
 * the chain itself. A node is `data-node="<Constructor>"`.
 */
import {
  createElement,
  Fragment,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

import { isNode, nodeData, type TestNode, viewNode } from './node';

export { constructor, isNode, nodeData, type TestNode, type TestNodeData } from './node';

type Binding = readonly [unknown, (value: unknown) => void];

const isBinding = (value: unknown): value is Binding =>
  Array.isArray(value) && value.length === 2 && typeof value[1] === 'function';

const TEXT_INPUTS = new Set(['TextField', 'SecureField', 'Search', 'TextEditor']);
const TOGGLES = new Set(['Toggle', 'Checkbox']);
const DRAWS_NOTHING = new Set(['Icon', 'Spacer']);

/** Draws a language child (a node, an array, an element, text) as DOM. */
export function draw(child: unknown, key?: string | number): ReactNode {
  if (child === null || child === undefined || typeof child === 'boolean') return null;
  if (Array.isArray(child) && !isBinding(child)) return child.map((c, i) => draw(c, i));
  if (!isNode(child)) return child as ReactNode;
  const node = nodeData(child);
  const own = (name: string) => node.modifiers.get(name)?.[0];
  const id = (own('id') as string | number | undefined) ?? key;
  const props: Record<string, unknown> = {
    key: id,
    'data-node': node.constructorName,
    'aria-label': own('label'),
    'aria-live': own('liveRegion'),
    'aria-busy': own('loading') ? true : undefined,
    role: own('role'),
    'data-testid': own('testID'),
    disabled: own('disabled') === undefined ? undefined : Boolean(own('disabled')),
  };
  const press = (own('onPress') ?? own('onLongPress')) as (() => void) | undefined;
  const drawn = () => node.args.filter((arg) => !isBinding(arg)).map((arg, i) => draw(arg, i));
  const name = node.constructorName;
  // A view() body is a component of its own, as the language's is: its hooks are its own.
  if (node.body !== undefined) return createElement(ViewBody, { key: id, body: node.body });
  if (name === 'Embed') {
    const [content] = node.args;
    const out = typeof content === 'function' ? content((n: unknown) => draw(n)) : content;
    return createElement(Fragment, { key: id }, out as ReactNode);
  }
  if (DRAWS_NOTHING.has(name)) return null;
  if (name === 'Text' || name === 'RawText')
    return createElement('span', { ...props, onClick: press }, ...drawn());
  if (name === 'Button')
    return createElement('button', { ...props, type: 'button', onClick: press }, ...drawn());
  if (name === 'Divider') return createElement('hr', props);
  if (name === 'Image')
    return createElement('img', { ...props, src: node.args[0], alt: own('alt') });
  if (TOGGLES.has(name)) {
    const [value, set] = (node.args.find(isBinding) ?? [false, () => {}]) as Binding;
    return createElement('input', {
      ...props,
      type: 'checkbox',
      role: props.role ?? (name === 'Toggle' ? 'switch' : undefined),
      checked: Boolean(value),
      onChange: (event: { target: { checked: boolean } }) => set(event.target.checked),
    });
  }
  if (TEXT_INPUTS.has(name)) {
    const [value, set] = (node.args.find(isBinding) ?? ['', () => {}]) as Binding;
    const label = node.args.find((arg) => typeof arg === 'string');
    const submit = own('onSubmit') as (() => void) | undefined;
    return createElement('input', {
      ...props,
      type: name === 'SecureField' ? 'password' : 'text',
      'aria-label': props['aria-label'] ?? label,
      value: value as string,
      onChange: (event: { target: { value: string } }) => set(event.target.value),
      onKeyDown: (event: { key: string }) => {
        if (event.key === 'Enter') submit?.();
      },
    });
  }
  return createElement(
    'div',
    { ...props, onClick: press, role: props.role ?? (press ? 'button' : undefined) },
    ...drawn(),
  );
}

function ViewBody({ body }: { body: () => unknown }): ReactNode {
  return draw(body());
}

// ── the language's values ────────────────────────────────────────────

export function toElement(child: unknown, key?: string | number): ReactElement {
  return createElement(Fragment, { key }, draw(child));
}

/** What the compiler lowers `toElement(chain)` to. */
export function LanguageRoot({
  node,
  build,
}: {
  node?: unknown;
  build?: () => unknown;
}): ReactNode {
  return draw(build === undefined ? node : build());
}

export function LanguageStyles({ children }: { children?: ReactNode }): ReactNode {
  return children ?? null;
}

/** A `view()`: a constructor whose node draws its body with its props. */
export function view<P extends object>(body: (props: P) => unknown): (props?: P) => TestNode {
  return (props) =>
    viewNode(body.name || 'View', () => {
      const tree = body((props ?? {}) as P);
      return typeof tree === 'function' ? (tree as () => unknown)() : tree;
    });
}

/** A route (`screen()`, `layout()`): a component that draws its body. */
function route<P extends object>(body: (props: P) => unknown): ComponentType<P> {
  const Route = (props: P) => draw(body(props));
  Route.displayName = body.name || 'Route';
  return Route;
}
export const screen = route;
export function layout(body: () => unknown): ComponentType {
  return route(body);
}

export function navigate(destination: unknown, params?: unknown) {
  return { navigate: destination, params };
}

export const menu =
  <P extends object>(body: (props: P) => unknown) =>
  (props?: P) =>
    body((props ?? {}) as P);
export const actions = menu;

export function toast(): void {}

export function defineTokens<T extends object>(tokens: T): Readonly<T> {
  return Object.freeze(tokens);
}

export class EnvironmentKey<T> {
  constructor(
    readonly name: string,
    readonly defaultValue: T,
  ) {}
}
export function defineEnvironment<T>(name: string, defaultValue: T): EnvironmentKey<T> {
  return new EnvironmentKey(name, defaultValue);
}
export function useEnvironment<T>(key: EnvironmentKey<T>): T {
  return key.defaultValue;
}
export function environmentValues(): Record<string, unknown> {
  return {};
}

export function defineModifier<A extends unknown[]>(
  apply: (node: TestNode, ...args: A) => TestNode,
) {
  return apply;
}

/** A value the language chains (`regular.tint(…)`, a transition): any chain on it is itself. */
function inert(name: string): unknown {
  const value: unknown = new Proxy(() => value, {
    get: (_, key) => (key === 'toString' ? () => name : value),
  });
  return value;
}
export const regular = inert('regular');
export const clear = inert('clear');
export const identity = inert('identity');
export const opacity = inert('opacity');
export const move = () => inert('move');
export const scale = () => inert('scale');
export const asymmetric = () => inert('asymmetric');
export const defineKeyframes = () => inert('keyframes');
export const transitionNamespace = () => inert('namespace');
export const useNamespace = () => inert('namespace');

/** A motion value: a number a test reads with `.get()`. */
export function useMotionValue(initial: number) {
  let current = initial;
  return { get: () => current, set: (next: number) => void (current = next) };
}
export const useMappedValue = useMotionValue;
export function animate(): void {}

/** The language's own classes, for a test that names them; the double's values are none of them. */
export class Node {}
export class GlassValue {}
export class TransitionValue {}
export class ViewModifier {}

export { isValidElement };
export * from './constructors.generated';
