import React from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';

import { Badge } from '../badge';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import type { SidebarPalette } from './palette';
import { MenuDivider, SidebarAvatarView } from './parts';
import type { SidebarMenuGroup, SidebarMenuItem } from './types';
import { IS_WEB } from '../styles/platform';

/**
 * The rows of the team and account menus.
 *
 *   row      p8 radius 10 gap 10: an icon 20 (secondary) or a 20px avatar,
 *            the label (body-medium primary, truncating) over an optional
 *            description (caption-1-regular secondary), then a count badge;
 *            hover primary-hover. `destructive` paints the label and glyph in
 *            the danger role.
 *   choice   in a `selection: 'single'` group the rows are radios: the group
 *            is the radiogroup its label names, and the selected row carries a
 *            20px check at its end instead of the hover fill.
 */
function MenuRow({
  item,
  palette,
  radio,
  idPrefix,
  onSelect,
}: {
  item: SidebarMenuItem;
  palette: SidebarPalette;
  radio: boolean;
  idPrefix: string;
  onSelect: () => void;
}) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const Icon = item.icon;
  const destructive = item.tone === 'destructive';
  const ink = destructive ? palette.menu.destructive : palette.text;
  const glyph = destructive ? palette.menu.destructive : palette.textSecondary;
  const style: WebCssStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    // A radio's selection is its check; the fill is the pointer's alone.
    backgroundColor: (item.selected && !radio) || hovered ? palette.menu.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };
  return (
    <Pressable
      {...(IS_WEB
        ? {
            dataSet: { bloomSidebar: 'inset' },
            ...(item.href ? { href: item.href } : null),
            ...(item.selected && !radio ? { 'aria-current': 'page' } : null),
          }
        : {})}
      role={radio ? 'radio' : item.href ? 'link' : 'button'}
      accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
      accessibilityState={
        radio ? { checked: item.selected === true } : { selected: item.selected === true }
      }
      {...(radio ? { 'aria-checked': item.selected === true } : null)}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event: GestureResponderEvent) => {
        if (item.onPress) {
          if (IS_WEB && item.href) event.preventDefault();
          item.onPress();
        }
        onSelect();
      }}
      style={style}
      testID={`${idPrefix}-${item.key}`}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {item.avatar ? (
          <SidebarAvatarView avatar={item.avatar} size="xs" palette={palette} />
        ) : Icon ? (
          <Icon width={20} height={20} fill={glyph} />
        ) : null}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text variant="body-medium" numberOfLines={1} style={{ color: ink }}>
            {item.label}
          </Text>
          {item.description ? (
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: palette.textSecondary }}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      {item.badge != null ? (
        <Badge
          content={item.badge}
          style={{ backgroundColor: palette.menu.countBackground }}
          textStyle={{ color: palette.menu.countForeground }}
        />
      ) : null}
      {radio && item.selected ? (
        <RiCheckLine width={20} height={20} fill={palette.text} style={{ flexShrink: 0 }} />
      ) : null}
    </Pressable>
  );
}

function MenuGroupView({
  group,
  divider,
  palette,
  idPrefix,
  onSelect,
}: {
  group: SidebarMenuGroup;
  divider: boolean;
  palette: SidebarPalette;
  idPrefix: string;
  onSelect: () => void;
}) {
  const radio = group.selection === 'single';
  return (
    <>
      {divider ? <MenuDivider palette={palette} spacing={10} /> : null}
      <View style={{ width: '100%', gap: group.label ? 6 : 4, paddingTop: group.label ? 4 : 0 }}>
        {group.label ? (
          <Text
            variant="body-medium"
            style={{ paddingLeft: 8, paddingRight: 8, color: palette.textSecondary }}
          >
            {group.label}
          </Text>
        ) : null}
        <View
          {...(radio ? { role: 'radiogroup' as const, accessibilityLabel: group.label } : null)}
          style={{ width: '100%', gap: 4 }}
        >
          {group.items.map((item) => (
            <MenuRow
              key={item.key}
              item={item}
              palette={palette}
              radio={radio}
              idPrefix={idPrefix}
              onSelect={onSelect}
            />
          ))}
          {group.content}
        </View>
      </View>
    </>
  );
}

/** A menu's groups in order, a full-bleed divider between each two. */
export function SidebarMenuGroups({
  groups,
  palette,
  leadingDivider = false,
  idPrefix,
  onSelect,
}: {
  groups: ReadonlyArray<SidebarMenuGroup>;
  palette: SidebarPalette;
  /** Rows' test ids: `${idPrefix}-${key}`. */
  idPrefix: string;
  /** Draw a divider above the first group too (rows above it belong to another block). */
  leadingDivider?: boolean;
  onSelect: () => void;
}) {
  if (groups.length === 0) return null;
  return (
    <View style={{ width: '100%' }}>
      {groups.map((group, index) => (
        <MenuGroupView
          key={group.id}
          group={group}
          divider={leadingDivider || index > 0}
          palette={palette}
          idPrefix={idPrefix}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}
