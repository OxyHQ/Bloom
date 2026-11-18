import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { borderRadius } from '../styles/tokens';
import Svg, { Path } from 'react-native-svg';

import { ListItem } from '../list';
import { LIST_ROW_COMPACT_INSET, LIST_ROW_MIN_HEIGHT } from '../list/list-style';
import { Collapsible } from '../collapsible';
import { DropZone } from '../drop-zone';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiFolderOpenLine } from '../icons/remix/RiFolderOpenLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useSidebarMetrics } from './metrics';
import { Text } from '../typography';
import { useSidebarPalette, type SidebarPalette } from './palette';
import { useSidebarWebCss } from './parts';
import type { SidebarFolderProps, SidebarTreeFolder, SidebarTreeItem } from './types';
import { useTreeRowDrop } from './use-tree-row-drop';
import { IS_WEB } from '../styles/platform';
import type { SurfaceTransition } from '../motion/types';

/** A tree branch's reveal: height and opacity together, 300ms ease-in-out. */
export const SIDEBAR_TREE_REVEAL: SurfaceTransition = { duration: 300, easing: [0.4, 0, 0.2, 1] };
const ROW_PITCH = LIST_ROW_MIN_HEIGHT + 2;
const FIRST_CENTER = LIST_ROW_MIN_HEIGHT / 2;

/**
 * The curved connector: a guide dropping from the folder glyph with a rounded
 * elbow into each row — 1px icon-quaternary, trunk at x 17, each elbow landing 5px
 * toward the end of it and running on to 11.5. The path is drawn left-to-right,
 * so under RTL the box is mirrored as well as anchored from the start edge.
 */
