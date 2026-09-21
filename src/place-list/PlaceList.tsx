import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { GlyphButton } from '../button';
import { moveItem } from '../hooks/list-reorder';
import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { PlaceCard } from '../place-card';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PLACE_LIST_GEOMETRY } from './constants';
import { DEFAULT_PLACE_LIST_LABELS, placeNameOf, resolvePlaceListPaint } from './shared';
import type { PlaceListProps } from './types';

/**
 * The places inside a saved list: the place, the person's note about it, and
 * the controls that move or remove it.
 *
 *   place     `PlaceCard` at `density="row"`, untouched — a saved place and a
 *             search result are the same object, so this list draws no row of
 *             its own and inherits the thumbnail, the rating, the open state
 *             and the composed announcement with it
 *   note      the person's own line, with a document glyph, announced as
 *             "Note: get the sourdough before noon". It is a SIBLING of the
 *             place's press target rather than part of its name: the place is
 *             the place, and the note is what someone said about it
 *   controls  move earlier, move later, remove — 44 boxes, right-aligned
 *             under the row
 *
 * ## Reordering is buttons, and the buttons ARE the accessible path
 *
 * `moveItem` (`hooks/list-reorder`) is the same list maths the track list, the
 * queue and the photo grid use, so "move" means one thing in this package.
 * There is no pointer drag here: `SortablePhotoGrid`'s drag is grid geometry —
 * a point resolved to a cell in a fixed row of columns — and a column of rows
 * of different heights is a different problem, not a smaller one. Buttons are
 * also what a keyboard and a screen reader get from a drag surface anyway, so
 * the list is fully operable with the half that exists.
 *
 * Every move is announced politely, and every row is KEYED BY ITS ID — so on
 * web the button that was just pressed keeps the focus and travels with its
 * row, and a reader can press "move later" three times without hunting for it
 * again.
 *
 * The first row's "move earlier" and the last row's "move later" are DISABLED
 * rather than absent: a control that disappears at the end of its travel moves
 * the two beside it under the pointer.
 */
function PlaceListComponent({
  places,
  onReorder,
  onRemove,
  disabled = false,
  labels,
  empty,
  accessibilityLabel = 'Saved places',
  style,
  testID,
}: PlaceListProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceListPaint(theme, surface), [theme, surface]);
  const words = useMemo(() => ({ ...DEFAULT_PLACE_LIST_LABELS, ...labels }), [labels]);
  const [announcement, setAnnouncement] = useState('');

  const { control, controlGlyph, gap } = PLACE_LIST_GEOMETRY;
  const total = places.length;

  const move = useCallback(
    (from: number, to: number) => {
      if (!onReorder || to < 0 || to >= total) return;
      const entry = places[from];
      if (!entry) return;
      onReorder(moveItem(places, from, to));
      setAnnouncement(words.moved(placeNameOf(entry), to + 1, total));
    },
    [onReorder, places, total, words],
  );

  if (total === 0) return <>{empty ?? null}</>;

  return (
    <View
      role="list"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: gap * 2 }, style]}
      testID={testID}
    >
      {places.map((entry, index) => {
        const itemTestID = testID ? `${testID}-item-${index}` : undefined;
        const name = placeNameOf(entry);
        return (
          <View key={entry.id} role="listitem" style={{ gap }} testID={itemTestID}>
            <PlaceCard {...entry.place} density="row" />

            {entry.note ? (
              <View
                accessible
                accessibilityLabel={`${words.note}: ${entry.note}`}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
              >
                <View
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{ paddingTop: 2 }}
                >
                  <RiFileTextLine width={16} height={16} fill={paint.textTertiary} />
                </View>
                <Text
                  variant="body-2-regular"
                  style={{ flex: 1, minWidth: 0, color: paint.textSecondary }}
                >
                  {entry.note}
                </Text>
              </View>
            ) : null}

            {onReorder || onRemove ? (
              <View
                style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}
              >
                {onReorder ? (
                  <>
                    <GlyphButton
                      icon={RiArrowUpLine}
                      size={control}
                      glyphSize={controlGlyph}
                      disabled={disabled || index === 0}
                      onPress={() => move(index, index - 1)}
                      accessibilityLabel={words.moveEarlier(index + 1)}
                      testID={itemTestID ? `${itemTestID}-up` : undefined}
                    />
                    <GlyphButton
                      icon={RiArrowDownLine}
                      size={control}
                      glyphSize={controlGlyph}
                      disabled={disabled || index === total - 1}
                      onPress={() => move(index, index + 1)}
                      accessibilityLabel={words.moveLater(index + 1)}
                      testID={itemTestID ? `${itemTestID}-down` : undefined}
                    />
                  </>
                ) : null}
                {onRemove ? (
                  <GlyphButton
                    icon={RiDeleteBinLine}
                    size={control}
                    glyphSize={controlGlyph}
                    disabled={disabled}
                    onPress={() => onRemove(entry.id)}
                    accessibilityLabel={words.remove(name)}
                    testID={itemTestID ? `${itemTestID}-remove` : undefined}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
      {/*
        The move is a change of ORDER, which draws nothing new — the rows just
        swap. A polite live region is the only way a screen reader hears that
        the press did anything at all.
      */}
      <Text
        accessibilityLiveRegion="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
        testID={testID ? `${testID}-status` : undefined}
      >
        {announcement}
      </Text>
    </View>
  );
}

export const PlaceList = memo(PlaceListComponent);
PlaceList.displayName = 'PlaceList';
