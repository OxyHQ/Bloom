/**
 * The React context a NATIVE portal carries from where `<Portal>` is written
 * to where its content renders.
 *
 * ## Why a bridge at all
 *
 * React Native has no portal into an arbitrary view. `ReactFabric.createPortal`
 * exists, but its container is a ROOT: the renderer commits a portal by calling
 * `completeRoot(containerTag, children)` (`ReactFabric-prod.js`,
 * `commitHostPortalContainerChildren`), which replaces a whole surface's children
 * rather than appending into a view. So Bloom's native portal is a context +
 * outlet: `<Portal>` hands its element to the provider and `<PortalOutlet>`
 * renders it near the app root. That element is rendered UNDER THE OUTLET, so
 * every context provided between the outlet and the `<Portal>` was gone —
 * Bloom re-published its theme and nothing else, and a settings page reading the
 * app's own provider crashed on Android (`AlloSettingsProvider is missing`) while
 * the identical tree worked on web, where `createPortal` keeps the context.
 *
 * ## What it does
 *
 * The `<Portal>` reads its own fiber, walks up to the root collecting every
 * context PROVIDER above it (nearest first, each context once), subscribes to
 * each of those contexts so a new value re-renders the portal, and the outlet
 * renders the content inside the same providers with the same values. That is
 * the context the content would have had in place — what web already gives it.
 *
 * The fiber is read through a class instance's `_reactInternals`, the same
 * field React's own `findDOMNode` and `react-reconciler` read; provider fibers
 * are tag 10 in React 18 and 19 alike, and the context object is `type` (19) or
 * `type._context` (18). If the field is ever missing, `readPortalFiber` returns
 * null and the portal falls back to bridging only Bloom's theme, exactly as
 * before this existed.
 *
 * ## What it deliberately does NOT carry
 *
 * Contexts that describe WHERE a node is in the host tree rather than what data
 * it has. Re-providing those at the outlet would lie to the content about its
 * position, so the content sees the outlet's own value instead — which is also
 * what it saw before this bridge existed:
 *
 *   - React Native's `TextAncestorContext` (a `<Text>` inside a portal written
 *     inside a `<Text>` would render as a nested virtual text with no host
 *     text around it), `ScrollView.Context` and `VirtualizedList`'s context
 *     (a list in a portal written inside a list would register as the outer
 *     list's nested child and be measured against a scroller it is not in);
 *   - the safe-area insets and frame: the outlet covers the root window, so the
 *     window's insets are the ones that describe the surface, not those of a
 *     nested screen the trigger happened to sit in;
 *   - the portal group's own contexts. The outlet's element changes on every
 *     append, so a portal subscribed to it would re-append forever;
 *   - any context created through {@link excludeFromPortalBridge} —
 *     `blur/blur-target.tsx` creates its window contexts that way, because a backdrop
 *     that believed it was still inside a `<Modal>`'s window while rendering at
 *     the root outlet would blur its own ancestor: the SIGSEGV that file exists
 *     to make unreachable.
 */
import React, { createElement, type Context, type ReactNode } from 'react';
import * as ReactNativeNamespace from 'react-native';
import * as SafeAreaNamespace from 'react-native-safe-area-context';

/** The slice of a React fiber the walk reads. */
export interface PortalFiber {
  tag: number;
  type: unknown;
  return: PortalFiber | null;
}

/** `ContextProvider` in React 18 and React 19. */
const CONTEXT_PROVIDER_TAG = 10;
const REACT_CONTEXT_TYPE = Symbol.for('react.context');

type AnyContext = Context<unknown>;

/**
 * The mark lives ON the context object (like its `displayName`), under a
 * registry symbol, so every physical copy of Bloom (`src` vs `lib` export
 * conditions) reads the same answer and marking one touches no global state.
 */
const UNBRIDGED = Symbol.for('oxy.so.bloom.portal.unbridged');

