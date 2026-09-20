import React, { useMemo } from 'react';
import { View } from 'react-native';

import { ButtonGroup, ButtonGroupItem } from '../button-group';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { useContainerWidth } from '../hooks/use-container-width';
import { RiMore2Line } from '../icons/remix/RiMore2Line';
import { splitToolbarActions, toolbarCapacity } from './shared';
import type { NoteEditorToolbarLabels, NoteEditorToolbarProps } from './types';

/**
 * The formatting row around someone else's writing surface.
 *
 * One `ButtonGroup` of icon-only items, and — the moment they stop fitting —
 * a `…` item fused onto its end that opens the rest as a `DropdownMenu`. The
 * overflow is not a second control beside the group: it is the group's last
 * item, so the row stays one object at every width.
 *
 * **It measures ITSELF, not the window.** `useContainerWidth` on the row, so a
 * toolbar in a 420px side panel on a 1440px desktop collapses exactly as it
 * would on a phone. A window-width breakpoint would leave that panel with a row
 * that overflows and no error.
 *
 * **The first frame is un-measured**, and it draws everything inline. That is
 * one frame wide at 360px, so the row CLIPS rather than pushing the page — the
 * alternative (start collapsed, expand) flashes a menu button on every desktop
 * mount, which is the more visible wrong. `splitToolbarActions(actions, null)`
 * is that state, spelled out.
 *
 * **A toggle is `active`, a one-shot action is not.** Setting `active` (even to
 * `false`) makes the item announce BOTH spellings of pressed — web reads only
 * `aria-pressed`, native only `accessibilityState` — and makes its overflow row
 * a checkable one. Leaving it `undefined` keeps a plain action plain.
 *
 * Sticky behaviour is the app's: the toolbar has no opinion about scroll, and
 * chrome that follows a scroller does it through `ScrollOffsetProvider`
 * (`docs/composition.mdx`).
 */

const DEFAULT_LABELS: Required<NoteEditorToolbarLabels> = {
  more: 'More formatting',
  moreMenu: 'More formatting',
};

export function NoteEditorToolbar({
  actions,
  size = 'medium',
  disabled = false,
  accessibilityLabel,
  labels: labelsProp,
  style,
  testID,
}: NoteEditorToolbarProps) {
  const { width, onLayout } = useContainerWidth();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { inline, overflow } = useMemo(
    () => splitToolbarActions(actions, width === null ? null : toolbarCapacity(width, size)),
    [actions, width, size],
  );

  return (
    <View
      onLayout={onLayout}
      // The row is as wide as it is given and clips rather than pushing the
      // page during the one un-measured frame. `ButtonGroup` clips its own
      // items already, so this adds no new clipping to a settled layout.
      style={[{ width: '100%', flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, style]}
      testID={testID}
    >
      <ButtonGroup
        size={size}
        accessibilityLabel={accessibilityLabel}
        testID={testID ? `${testID}-group` : undefined}
      >
        {inline.map((action) => (
          <ButtonGroupItem
            key={action.key}
            iconOnly
            leadingIcon={action.icon}
            accessibilityLabel={action.label}
            selected={action.active === true}
            disabled={disabled || action.disabled === true}
            onPress={action.onPress}
            testID={testID ? `${testID}-${action.key}` : undefined}
          />
        ))}
        {overflow.length > 0 ? (
          <DropdownMenu key="__overflow">
            <DropdownMenuTrigger asChild label={labels.more}>
              <ButtonGroupItem
                iconOnly
                leadingIcon={RiMore2Line}
                accessibilityLabel={labels.more}
                disabled={disabled}
                testID={testID ? `${testID}-more` : undefined}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent label={labels.moreMenu}>
              {overflow.map((action) =>
                action.active === undefined ? (
                  <DropdownMenuItem
                    key={action.key}
                    onPress={action.onPress}
                    disabled={disabled || action.disabled === true}
                    leading={<action.icon width={18} height={18} />}
                    accessibilityLabel={action.label}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuCheckboxItem
                    key={action.key}
                    checked={action.active}
                    onCheckedChange={action.onPress}
                    disabled={disabled || action.disabled === true}
                    accessibilityLabel={action.label}
                  >
                    {action.label}
                  </DropdownMenuCheckboxItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </ButtonGroup>
    </View>
  );
}
NoteEditorToolbar.displayName = 'NoteEditorToolbar';
