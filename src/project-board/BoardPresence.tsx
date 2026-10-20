import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { StyledView } from '../styles/styled-primitives';

const AnimatedView = Animated.createAnimatedComponent(StyledView);
const DURATION = 320;
const WEB = Platform.OS === 'web';

export interface PresentBoardItem<Item> {
  item: Item;
  present: boolean;
  initial: boolean;
}

/** Removed items retain only their pixels; interactive nodes leave immediately. */
export function reconcileBoardPresence<Item>(
  previous: PresentBoardItem<Item>[],
  items: readonly Item[],
  getItemId: (item: Item) => string,
): PresentBoardItem<Item>[] {
  const ids = new Set(items.map((item) => getItemId(item)));
  const next = items.map((item) => ({
    item,
    present: true,
    initial: previous.find((entry) => getItemId(entry.item) === getItemId(item))?.initial ?? false,
  }));
  previous.forEach((entry, index) => {
    if (!ids.has(getItemId(entry.item)))
      next.splice(Math.min(index, next.length), 0, { ...entry, present: false });
  });
  return next;
}

export function BoardPresenceList<Item>({
  items,
  retainId,
  getItemId,
  children,
}: {
  items: readonly Item[];
  getItemId: (item: Item) => string;
  retainId?: string | null;
  children: (
    entry: PresentBoardItem<Item>,
    paintStyle: AnimatedStyle<ViewStyle>,
    onHeight: (height: number) => void,
  ) => ReactNode;
}) {
  const [state, setState] = useState(() => ({
    items,
    entries: items.map((item) => ({ item, present: true, initial: true })),
  }));
  if (state.items !== items) {
    setState({ items, entries: reconcileBoardPresence(state.entries, items, getItemId) });
  }
  return state.entries.map((entry) => (
    <BoardPresence
      key={getItemId(entry.item)}
      present={entry.present}
      initial={entry.initial}
      retain={getItemId(entry.item) === retainId}
      onExit={() =>
        setState((current) => ({
          ...current,
          entries: current.entries.filter(
            (item) => item.present || getItemId(item.item) !== getItemId(entry.item),
          ),
        }))
      }
    >
      {(paintStyle, onHeight) => children(entry, paintStyle, onHeight)}
    </BoardPresence>
  ));
}

/** A shared-value timeline avoids web layout-animation clones and frozen positions. */
function BoardPresence({
  present,
  initial,
  retain,
  onExit,
  children,
}: {
  present: boolean;
  initial: boolean;
  retain: boolean;
  onExit: () => void;
  children: (paintStyle: AnimatedStyle<ViewStyle>, onHeight: (height: number) => void) => ReactNode;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(initial || reduced ? 1 : 0);
  const height = useSharedValue(0);
  const exit = useRef(onExit);
  exit.current = onExit;
  useEffect(() => {
    progress.value = reduced
      ? Number(present)
      : withTiming(Number(present), {
          duration: DURATION,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
    return () => cancelAnimation(progress);
  }, [present, reduced, progress]);
  useEffect(() => {
    if (present || retain) return;
    const timer = setTimeout(() => exit.current(), reduced ? 0 : DURATION);
    return () => clearTimeout(timer);
  }, [present, reduced, retain]);
  const slotStyle = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, progress.value));
    return {
      height: height.value > 0 ? (height.value + 6) * p : undefined,
      paddingBottom: 6 * p,
    };
  }, [height, progress]);
  const paintStyle = useAnimatedStyle<ViewStyle>(() => {
    const p = Math.min(1, Math.max(0, progress.value));
    const blur = 6 * (1 - p);
    return {
      opacity: p,
      transform: [{ scale: 0.7 + 0.3 * p }],
      filter: WEB ? `blur(${blur}px)` : [{ blur }],
    } satisfies ViewStyle;
  }, [progress]);
  return (
    <AnimatedView
      className="relative shrink-0 pb-1.5"
      layout={reduced ? undefined : LinearTransition.duration(260)}
      style={slotStyle}
      pointerEvents={present || retain ? 'auto' : 'none'}
      aria-hidden={!present}
      accessibilityElementsHidden={!present}
      importantForAccessibility={present ? 'auto' : 'no-hide-descendants'}
      {...(WEB && !present && !retain ? { inert: true } : {})}
    >
      {children(paintStyle, (value) => {
        height.value = value;
      })}
    </AnimatedView>
  );
}
