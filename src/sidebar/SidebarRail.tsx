import React from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useSidebarPalette } from './palette';
import { IS_WEB } from './parts';
import { SidebarPrimaryAction } from './SidebarPrimaryAction';
import { SidebarScrollArea } from './SidebarScrollArea';
import { SidebarLogoView } from './SidebarLogoView';
import { SidebarRailItem } from './SidebarRailItem';
import type { SidebarNavItem, SidebarProps } from './types';

/** The rail's fixed width. */
export const SIDEBAR_RAIL_WIDTH = 80;

/**
 * `Sidebar variant="rail"` — the compact navigation rail.
 *
 *   panel      80 wide, full height, background-full, no chrome
 *   items      centred vertically in a scroller (px 8, py 24, gap 8), one
 *              `SidebarRailItem` per row
 *   logo       the mark only, centred at the top (pt 24), when `logo` is given
 *   secondary  pinned to the foot (px 8, pb 24, gap 8)
 *
 * The rail carries navigation and the logo's mark only: account, team, plan, tree, quick search and
 * the theme toggle belong to the panel variant and are not rendered here.
 */
export function SidebarRail({
  logo,
  items = [],
  primaryAction,
  contentAlignment = 'start',
  footer,
  secondaryItems = [],
  selected,
  onNavigate,
  accessibilityLabel = 'Sidebar',
  style,
  testID,
}: SidebarProps) {
  const palette = useSidebarPalette();
  // The badges sit on logical insets; react-native-web resolves those against a
  // `dir` prop, not `<html dir>` (see `useDirectionProps`).
  const dirProps = useDirectionProps();

  const renderItem = (item: SidebarNavItem) => {
    const isSelected = selected === item.key;
    const onPress = item.onPress ?? (onNavigate && item.href != null ? () => onNavigate(item) : undefined);
    return (
      <SidebarRailItem
        key={item.key}
        icon={item.icon}
        activeIcon={item.activeIcon}
        label={item.label}
        href={item.href}
        selected={isSelected}
        onPress={onPress}
        onLongPress={item.onLongPress}
        testID={`sidebar-item-${item.key}`}
        badge={
          item.badge !== undefined ? (
            <Badge
              content={item.badge}
              style={{ backgroundColor: isSelected ? palette.badgePrimary : palette.badgeNeutral }}
              textStyle={{ color: isSelected ? palette.badgePrimaryForeground : palette.textSecondary }}
            />
          ) : undefined
        }
      />
    );
  };

  return (
    <View
      {...dirProps}
      role="complementary"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        {
          width: SIDEBAR_RAIL_WIDTH,
          height: '100%',
          flexShrink: 0,
          flexDirection: 'column',
          backgroundColor: palette.flat,
        },
        style,
      ]}
    >
      <View testID={`${testID ?? 'sidebar'}-main-region`} style={{ flex: 1, minHeight: 0, justifyContent: contentAlignment === 'center' ? 'center' : undefined }}>
      <View style={{ minHeight: 0, flexShrink: 1, ...(contentAlignment === 'start' ? { flex: 1 } : {}) }}>
      {logo ? (
        <View style={{ flexShrink: 0, alignItems: 'center', paddingTop: 24 }}>
          <SidebarLogoView logo={logo} showWordmark={false} testID="sidebar-logo" />
        </View>
      ) : null}
      <SidebarScrollArea
        fadeColor={palette.flat}
        testID={testID ? `${testID}-scroll` : 'sidebar-rail-scroll'}
        {...(IS_WEB ? { dataSet: { bloomSidebarScroll: 'none' } } : {})}
        style={contentAlignment === 'center' ? { flexGrow: 0, flexShrink: 1, minHeight: 0 } : { flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 24,
          paddingBottom: 24,
          gap: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View role="navigation" style={{ width: '100%', gap: 8 }}>
          {items.map(renderItem)}
        </View>
      </SidebarScrollArea>
      {primaryAction ? <View style={{ flexShrink: 0, paddingLeft: 8, paddingRight: 8, paddingBottom: 24 }}>
        <SidebarPrimaryAction action={primaryAction} rail testID={testID ? `${testID}-primary-action` : undefined} />
      </View> : null}
      </View>
      </View>
      {secondaryItems.length > 0 ? (
        <View
          role="navigation"
          style={{ flexShrink: 0, paddingLeft: 8, paddingRight: 8, paddingBottom: 24, gap: 8 }}
        >
          {secondaryItems.map(renderItem)}
        </View>
      ) : null}
      {footer != null ? <View testID={testID ? `${testID}-footer` : 'sidebar-footer'} style={{ flexShrink: 0, width: '100%', paddingLeft: 8, paddingRight: 8, paddingBottom: 24 }}>
        {typeof footer === 'function' ? footer({ collapsed: true }) : footer}
      </View> : null}
    </View>
  );
}
