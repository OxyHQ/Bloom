/**
 * The top edge's OCCUPANCY — the mirror of `bottom-edge.tsx`, for chrome that
 * parks at the TOP of a screen.
 *
 * ## Why a floating header needs it and a bar header does not
 *
 * A header that participates in layout answers this question by existing: the
 * content starts where the header ends, because the header is a sibling above
 * it in a column. A header that OVERLAYS content — the floating presentation,
 * where the page scrolls under translucent islands — occupies no layout space
 * at all, and the first item of the content lands underneath it.
 *
 * Somebody has to pad that content, and there are only three candidates. The
 * app can hardcode a number, which is what every fleet header made its
 * consumers do and which goes wrong the moment a subtitle, a safe-area inset or
 * a larger font changes the height. The header can pad the content, which it
 * cannot do — it does not own it, and often is not even its ancestor. Or the
 * header can declare what it occupies and the content can read it. That is this
 * registry, and it is the same object the bottom edge already uses
 * (`edge-store.ts`), so a reader who knows one knows the other.
 *
 * ## The height is MEASURED, not computed
 *
 * `PageHeader` claims what `onLayout` reports, not a constant plus the insets.
 * The two disagree in every case the constant was written to survive — a
 * two-line title under an enlarged font, a subtitle that wraps in a long
 * translation, a notch — and the failure of a computed height is silent: the
 * content starts a few points under the islands and looks like a design
 * decision.
 *
 * One consequence, stated rather than hidden: a claim registers in an EFFECT,
 * so a reader mounted in the same commit sees `0` on its first render and the
 * claimed number on the next. For a scroll container's `paddingTop` that is one
 * frame of content sitting too high, before any scroll has happened.
 *
 * `PageHeader` narrows that frame rather than closing it: it claims its own
 * resting height (the safe-area inset plus the 56pt bar) from the first commit
 * and replaces it with the measured height once `onLayout` reports, so the one
 * bad frame is off by whatever a subtitle or an enlarged font adds rather than
 * by the whole header.
 */
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

import { createEdgeStore, NO_INSET, NO_SUBSCRIPTION, type EdgeStore } from './edge-store';

const TopEdgeContext = createContext<EdgeStore | null>(null);

/**
 * Wrap the app once — `BloomProvider` already does. A nested provider scopes a
 * subtree to its own claims, which is what a full-screen modal with its own
 * header wants: the content inside it must clear the MODAL's header, not the
 * screen's.
 */
export function TopEdgeProvider({ children }: PropsWithChildren) {
  const [store] = useState(createEdgeStore);
  return <TopEdgeContext.Provider value={store}>{children}</TopEdgeContext.Provider>;
}

TopEdgeProvider.displayName = 'TopEdgeProvider';

/**
 * How much of the top edge is already occupied, in px — the padding a scroll
 * container needs so its first item is not born under the chrome.
 *
 * ```tsx
 * <ScrollView contentContainerStyle={{ paddingTop: useTopEdgeInset() }}>
 * ```
 *
 * `0` outside a provider, and `0` on the first render even inside one — a claim
 * registers in an effect. See the module comment for what that costs and how
 * `PageHeader` narrows it.
 */
export function useTopEdgeInset(): number {
  const store = useContext(TopEdgeContext);
  return useSyncExternalStore(
    store?.subscribe ?? NO_SUBSCRIPTION,
    store?.getInset ?? NO_INSET,
    store?.getInset ?? NO_INSET,
  );
}

/**
 * Claim `height` px of the top edge for as long as the caller is mounted.
 *
 * Claiming does not move the claimant — it declares the space it already
 * occupies so that everything reading `useTopEdgeInset()` starts below it. Pass
 * the FULL footprint: the chrome's measured height including any safe-area
 * padding it applied itself.
 *
 * A no-op outside a provider, so the chrome stays usable standalone.
 */
export function useClaimTopEdge(height: number): void {
  const store = useContext(TopEdgeContext);
  const id = useId();

  useEffect(() => {
    if (!store) return;
    store.claim(id, height);
    return () => store.release(id);
  }, [store, id, height]);
}
