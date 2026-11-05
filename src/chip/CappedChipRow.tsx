/**
 * A wrapping row of pills that holds to `maxLines`, with a trailing "+N" pill
 * for whatever does not fit. Pressing it shows the rest.
 *
 * `ChipRow` scrolls sideways; this one wraps, which is what a profile's link
 * list or a tag cloud needs. A pill cannot be counted into a line without
 * knowing its width, and a flex row does not report that, so the row measures
 * each pill's intrinsic size once: every pill renders, and the ones past the
 * fit are moved out of flow (absolute, invisible, out of the accessibility
 * tree) instead of being unmounted. Nothing mounts twice, so a `testID` on a
 * pill stays unique. The fitting arithmetic lives in `wrap-layout.ts`.
 *
 * Expanding shows every pill and is not collapsed again; a caller that wants
 * that resets the row by remounting it.
 */
import { Children, isValidElement, memo, useCallback, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { Chip } from './Chip';
import { visibleChipCount } from './wrap-layout';
import type { CappedChipRowProps } from './types';

const DEFAULT_MAX_LINES = 2;
const DEFAULT_GAP = 8;

const defaultMoreLabel = (hidden: number) => `+${hidden}`;
const defaultMoreAccessibilityLabel = (hidden: number) => `Show ${hidden} more`;

/** Out of flow and invisible, but still laid out so its width can be read. */
const HIDDEN_STYLE: StyleProp<ViewStyle> = {
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0,
};

function CappedChipRowComponent({
  children,
  maxLines = DEFAULT_MAX_LINES,
  gap = DEFAULT_GAP,
  moreLabel = defaultMoreLabel,
  moreAccessibilityLabel = defaultMoreAccessibilityLabel,
  role = 'group',
  accessibilityLabel,
  style,
  testID,
}: CappedChipRowProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [available, setAvailable] = useState(0);
  const [widths, setWidths] = useState<Record<number, number>>({});
  const [moreWidth, setMoreWidth] = useState<number | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  const onRowLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setAvailable((previous) => (previous === width ? previous : width));
  }, []);

  const onItemLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidths((previous) =>
      previous[index] === width ? previous : { ...previous, [index]: width },
    );
  }, []);

  const onMoreLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setMoreWidth((previous) => (previous === width ? previous : width));
  }, []);

  const measured = items.every((_, index) => widths[index] !== undefined);
  const total = items.length;
  const ready = available > 0 && measured && moreWidth !== undefined;

  const visible = useMemo(() => {
    if (expanded || !ready) return total;
    return visibleChipCount({
      widths: items.map((_, index) => widths[index] ?? 0),
      moreWidth: moreWidth ?? 0,
      available,
      gap,
      maxLines,
    });
  }, [available, expanded, gap, items, maxLines, moreWidth, ready, total, widths]);

  const hidden = total - visible;
  const showMore = !expanded && ready && hidden > 0;

  return (
    <View
      // A grouping role keeps its children itself: a flattened view would
      // hand them to an ancestor, and the group would read as empty.
      collapsable={false}
      testID={testID}
      role={role}
      accessibilityLabel={accessibilityLabel}
      onLayout={onRowLayout}
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          position: 'relative',
          gap,
          opacity: ready ? 1 : 0,
        },
        style,
      ]}
    >
      {items.map((item, index) => {
        const isVisible = index < visible;
        return (
          <View
            key={isValidElement(item) && item.key !== null ? item.key : index}
            onLayout={(event) => onItemLayout(index, event)}
            style={isVisible ? undefined : HIDDEN_STYLE}
            pointerEvents={isVisible ? 'auto' : 'none'}
            importantForAccessibility={isVisible ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!isVisible}
          >
            {item}
          </View>
        );
      })}
      {total > 0 ? (
        <View
          testID={testID ? `${testID}-more` : undefined}
          onLayout={onMoreLayout}
          style={showMore ? undefined : HIDDEN_STYLE}
          pointerEvents={showMore ? 'auto' : 'none'}
          importantForAccessibility={showMore ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={!showMore}
        >
          <Chip
            role="button"
            size="md"
            variant="subtle"
            onPress={() => setExpanded(true)}
            accessibilityLabel={moreAccessibilityLabel(hidden)}
          >
            {moreLabel(hidden)}
          </Chip>
        </View>
      ) : null}
    </View>
  );
}

export const CappedChipRow = memo(CappedChipRowComponent);
