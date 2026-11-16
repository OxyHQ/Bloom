import { SurfaceLevelProvider } from '../styles/surface-levels';
import { useSurfaceBacking } from '../surface/use-surface-backing';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Checkbox } from '../checkbox';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { MailGlyphButton } from '../mail-list/parts';
import {
  MAIL_LIST_CSS,
  MAIL_LIST_STYLE_ID,
  MAIL_ROW_GEOMETRY,
  mailActionColor,
  mailStrings,
  resolveMailPaint,
} from '../mail-list/shared';
import { MAIL_LIST_MESSAGES } from '../mail-list/messages';
import type { ListSelectionBarProps } from './types';

/**
 * The bar that replaces the top of the list while rows are selected: a
 * select-all checkbox, the count, and the bulk actions.
 *
 * It paints the accent's SUBTLE pair (`resolveAccentColors`), which is the one
 * fill in the palette that says "a mode is on" without competing with a
 * selected row; the glyphs read their tone off the same recipe.
 *
 * The checkbox is `indeterminate` while some but not all rows are checked, so
 * the one control answers both "how many" and "press me to take the rest".
 */
export function ListSelectionBar({
  count,
  total,
  selecting = false,
  onSelectAll,
  onClear,
  actions,
  onAction,
  strings,
  style,
  testID,
}: ListSelectionBarProps) {
  const { messages } = useMessages(MAIL_LIST_MESSAGES);
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_LIST_STYLE_ID, MAIL_LIST_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailStrings(strings, messages), [strings, messages]);
  const geo = MAIL_ROW_GEOMETRY.compact;

  const backing = useSurfaceBacking(paint.barFill, style);
  if (count <= 0 && !selecting) return null;

  const all = total > 0 && count >= total;
  return (
    <SurfaceLevelProvider level={backing.level} fill={backing.fill}>
      <View
        collapsable={false}
        role="toolbar"
        accessibilityLabel={text.selectedCount(count)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 48,
            paddingLeft: geo.paddingHorizontal,
            paddingRight: geo.paddingHorizontal,
            backgroundColor: paint.barFill,
          },
          style,
          backing.vars,
        ]}
        testID={testID}
      >
        {onSelectAll !== undefined ? (
          <View style={{ width: geo.avatar, alignItems: 'center' }}>
            <Checkbox
              checked={all}
              indeterminate={count > 0 && !all}
              onCheckedChange={onSelectAll}
              size={'md'}
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
    </SurfaceLevelProvider>
  );
}
