import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { PLACE_DETAILS_GEOMETRY, PLACE_INFO_ACTION_ICON } from './constants';
import { describeInfoItem, resolvePlaceDetailsPaint } from './shared';
import type { PlaceInfoListProps } from './types';

/**
 * The block of a place you ACT on: the address, the phone, the website, the
 * plus code, and the way to report that any of them is wrong.
 *
 * It is `settings-list`'s card, row for row — the glyph well, the 44 minimum
 * height, the hairline between rows, the surface the group resolves from
 * whatever it was dropped on. A place's contact block and a settings screen
 * are the same object: a short list of rows, each carrying one value and one
 * thing that happens when you press it.
 *
 *   row      the VALUE first (`title`) with what it is under it
 *            (`description`) — a reader scanning a place sheet is looking for
 *            the address, not for the word "Address". It takes TWO lines by
 *            default (`numberOfLines`): a settings row's title is a noun and
 *            fits on one, a postal address is the row's content and does not,
 *            and the tail that would be cut is the part that identifies it
 *   glyph    20, the family's one glyph rung, in text-secondary
 *   trailing the ACTION's glyph ({@link PLACE_INFO_ACTION_ICON}) — a copy
 *            sheet, a handset, an arrow out of the box — so the press is
 *            legible before it is made, with its WORD at the end of the row's
 *            name for everyone who cannot see it (`accessibilityHint` reaches
 *            native only; `PLACE_INFO_ACTION_LABELS` has the mechanism)
 *   edit     keeps the chevron instead: it opens a form rather than doing
 *            something here
 *
 * THE TRAILING GLYPH IS NOT A BUTTON. The row is one press target and one
 * announcement; a second button inside it would be a second tab stop saying
 * the same word, and on web a button inside a pressable row is the nested
 * control this library refuses everywhere else. One row, one action — which is
 * also why `PlaceInfoItem.action` is a closed list rather than a slot.
 */
function PlaceInfoListComponent({
  items,
  title,
  footer,
  actionLabels,
  style,
  testID,
}: PlaceInfoListProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePlaceDetailsPaint(theme, surface), [theme, surface]);

  if (items.length === 0) return null;

  return (
    <View style={style} testID={testID}>
      <SettingsListGroup title={title} footer={footer}>
        {items.map((item) => {
          const action = item.action ?? 'none';
          const Glyph = item.icon;
          const ActionGlyph =
            action === 'none' || action === 'edit' ? null : PLACE_INFO_ACTION_ICON[action];
          const pressable = item.onPress !== undefined;
          return (
            <SettingsListItem
              key={item.id}
              title={item.value}
              titleNumberOfLines={item.numberOfLines ?? 2}
              description={item.label}
              icon={
                Glyph ? (
                  <Glyph
                    width={PLACE_DETAILS_GEOMETRY.glyph}
                    height={PLACE_DETAILS_GEOMETRY.glyph}
                    fill={paint.textSecondary}
                  />
                ) : undefined
              }
              rightElement={
                ActionGlyph ? (
                  <View
                    aria-hidden
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    testID={testID ? `${testID}-${item.id}-action` : undefined}
                  >
                    <ActionGlyph width={18} height={18} fill={paint.textTertiary} />
                  </View>
                ) : undefined
              }
              showChevron={action === 'edit' && pressable}
              onPress={pressable ? () => item.onPress?.(item.id) : undefined}
              disabled={item.disabled}
              accessibilityLabel={describeInfoItem(item, actionLabels)}
            />
          );
        })}
      </SettingsListGroup>
    </View>
  );
}

export const PlaceInfoList = memo(PlaceInfoListComponent);
PlaceInfoList.displayName = 'PlaceInfoList';