/**
 * Keep a context at the OUTLET's value inside every native portal, and return
 * it — `const Ctx = excludeFromPortalBridge(createContext(…))`. For contexts
 * that describe a position in the host tree, never for data.
 */
export function excludeFromPortalBridge<T extends object>(context: T): T {
  (context as Record<symbol, unknown>)[UNBRIDGED] = true;
  return context;
}

/** React Native's own host-position contexts, read lazily: a mock may lack them. */
let hostPositionContexts: Set<unknown> | null = null;

function isExcluded(context: unknown): boolean {
  if ((context as Record<symbol, unknown>)[UNBRIDGED] === true) return true;
  if (!hostPositionContexts) {
    const rn = ReactNativeNamespace as unknown as Record<string, unknown>;
    const scrollView = rn.ScrollView as { Context?: unknown } | undefined;
    const virtualizedList = rn.VirtualizedList as { contextType?: unknown } | undefined;
    const safeArea = SafeAreaNamespace as unknown as Record<string, unknown>;
    hostPositionContexts = new Set(
      [
        rn.unstable_TextAncestorContext,
        scrollView?.Context,
        virtualizedList?.contextType,
        safeArea.SafeAreaInsetsContext,
        safeArea.SafeAreaFrameContext,
        safeArea.SafeAreaContext,
      ].filter(Boolean),
    );
  }
  return hostPositionContexts.has(context);
}

function contextOf(fiber: PortalFiber): AnyContext | null {
  if (fiber.tag !== CONTEXT_PROVIDER_TAG) return null;
  const type = fiber.type as { _context?: unknown; $$typeof?: symbol } | null;
  if (!type || typeof type !== 'object') return null;
  // React 18: the type is `{ $$typeof: provider, _context }`. React 19: the
  // context IS the provider.
  const context = (type._context ?? type) as { $$typeof?: symbol };
  return context.$$typeof === REACT_CONTEXT_TYPE ? (context as unknown as AnyContext) : null;
}

/**
 * Every context provided above `fiber`, nearest first, each once, minus the
 * excluded ones. `own` are the portal group's own contexts.
 */
export function collectBridgedContexts(
  fiber: PortalFiber | null,
  own: readonly unknown[],
): AnyContext[] {
  const seen = new Set<unknown>(own);
  const out: AnyContext[] = [];
  for (let node = fiber?.return ?? null; node; node = node.return) {
    const context = contextOf(node);
    if (!context || seen.has(context)) continue;
    seen.add(context);
    if (!isExcluded(context)) out.push(context);
  }
  return out;
}

/**
 * Read a context that may differ in count between renders. React 19's `use` is
 * allowed in loops; React 18 has only `useContext`, which reads the same way
 * and at worst logs a hook-order warning in development when the providers
 * above a portal change shape.
 */
export const readBridgedContext: <T>(context: Context<T>) => T =
  (React as unknown as { use?: <T>(context: Context<T>) => T }).use ?? React.useContext;

/**
 * Class components are the one place a component can name its own fiber.
 * The render prop receives it (or null) on every render.
 */
export class PortalFiberAnchor extends React.Component<{
  children: (fiber: PortalFiber | null) => ReactNode;
}> {
  render(): ReactNode {
    const fiber = (this as unknown as { _reactInternals?: PortalFiber })._reactInternals ?? null;
    return this.props.children(fiber && typeof fiber.tag === 'number' ? fiber : null);
  }
}

/** The content, inside the collected providers with the values read at the portal. */
export function PortalContextBridge({
  contexts,
  values,
  children,
}: {
  contexts: readonly AnyContext[];
  values: readonly unknown[];
  children: ReactNode;
}) {
  let node: ReactNode = children;
  // Nearest provider innermost, as it was in place.
  for (let index = 0; index < contexts.length; index++) {
    const context = contexts[index] as AnyContext;
    node = createElement(context.Provider, { value: values[index] }, node);
  }
  return <>{node}</>;
}
