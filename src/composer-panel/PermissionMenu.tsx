import React, { useRef, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useComposerPopover } from './context';
import { PERMISSION_PANEL_WIDTH, type ComposerPalette } from './shared';
import type { ComposerPanelLabels, ComposerPanelPermissionOption } from './types';
import { dataHook } from './web-hooks';

const FLIP: ViewStyle = { transform: [{ scaleY: -1 }] };
/** The permission chip's widest: past this a mode's name truncates. */
const PERMISSION_TRIGGER_MAX_WIDTH = 160;

interface PermissionMenuProps {
  palette: ComposerPalette;
  permissions: ReadonlyArray<ComposerPanelPermissionOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (permission: string) => void;
  onLearnMore?: () => void;
  labels: Required<ComposerPanelLabels>;
  testID?: string;
}

/**
 * `PermissionMenu`: a pill that paints its surface only on hover,
 * press or while its menu is open, and a 323px panel of radio rows that opens
 * upward.
 *
 *   trigger   min-h 30 (grows with the system font), max-w 160 then the
 *             label ellipsizes, pl 8 / pr 10, gap 4, icon 16, body-medium
 *             secondary
 *   panel     w 323, radius 20, border, p 6, shadow-dropdown
 *   body      pt 4, header→rows 6; header px 8 gap 10, body-medium tertiary
 *   row       p 8, radius 14, gap 8, icon 20, label body-medium secondary,
 *             description body-2-medium tertiary; rows 4 apart
 */
export function PermissionMenu({
  palette,
  permissions,
  value,
  defaultValue,
  onChange,
  onLearnMore,
  labels,
  testID,
}: PermissionMenuProps) {
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? permissions[0]?.id ?? '',
    onChange,
  });
  const current = permissions.find((option) => option.id === selected) ?? permissions[0];
  if (!current) return null;
  const CurrentIcon = current.icon;
  const panelStyle: WebCssStyle = {
    width: PERMISSION_PANEL_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 6,
    gap: 0,
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
        accessibilityLabel={`Permission: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(!open)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => {
          const trigger: WebCssStyle = {
            // At least 30, never exactly: at the largest system font the label
            // is taller than 30 and a fixed height clipped it top and bottom.
            // A long mode name truncates at a width that still reads as a chip.
            minHeight: 30,
            minWidth: 0,
            maxWidth: PERMISSION_TRIGGER_MAX_WIDTH,
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: 9999,
            paddingTop: 5,
            paddingBottom: 5,
            paddingLeft: 8,
            paddingRight: 10,
            backgroundColor: hovered || pressed || open ? palette.hover : 'transparent',
            cursor: 'pointer',
            '--bloom-composer-ring': palette.focusRing,
          };
          return trigger;
        }}>
        <View style={current.flip ? [FLIP, { flexShrink: 0 }] : { flexShrink: 0 }}>
          <CurrentIcon width={16} height={16} fill={palette.iconSecondary} />
        </View>
        <Text
          variant="body-medium"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ flexShrink: 1, minWidth: 0, color: palette.textSecondary }}>
          {current.label}
        </Text>
      </Pressable>

      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={triggerRef}
        label={labels.permissions}
        side="top"
        sideOffset={8}
        testID={testID ? `${testID}-panel` : undefined}
        style={panelStyle}>
        <View style={{ flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8, paddingRight: 8 }}>
            <Text variant="body-medium" style={{ flex: 1, minWidth: 0, color: palette.textTertiary }}>
              {labels.permissions}
            </Text>
            {onLearnMore ? (
              <LearnMore palette={palette} label={labels.learnMore} onPress={onLearnMore} />
            ) : null}
          </View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={labels.permissionMode}
            style={{ flexDirection: 'column', gap: 4 }}>
            {permissions.map((option) => (
              <PermissionRow
                key={option.id}
                option={option}
                checked={option.id === current.id}
                palette={palette}
                onSelect={() => {
                  setSelected(option.id);
                  setOpen(false);
                }}
              />
            ))}
          </View>
        </View>
      </Popover>
    </>
  );
}

function PermissionRow({
  option,
  checked,
  palette,
  onSelect,
}: {
  option: ComposerPanelPermissionOption;
  checked: boolean;
  palette: ComposerPalette;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const Icon = option.icon;
  return (
    <Pressable
      {...dataHook('bloomComposerRow')}
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      aria-checked={checked}
      accessibilityState={{ checked }}
      onPress={onSelect}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 14,
        padding: 8,
        backgroundColor: checked || hovered || focused ? palette.hover : 'transparent',
        cursor: 'pointer',
      }}>
      <View style={option.flip ? FLIP : undefined}>
        <Icon width={20} height={20} fill={palette.iconSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'column' }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {option.label}
        </Text>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
          {option.description}
        </Text>
      </View>
    </Pressable>
  );
}

/** A secondary small `LinkButton`, a step lighter: tertiary, underline on hover. */
function LearnMore({
  palette,
  label,
  onPress,
}: {
  palette: ComposerPalette;
  label: string;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...dataHook('bloomComposerControl', 'link')}
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ flexShrink: 0, borderRadius: 4, cursor: 'pointer' }}>
      {({ pressed }) => (
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{
            color: pressed ? palette.text : palette.textTertiary,
            textDecorationLine: hovered ? 'underline' : 'none',
          }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
