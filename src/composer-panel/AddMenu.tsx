import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RiAddLine } from '../icons/remix/RiAddLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useComposerPopover } from './context';
import { ADD_PANEL_WIDTH, CONTROL_SIZE, type ComposerPalette } from './shared';
import type { ComposerPanelAddMenuGroup, ComposerPanelAddMenuRow, ComposerPanelLabels } from './types';
import { InlineAside } from './InlineAside';
import { dataHook } from './web-hooks';

/** CSS `ease`. */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

interface AddMenuProps {
  palette: ComposerPalette;
  groups: ReadonlyArray<ComposerPanelAddMenuGroup>;
  onSelect?: (rowId: string) => void;
  labels: Required<ComposerPanelLabels>;
  testID?: string;
}

/**
 * The `AddMenu` as the Composer Panel paints it: a 36px
 * round plus on the panel's add surface whose glyph turns 45° while open, and a
 * 361px panel of grouped rows opening upward.
 *
 *   panel   w 361, radius 16, border, p 8, shadow-dropdown, groups 8 apart
 *   group   pt 4, label→rows 6, label pl 8 body-medium secondary, rows 4 apart
 *   row     px 8 py 6, radius 10, gap 8, icon 20 (or 24 artwork),
 *           body-medium primary label + secondary description 6 after
 */
export function AddMenu({ palette, groups, onSelect, labels, testID }: AddMenuProps) {
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = reducedMotion ? (open ? 45 : 0) : withTiming(open ? 45 : 0, { duration: 200, easing: EASE });
  }, [open, reducedMotion, rotation]);
  const glyphStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }), [rotation]);

  const triggerStyle: WebCssStyle = {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: hovered ? palette.addHover : palette.add,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  const panelStyle: WebCssStyle = {
    width: ADD_PANEL_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 8,
    gap: 8,
    boxShadow: palette.shadowDropdown,
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        testID={testID}
        {...dataHook('bloomComposerControl')}
        accessibilityRole="button"
        accessibilityLabel={labels.add}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={triggerStyle}>
        <Animated.View style={glyphStyle}>
          <RiAddLine width={20} height={20} fill={palette.iconPrimary} />
        </Animated.View>
      </Pressable>

      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        label={labels.addMenu}
        side="top"
        sideOffset={8}
        testID={testID ? `${testID}-panel` : undefined}
        style={panelStyle}>
        {groups.map((group) => (
          <View key={group.label} style={{ width: '100%', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            <Text variant="body-medium" style={{ paddingLeft: 8, color: palette.textSecondary }}>
              {group.label}
            </Text>
            <View style={{ width: '100%', flexDirection: 'column', gap: 4 }}>
              {group.rows.map((row) => (
                <AddMenuRow
                  key={row.id}
                  row={row}
                  palette={palette}
                  onPress={() => {
                    setOpen(false);
                    onSelect?.(row.id);
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </Popover>
    </>
  );
}

function AddMenuRow({
  row,
  palette,
  onPress,
}: {
  row: ComposerPanelAddMenuRow;
  palette: ComposerPalette;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const Icon = row.icon;
  const iconSize = row.iconSize ?? 20;
  return (
    <Pressable
      {...dataHook('bloomComposerRow')}
      accessibilityRole="button"
      accessibilityLabel={row.description ? `${row.label} ${row.description}` : row.label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 6,
        paddingBottom: 6,
        backgroundColor: hovered || focused ? palette.hover : 'transparent',
        cursor: 'pointer',
      }}>
      {row.image ? (
        <View style={{ width: 24, height: 24, flexShrink: 0 }}>{row.image}</View>
      ) : Icon ? (
        <View style={{ flexShrink: 0 }}>
          <Icon width={iconSize} height={iconSize} fill={palette.iconSecondary} />
        </View>
      ) : null}
      <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
        {row.label}
        {row.description ? (
          <InlineAside color={palette.textSecondary}>{row.description}</InlineAside>
        ) : null}
      </Text>
    </Pressable>
  );
}
