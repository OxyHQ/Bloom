import { useComposerButton, useComposerDropdown } from './context';
import { COMPOSER_BUTTON_LAYOUT } from './button-layout';
import React, { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RiAddLine } from '../icons/remix/RiAddLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { ADD_PANEL_WIDTH, CONTROL_SIZE, type ComposerPalette } from './shared';
import type {
  ComposerPanelAddMenuGroup,
  ComposerPanelAddMenuRow,
  ComposerPanelLabels,
} from './types';
import { InlineAside } from './InlineAside';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

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
 * The `AddMenu` as the Composer Panel paints it: a 36px round plus whose glyph turns 45° while open,
 * and a menu of grouped rows opening upward.
 *
 * The menu is Bloom's own `DropdownMenu` (the family every menu in Bloom is), not rows of buttons in
 * a panel of its own: that is what gives it the menu semantics (roving focus, arrow keys, type
 * ahead), the label and separator rows, and the row layout every other menu has, left-aligned, with
 * a switch's state as the row's own check mark.
 *
 *   group   a `DropdownMenuLabel` over its rows; groups apart by a separator
 *   row     an action is a `DropdownMenuItem`, a switch (`checked` defined) a
 *           `DropdownMenuCheckboxItem` whose mark is at the end; an icon (20, or 24 artwork) leads,
 *           the label is body-medium primary with its description inline, secondary
 */
export function AddMenu({ palette, groups, onSelect, labels, testID }: AddMenuProps) {
  const Button = useComposerButton();
  const D = useComposerDropdown();
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    rotation.value = reducedMotion
      ? open
        ? 45
        : 0
      : withTiming(open ? 45 : 0, { duration: 200, easing: EASE });
  }, [open, reducedMotion, rotation]);
  const glyphStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  const triggerStyle: WebCssStyle = {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };

  return (
    <D.DropdownMenu open={open} onOpenChange={setOpen}>
      <D.DropdownMenuTrigger asChild label={labels.add}>
        <Button
          appearance="subtle"
          tone="neutral"
          iconOnly
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={labels.add}
          style={[COMPOSER_BUTTON_LAYOUT, triggerStyle]}
        >
          <Animated.View style={glyphStyle}>
            <RiAddLine width={20} height={20} fill={palette.iconPrimary} />
          </Animated.View>
        </Button>
      </D.DropdownMenuTrigger>
      <D.DropdownMenuContent
        label={labels.addMenu}
        side="top"
        align="start"
        sideOffset={8}
        alignRows
        testID={testID ? `${testID}-panel` : undefined}
        style={{ width: ADD_PANEL_WIDTH }}
      >
        {groups.map((group, index) => {
          const rows = group.rows.map((row) => (
            <AddMenuRow
              key={row.id}
              row={row}
              palette={palette}
              onSelect={() => onSelect?.(row.id)}
            />
          ));
          const Icon = group.icon;
          return (
            <React.Fragment key={group.label}>
              {index === 0 ? null : <D.DropdownMenuSeparator />}
              {group.submenu ? (
                <D.DropdownMenuSub>
                  <D.DropdownMenuSubTrigger
                    leading={
                      Icon ? (
                        <Icon width={20} height={20} fill={palette.iconSecondary} />
                      ) : undefined
                    }
                    accessibilityLabel={group.label}
                  >
                    <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                      {group.label}
                    </Text>
                  </D.DropdownMenuSubTrigger>
                  <D.DropdownMenuSubContent label={group.label}>{rows}</D.DropdownMenuSubContent>
                </D.DropdownMenuSub>
              ) : (
                <>
                  <D.DropdownMenuLabel>{group.label}</D.DropdownMenuLabel>
                  {rows}
                </>
              )}
            </React.Fragment>
          );
        })}
      </D.DropdownMenuContent>
    </D.DropdownMenu>
  );
}

/** One row: its label with the description inline, after the icon (or artwork) that leads it. */
function AddMenuRow({
  row,
  palette,
  onSelect,
}: {
  row: ComposerPanelAddMenuRow;
  palette: ComposerPalette;
  onSelect: () => void;
}) {
  const D = useComposerDropdown();
  const Icon = row.icon;
  const iconSize = row.iconSize ?? 20;
  const leading = row.image ? (
    <Animated.View style={{ width: 24, height: 24, flexShrink: 0 }}>{row.image}</Animated.View>
  ) : Icon ? (
    <Icon width={iconSize} height={iconSize} fill={palette.iconSecondary} />
  ) : undefined;
  const text = (
    <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.text }}>
      {row.label}
      {row.description ? (
        <InlineAside color={palette.textSecondary}>{row.description}</InlineAside>
      ) : null}
    </Text>
  );
  const name = row.description ? `${row.label} ${row.description}` : row.label;

  if (row.checked === undefined) {
    return (
      <D.DropdownMenuItem
        leading={leading}
        accessibilityLabel={name}
        disabled={row.disabled}
        onPress={onSelect}
      >
        {text}
      </D.DropdownMenuItem>
    );
  }
  // A SWITCH says which way it is set: the menu's own check mark, at the end of the row, after the
  // label has taken its width (a long label truncates rather than pushing the state off the row).
  return (
    <D.DropdownMenuCheckboxItem
      checked={row.checked}
      onCheckedChange={onSelect}
      indicatorPosition="trailing"
      leading={leading}
      accessibilityLabel={name}
      disabled={row.disabled}
      testID={`bloom-row-${row.id}`}
    >
      {text}
    </D.DropdownMenuCheckboxItem>
  );
}
