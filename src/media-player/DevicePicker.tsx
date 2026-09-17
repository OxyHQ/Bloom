import React, { memo, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { RiQuestionLine } from '../icons/remix/RiQuestionLine';
import { resolveMenuPalette } from '../floating/menu-palette';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEVICE_GLYPHS } from './device-icons';
import type { DevicePickerProps, PlaybackDevice } from './types';

export const DEVICE_ROW_HEIGHT = 52;

function DeviceRow({
  device,
  current,
  currentLabel,
  onPress,
  testID,
}: {
  device: PlaybackDevice;
  current: boolean;
  currentLabel: string;
  onPress?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const palette = useMemo(() => resolveMenuPalette(theme), [theme]);
  const { accent, neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [hovered, setHovered] = useState(false);
  const Glyph = DEVICE_GLYPHS[device.kind];
  const disabled = !!device.disabled;
  const accentText = theme.isDark ? accent[400] : accent[600];
  const iconWell = current ? (theme.isDark ? accent[950] : accent[50]) : theme.isDark ? neutral[700] : neutral[100];

  const secondary = current ? currentLabel : device.description;
  const content = (
    <>
      <View
        pointerEvents="none"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconWell,
        }}
      >
        <Glyph width={20} height={20} fill={current ? accentText : theme.colors.text} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          variant="body-medium"
          numberOfLines={1}
          style={{ color: current ? accentText : disabled ? palette.textDisabled : theme.colors.text }}
        >
          {device.name}
        </Text>
        {secondary ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: current ? accentText : palette.textSecondary }}
          >
            {secondary}
          </Text>
        ) : null}
      </View>
    </>
  );

  const rowStyle = {
    minHeight: DEVICE_ROW_HEIGHT,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 10,
  };

  if (current) {
    return (
      <View style={rowStyle} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      accessibilityLabel={device.description ? `${device.name}, ${device.description}` : device.name}
      aria-disabled={disabled || undefined}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[rowStyle, { backgroundColor: hovered && !disabled ? palette.rowHighlight : undefined }]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

/**
 * The device list: the current device on top (accent icon well, accent name and
 * "Listening on"), a "Select a device" heading, one row per other device, and
 * an optional help link. Content only — host it in a `Popover` (web) or a
 * sheet (native); on native a `Popover` already presents as a sheet.
 *
 *   row     52 min, 8 inset, 10 corner, 36 icon well (10 corner) + 12 gap
 *   hover   the menu row wash
 *
 * The current row is not a button (there is nothing to switch to); every other
 * row is a button named by the device and its description.
 */
function DevicePickerComponent({
  current,
  devices,
  onSelect,
  title = 'Current device',
  currentLabel = 'Listening on',
  devicesTitle = 'Select a device',
  emptyLabel = 'No other devices found',
  helpLabel = "Don't see your device?",
  onHelpPress,
  style,
  testID,
}: DevicePickerProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveMenuPalette(theme), [theme]);
  const [helpHovered, setHelpHovered] = useState(false);
  const heading = (text: string) => (
    <Text
      variant="body-medium"
      role="heading"
      style={{ color: palette.textSecondary, paddingLeft: 8, paddingTop: 4, paddingBottom: 2 }}
    >
      {text}
    </Text>
  );
  const others = devices.filter((d) => d.id !== current.id);

  return (
    <View style={[{ gap: 4 }, style]} testID={testID}>
      {heading(title)}
      <DeviceRow
        device={current}
        current
        currentLabel={currentLabel}
        testID={testID ? `${testID}-current` : undefined}
      />
      <View style={{ height: 1, backgroundColor: palette.border, marginTop: 6, marginBottom: 6, marginLeft: -10, marginRight: -10 }} />
      {heading(devicesTitle)}
      {others.length === 0 ? (
        <Text variant="body-regular" style={{ color: palette.textSecondary, paddingLeft: 8, paddingTop: 8, paddingBottom: 8 }}>
          {emptyLabel}
        </Text>
      ) : (
        others.map((device) => (
          <DeviceRow
            key={device.id}
            device={device}
            current={false}
            currentLabel={currentLabel}
            onPress={() => onSelect(device)}
            testID={testID ? `${testID}-device-${device.id}` : undefined}
          />
        ))
      )}
      {onHelpPress ? (
        <Pressable
          role="link"
          accessibilityLabel={helpLabel}
          onPress={onHelpPress}
          onHoverIn={() => setHelpHovered(true)}
          onHoverOut={() => setHelpHovered(false)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingTop: 8, paddingBottom: 4 }}
          testID={testID ? `${testID}-help` : undefined}
        >
          <View pointerEvents="none">
            <RiQuestionLine width={16} height={16} fill={palette.textSecondary} />
          </View>
          <Text
            variant="body-2-medium"
            style={{
              color: helpHovered ? theme.colors.text : palette.textSecondary,
              textDecorationLine: helpHovered ? 'underline' : 'none',
            }}
          >
            {helpLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const DevicePicker = memo(DevicePickerComponent);
DevicePicker.displayName = 'DevicePicker';