function TreeConnector({ count, color }: { count: number; color: string }) {
  const rtl = useIsRtl();
  if (count === 0) return null;
  const height = FIRST_CENTER + ROW_PITCH * (count - 1) + 1;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        insetInlineStart: 16.5,
        width: 12,
        height,
        transform: rtl ? [{ scaleX: -1 }] : undefined,
      }}
    >
      <Svg width={12} height={height} viewBox={`0 0 12 ${height}`} fill="none">
        {Array.from({ length: count }, (_, i) => {
          const y = FIRST_CENTER + ROW_PITCH * i;
          return (
            <Path
              key={y}
              d={`M0.5 0 V${y - 5} Q0.5 ${y} 5.5 ${y} H11.5`}
              stroke={color}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

/**
 * One row of the tree: inside a folder (indented past the connector) or
 * directly under a section label (`folder` absent, inset to the folder glyph).
 * With a `drop` it is a drop zone, lit with the accent while a drag it would
 * take is over it.
 */
export function SidebarTreeRow({
  item,
  folder,
  selected,
  focusable,
  onPress,
  palette,
}: {
  item: SidebarTreeItem;
  folder?: SidebarTreeFolder;
  selected: boolean;
  focusable: boolean;
  // Method form: a folder's `(item, folder) => …` handler always gets its folder here.
  onPress?(item: SidebarTreeItem, folder?: SidebarTreeFolder): void;
  palette: SidebarPalette;
}) {
  const { lit, zone } = useTreeRowDrop(item.disabled ? undefined : item.drop);
  const { tree } = useSidebarMetrics();
  const Icon = item.icon;
  const row = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingInlineStart: folder ? 36 - LIST_ROW_COMPACT_INSET : 0,
        backgroundColor: lit ? palette.selected : 'transparent',
        borderRadius: borderRadius.full,
      }}
      testID={`sidebar-tree-row-${item.key}`}
    >
      <ListItem
        density="compact"
        compactPadding={tree.padding}
        style={{ flex: 1, minWidth: 0 }}
        active={item.selected ?? selected}
        label={[item.label, item.description, item.meta].filter(Boolean).join(', ')}
        href={item.href}
        onPrefetch={item.onPrefetch}
        onLongPress={item.onLongPress}
        onPress={
          item.onPress || onPress
            ? () => {
                item.onPrefetch?.();
                item.onPress?.();
                onPress?.(item, folder);
              }
            : undefined
        }
        checked={item.checked}
        onCheckedChange={item.onCheckedChange}
        selecting={item.selecting}
        selectionLabel={item.selectionLabel}
        contextMenu={item.contextMenu}
        disabled={item.disabled || !focusable}
        trigger={(props) => (
          <Pressable
            {...props}
            aria-current={(item.selected ?? selected) ? 'page' : undefined}
            focusable={focusable}
          />
        )}
        leading={
          Icon || item.leading ? (
            <View pointerEvents="none">
              {Icon ? (
                <Icon
                  width={tree.icon}
                  height={tree.icon}
                  fill={lit ? palette.selectedForeground : palette.textSecondary}
                />
              ) : (
                item.leading
              )}
            </View>
          ) : undefined
        }
        title={
          <Text
            variant={tree.label}
            numberOfLines={1}
            style={{ color: lit ? palette.selectedForeground : palette.textSecondary }}
          >
            {item.label}
          </Text>
        }
        supporting={
          item.description ? (
            <Text
              variant={tree.meta}
              numberOfLines={1}
              style={{ color: lit ? palette.selectedForeground : palette.textTertiary }}
            >
              {item.description}
            </Text>
          ) : undefined
        }
        trailing={
          item.meta ? (
            <View
              pointerEvents="none"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                backgroundColor: palette.tertiary,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <Text variant={tree.meta} numberOfLines={1} style={{ color: palette.textSecondary }}>
                {item.meta}
              </Text>
            </View>
          ) : undefined
        }
        testID={`sidebar-tree-item-${item.key}`}
      />
      {item.actions}
    </View>
  );
  return zone ? <DropZone {...zone}>{row}</DropZone> : row;
}

/**
 * An expandable folder whose items use the shared ListItem anatomy and input
 * handlers. The folder owns disclosure, indentation and curved connectors;
 * collapsed content leaves interaction and accessibility via Collapsible.
 */
function SidebarFolderComponent({
  folder,
  open,
  onOpenChange,
  forceOpen = false,
  selectedItem,
  onItemPress,
  style,
  testID,
}: SidebarFolderProps) {
  const palette = useSidebarPalette();
  useSidebarWebCss();
  const { tree } = useSidebarMetrics();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open ?? folder.open,
    defaultValue: folder.defaultOpen ?? false,
    onChange: onOpenChange ?? folder.onOpenChange,
  });
  const expanded = forceOpen || isOpen;
  const Icon = expanded ? RiFolderOpenLine : RiFolderLine;

  const rowStyle: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: tree.padding + 3,
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? palette.rowHover : 'transparent',
    '--bloom-sidebar-ring': palette.ring,
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          {...(IS_WEB ? { dataSet: { bloomSidebar: 'ring' } } : {})}
          role="button"
          accessibilityLabel={folder.label}
          aria-expanded={expanded}
          accessibilityState={{ expanded }}
          onHoverIn={onIn}
          onHoverOut={onOut}
          onPress={() => setOpen(!isOpen)}
          style={rowStyle}
        >
          <View style={{ flexShrink: 0 }}>
            <Icon width={tree.icon} height={tree.icon} fill={palette.textSecondary} />
          </View>
          <Text
            variant={tree.label}
            numberOfLines={1}
            style={{ flexShrink: 1, color: palette.textSecondary }}
          >
            {folder.label}
          </Text>
        </Pressable>
        {folder.actions}
      </View>
      <Collapsible
        open={expanded}
        transition={SIDEBAR_TREE_REVEAL}
        contentStyle={{
          position: 'relative',
          width: '100%',
          flexDirection: 'column',
          gap: 2,
          paddingTop: 2,
        }}
      >
        <TreeConnector count={folder.items.length} color={palette.iconQuaternary} />
        {folder.items.map((item) => (
          <SidebarTreeRow
            key={item.key}
            item={item}
            folder={folder}
            selected={item.key === selectedItem}
            focusable={expanded}
            onPress={onItemPress}
            palette={palette}
          />
        ))}
      </Collapsible>
    </View>
  );
}

export const SidebarFolder = memo(SidebarFolderComponent);
SidebarFolder.displayName = 'SidebarFolder';
