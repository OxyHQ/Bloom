/**
 * WHICH SCROLLER the chrome around a screen is following.
 *
 * ## The problem it answers
 *
 * Every piece of scroll-linked chrome Bloom draws — a header's separator, its
 * shadow, the scrim under its islands — is a function of one number: how far
 * one scroll container has moved. The container is the screen's, and the chrome
 * is usually not inside it, so the number has to travel.
 *
 * Until now it travelled as a prop, and the default when the prop was omitted
 * was `window.scrollY` on web and "nothing moves" on native. That default is
 * right for exactly one layout — a web page whose document IS the scroller —
 * and silently wrong for the two that a Bloom app usually has: a desktop panel
 * that scrolls inside a fixed shell, and any native screen at all. The failure
 * has no error in it. The header simply never reacts, which reads as a header
 * that was designed not to.
 *
 * ## The rule
 *
 * A screen has exactly ONE scroll owner, and the owner publishes its offset
 * here. Chrome reads it. Neither imports the other, so an app composes them in
 * any arrangement — a header above a list, a header overlaying a list, two
 * panels side by side each with its own header and its own scroller — and the
 * right header still follows the right list, because the provider's position in
 * the tree is what pairs them.
 *
 * ```tsx
 * const scrollY = useSharedValue(0);
 * const onScroll = useAnimatedScrollHandler(
 *   { onScroll: (e) => { scrollY.value = e.contentOffset.y; } },
 *   [scrollY],
 * );
 *
 * <ScrollOffsetProvider value={scrollY}>
 *   <PageHeader title="Inbox" />
 *   <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>…</Animated.ScrollView>
 * </ScrollOffsetProvider>
 * ```
 *
 * ## Why a SharedValue and not state
 *
 * The same reason `layout/bottom-edge.tsx` refuses to publish the tab bar's
 * collapse: a scroll offset changes on every frame, and a React re-render per
 * frame is not a performance detail here, it is the whole cost of the feature.
 * A `SharedValue` crosses this context ONCE, at mount — the object identity
 * never changes — and every subsequent frame reaches the chrome on the UI
 * thread through `useAnimatedStyle`, with no render at all.
 *
 * That is also why the context holds the shared VALUE rather than a number: a
 * context whose value changed per frame would re-render every consumer per
 * frame, which is exactly what this exists to avoid.
 */
import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

const ScrollOffsetContext = createContext<SharedValue<number> | null>(null);
ScrollOffsetContext.displayName = 'BloomScrollOffsetContext';

/**
 * Publish this subtree's scroll offset. `value` is a `SharedValue<number>` the
 * scroll owner writes from its own animated handler.
 */
export const ScrollOffsetProvider = ScrollOffsetContext.Provider;

/**
 * The nearest published scroll offset, or `null` when nothing published one.
 *
 * `null` rather than a zero shared value, because the two mean different things
 * to the chrome reading it: a published zero is "the scroller is at the top",
 * and `null` is "no one told me", which is the case where a web header may
 * still fall back to the document's own scroll.
 */
export function useScrollOffset(): SharedValue<number> | null {
  return useContext(ScrollOffsetContext);
}
