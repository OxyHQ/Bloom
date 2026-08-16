import React, { createContext, memo, useContext, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, type View } from 'react-native';
import { BlurTargetView } from 'expo-blur';

import type { GlassBlurTargetProviderProps, GlassBlurWindowProps } from './types';

/**
 * Who gets to blur what, on Android.
 *
 * ── THE CONSTRAINT THIS EXISTS TO ENCODE ────────────────────────────────────
 *
 * `expo-blur` blurs nothing on Android without a `blurTarget` — a ref to a
 * `BlurTargetView` wrapping the content to blur. The obvious way to supply one
 * is to wrap the app and hand the ref down, and that is a NATIVE CRASH: a
 * `BlurView` that is a DESCENDANT of the view it points at makes the render
 * tree recurse into itself, `RenderNode::prepareTreeImpl` past 500 frames,
 * SIGSEGV in `RenderThread`. Measured on API 37 and reproduced with a single
 * target and a single pane.
 *
 * Measured, the three topologies are:
 *
 *   descendant of its own target       CRASH
 *   sibling of the target              blurs
 *   inside a `Modal`, target at root   blurs (RN's `Modal` is its own native
 *                                      window, and the target is reachable
 *                                      across that boundary)
 *
 * So a blur target is only ever safe for a surface in a DIFFERENT native window
 * from the content it blurs. In Bloom that is exactly one thing: a surface
 * inside an RN `<Modal>`.
 *
 * ── WHY THE TARGET IS NOT SIMPLY HANDED TO EVERY CONSUMER ───────────────────
 *
 * `Backdrop` is public API and is rendered in BOTH positions: `Dialog`'s centre
 * and side placements portal into the SAME window (Bloom's `Portal` is a
 * context + outlet, not a `Modal`), while `BottomSheet` renders a real `<Modal>`.
 * One of those two crashes. A rule in a doc would not be enough — the same
 * component, with the same props, is safe in one caller and fatal in the other.
 *
 * So the target is published in two hops. {@link GlassBlurTargetProvider} holds
 * it at the app root, and nothing reads it directly; only
 * {@link GlassBlurWindow} — which Bloom renders INSIDE its own `<Modal>`s, and
 * nowhere else — re-publishes it to descendants. A `Backdrop` that has not
 * crossed a declared window boundary sees `undefined` and paints the tint-only
 * surface it painted before. The crashing topology is not reachable by writing
 * the wrong thing; it is unreachable because the value is absent there.
 *
 * `expo-blur` is a REQUIRED peer that `GlassSurface` already imports statically,
 * so importing `BlurTargetView` here adds no package to any graph and needs no
 * optional-`require` boundary.
 *
 * ── ONE FILE, NOT A FORK ────────────────────────────────────────────────────
 *
 * The whole mechanism is Android-only — iOS blurs through `UIVisualEffectView`
 * and web through CSS `backdrop-filter`, neither of which takes a target — so
 * everything here is gated on {@link isAndroid} rather than split into a `.web`
 * sibling. A fork would have to be named explicitly by a generated web barrel
 * (export conditions do not apply to relative specifiers), which is a lot of
 * machinery for a file whose other platforms want NO behaviour at all.
 * `Platform.OS` cannot change during a run, so the branches below are constant
 * per process and never reshape the tree.
 */

/**
 * Read per call rather than captured at module load. It is the same value every
 * time, and it keeps the platform branch REACHABLE from a test: a module-level
 * constant can only be re-evaluated by resetting the module registry, which
 * loads a second copy of React and breaks every hook in the tree.
 */
const isAndroid = () => Platform.OS === 'android';

/**
 * The app-root target. Deliberately NOT exported as a hook — reading this
 * without crossing a window boundary is the crash.
 */
const RootBlurTargetContext = createContext<React.RefObject<View | null> | undefined>(undefined);

/**
 * True only inside a declared separate native window. Default `false` is what
 * makes the unsafe position the DEFAULT position.
 */
const SeparateWindowContext = createContext(false);

/**
 * Wraps the app content so a portaled surface can blur it.
 *
 * Composed by `BloomProvider`, and exported for consumers that do not mount it
 * (a Vite/SPA root, or a native app that is not on expo-router). Mounting it
 * twice duplicates no surface — it renders a transparent container and nothing
 * else — so unlike an outlet it is safe at any depth; the nearest one simply
 * becomes the target for its subtree.
 */
export const GlassBlurTargetProvider = memo(function GlassBlurTargetProvider({
  children,
  style,
}: GlassBlurTargetProviderProps) {
  const ref = useRef<View | null>(null);
  // `BlurView` resolves `findNodeHandle(blurTarget.current)` in
  // `componentDidMount` and re-resolves only when `blurTarget.current` DIFFERS
  // from the previous render's — a comparison a stable ref object can never
  // trip, because both sides read the same object. So the published value is a
  // fresh wrapper minted once the node exists. `onLayout` is the signal because
  // it is typed (`BlurTargetView`'s `ref` prop is a `RefObject`, not a callback
  // ref, so the node cannot be captured through `setState` directly) and it
  // cannot run before the ref is attached.
  const [attached, setAttached] = useState(false);
  const target = useMemo(
    () => ({ current: attached ? ref.current : null }),
    [attached],
  );

  // Off Android there is nothing to target and nothing to publish, so the
  // provider is a pass-through rather than an extra layout node at every app
  // root in the fleet.
  if (!isAndroid()) return <>{children}</>;

  return (
    <RootBlurTargetContext.Provider value={target}>
      <BlurTargetView
        ref={ref}
        style={style ?? styles.fill}
        onLayout={attached ? undefined : () => setAttached(true)}
      >
        {children}
      </BlurTargetView>
    </RootBlurTargetContext.Provider>
  );
});

/**
 * Declares that its children render in a SEPARATE native window from the app
 * content — an RN `<Modal>`, and nothing else.
 *
 * Bloom renders this inside its own `<Modal>`s. It is the only thing that makes
 * the root target visible to {@link useWindowedBlurTarget}, so putting it
 * anywhere that is not a real window boundary re-arms the crash it exists to
 * prevent.
 */
export const GlassBlurWindow = memo(function GlassBlurWindow({ children }: GlassBlurWindowProps) {
  return <SeparateWindowContext.Provider value>{children}</SeparateWindowContext.Provider>;
});

/**
 * The blur target for a surface, or `undefined` when there is none it may
 * safely use — either because no provider is mounted, or because this surface
 * shares a window with the content and would crash.
 *
 * `undefined` is a normal answer, not a failure: the caller paints its
 * tint-only material, exactly as it did before any of this existed.
 */
export function useWindowedBlurTarget(): React.RefObject<View | null> | undefined {
  const target = useContext(RootBlurTargetContext);
  const inSeparateWindow = useContext(SeparateWindowContext);
  if (!isAndroid()) return undefined;
  return inSeparateWindow ? target : undefined;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
