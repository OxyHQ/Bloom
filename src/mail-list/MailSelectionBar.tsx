import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Checkbox } from '../checkbox';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MailGlyphButton } from './parts';
import {
  MAIL_LIST_CSS,
  MAIL_LIST_STYLE_ID,
  MAIL_ROW_GEOMETRY,
  MAIL_SELECTION_BAR_HEIGHT,
  mailActionColor,
  mailStrings,
  resolveMailPaint,
} from './shared';
import type { MailSelectionBarProps } from './types';

/**
 * The bar that replaces the top of the list while rows are selected: a
 * select-all checkbox, the count, and the bulk actions.
 *
 * `MailList` mounts it itself the moment `onCheckedIdsChange` is given and
 * something is checked — it is NOT a component an app places by hand, because a
 * bar that can be forgotten is a selection mode with no way out of it.
 *
 * It paints the accent's SUBTLE pair (`resolveAccentColors`), which is the one
 * fill in the palette that says "a mode is on" without competing with a
 * selected row; the glyphs read their tone off the same recipe.
 *
 * The checkbox is `indeterminate` while some but not all rows are checked, so
 * the one control answers both "how many" and "press me to take the rest".
 */
export function MailSelectionBar({
  count,
  total,
  onSelectAll,
  onClear,
  actions,
  onAction,
  density = 'comfortable',
  strings,
  style,
  testID,
}: MailSelectionBarProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_LIST_STYLE_ID, MAIL_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailStrings(strings), [strings]);
  const geo = MAIL_ROW_GEOMETRY[density];

  if (count <= 0) return null;

  const all = total > 0 && count >= total;
  return (
    <View
      role="toolbar"
      accessibilityLabel={text.selectedCount(count)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: MAIL_SELECTION_BAR_HEIGHT[density],
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          backgroundColor: paint.barFill,
        },
        style,
      ]}
      testID={testID}
    >
      {onSelectAll !== undefined ? (
        <View style={{ width: geo.avatar, alignItems: 'center' }}>
          <Checkbox
            checked={all}
            indeterminate={!all}
            onCheckedChange={onSelectAll}
            size={density === 'compact' ? 'small' : 'medium'}
            accessibilityLabel={text.selectAll}
            testID={testID ? `${testID}-select-all` : undefined}
          />
        </View>
      ) : null}
      <Text
        variant="body-semibold"
        numberOfLines={1}
        style={{ color: paint.barText, flexShrink: 1, minWidth: 0 }}
        testID={testID ? `${testID}-count` : undefined}
      >
        {text.selectedCount(count)}
      </Text>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {(actions ?? []).map((action) => (
          <MailGlyphButton
            key={action.key}
            label={action.label}
            icon={action.icon}
            color={action.tone === undefined ? paint.barText : mailActionColor(action, paint)}
            hoverFill={paint.selected}
            ring={paint.accent}
            size={geo.action}
            glyph={geo.actionGlyph}
            onPress={() => {
              action.onPress?.();
              onAction?.(action.key);
            }}
            testID={testID ? `${testID}-action-${action.key}` : undefined}
          />
        ))}
        {onClear !== undefined ? (
          <MailGlyphButton
            label={text.clearSelection}
            icon={RiCloseLine}
            color={paint.barText}
            hoverFill={paint.selected}
            ring={paint.accent}
            size={geo.action}
            glyph={geo.actionGlyph}
            onPress={onClear}
            testID={testID ? `${testID}-clear` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}
