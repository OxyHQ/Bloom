import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiArrowDropDownLine } from '../icons/remix/RiArrowDropDownLine';
import { RiFolder2Line } from '../icons/remix/RiFolder2Line';
import { RiGitMergeLine } from '../icons/remix/RiGitMergeLine';
import { RiInfinityLine } from '../icons/remix/RiInfinityLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ContextRing } from './ComposerPanelStatusTab';
import { useComposerPopover } from './context';
import { EFFORT_WIDTH, resolveComposerPalette, type ComposerPalette } from './shared';
import type { ComposerStatusBarFolder, ComposerStatusBarProps } from './types';
import { dataHook, useComposerWebCss } from './web-hooks';

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

const DEFAULT_LABELS = {
  folders: 'Local Folders',
  context: (percent: number) => `Context ${percent}%`,
};

function Caret({ open, color }: { open: boolean; color: string }) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    const target = open ? 180 : 0;
    rotation.value = reducedMotion ? target : withTiming(target, { duration: 200, easing: EASE });
  }, [open, reducedMotion, rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }), [rotation]);
  return (
    <Animated.View style={[{ width: 16, height: 16, flexShrink: 0 }, style]}>
      <RiArrowDropDownLine width={16} height={16} fill={color} />
    </Animated.View>
  );
}

/** A 16px glyph, body-2-medium label and optional caret, 4 apart. */
function StatusItem({
  icon,
  label,
  caret,
  open = false,
  onPress,
  palette,
  triggerRef,
  expanded,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  caret?: boolean;
  open?: boolean;
  onPress?: () => void;
  palette: ComposerPalette;
  triggerRef?: React.RefObject<View | null>;
  expanded?: boolean;
  testID?: string;
}) {
  const style: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      ref={triggerRef}
      testID={testID}
      {...dataHook('bloomComposerControl')}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(expanded === undefined ? null : { 'aria-expanded': expanded, accessibilityState: { expanded } })}
      onPress={onPress}
      style={style}>
      {icon}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {label}
        </Text>
        {caret ? <Caret open={open} color={palette.iconSecondary} /> : null}
      </View>
    </Pressable>
  );
}

function FolderRow({
  folder,
  selected,
  onPress,
  palette,
}: {
  folder: ComposerStatusBarFolder;
  selected: boolean;
  onPress: () => void;
  palette: ComposerPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...dataHook('bloomComposerRow')}
      accessibilityRole="button"
      accessibilityLabel={`${folder.prefix}${folder.name}`}
      aria-pressed={selected}
      accessibilityState={{ selected }}
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
        padding: 8,
        borderRadius: 10,
        backgroundColor: selected || hovered || focused ? palette.hover : 'transparent',
        cursor: 'pointer',
      }}>
      <RiFolder2Line width={20} height={20} fill={palette.iconSecondary} />
      <Text variant="body-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.textSecondary }}>
        {folder.prefix}
        <Text variant="body-medium" style={{ color: palette.text }}>
          {folder.name}
        </Text>
      </Text>
    </Pressable>
  );
}

/**
 * The line under the AI chat's pill composer (the reference's `StatusBar`): 26
 * tall, space-between.
 *
 *   left     gap 12: the branch (mirrored merge glyph) and the project folder —
 *            its caret turns over while the "Local Folders" panel is open
 *            (266 wide, radius 16, 1px border, p 10, shadow-dropdown, above the
 *            item; rows p 8 / radius 10 / gap 8 with a 20px folder glyph and the
 *            path's prefix in text-secondary before the name in text-primary,
 *            primary-hover while selected or hovered)
 *   right    gap 12: the agent mode (∞ + caret) and the context meter — a
 *            radius-40 background-tertiary pill, py 4 / pr 8 / pl 6, gap 4, the
 *            16px ring and the percentage
 *
 * Every label is body-2-medium text-secondary with 16px icon-secondary glyphs.
 */
export function ComposerStatusBarBase({
  branch,
  onBranchPress,
  folders,
  folder,
  defaultFolder,
  onFolderChange,
  mode,
  onModePress,
  context,
  labels: labelOverrides,
  style,
  testID,
}: ComposerStatusBarProps) {
  useComposerWebCss();
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const Popover = useComposerPopover();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [folderName, setFolder] = useControllableState<string>({
    value: folder,
    defaultValue: defaultFolder ?? folders?.[0]?.name ?? '',
    onChange: onFolderChange,
  });
  const current = folders?.find((f) => f.name === folderName) ?? folders?.[0];

  return (
    <View
      testID={testID}
      style={[{ width: '100%', height: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {branch !== undefined ? (
          <StatusItem
            palette={palette}
            label={branch}
            onPress={onBranchPress}
            icon={
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <RiGitMergeLine width={16} height={16} fill={palette.iconSecondary} />
              </View>
            }
          />
        ) : null}
        {folders && folders.length > 0 && current ? (
          <>
            <StatusItem
              palette={palette}
              triggerRef={triggerRef}
              label={current.name}
              caret
              open={open}
              expanded={open}
              onPress={() => setOpen(!open)}
              testID={testID ? `${testID}-folder` : undefined}
              icon={<RiFolder2Line width={16} height={16} fill={palette.iconSecondary} />}
            />
            <Popover
              open={open}
              onOpenChange={setOpen}
              anchorRef={triggerRef}
              label={labels.folders}
              side="top"
              sideOffset={8}
              style={{
                width: EFFORT_WIDTH,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.surface,
                padding: 10,
                boxShadow: palette.shadowDropdown,
                gap: 0,
              }}>
              <View style={{ width: '100%', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                <Text variant="body-medium" style={{ paddingLeft: 8, color: palette.textSecondary }}>
                  {labels.folders}
                </Text>
                <View style={{ width: '100%', flexDirection: 'column', gap: 4 }}>
                  {folders.map((f) => (
                    <FolderRow
                      key={f.name}
                      folder={f}
                      selected={f.name === current.name}
                      palette={palette}
                      onPress={() => {
                        setFolder(f.name);
                        setOpen(false);
                      }}
                    />
                  ))}
                </View>
              </View>
            </Popover>
          </>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {mode !== undefined ? (
          <StatusItem
            palette={palette}
            label={mode}
            caret
            onPress={onModePress}
            icon={<RiInfinityLine width={16} height={16} fill={palette.iconSecondary} />}
          />
        ) : null}
        {context !== undefined ? (
          <View
            accessible
            accessibilityLabel={labels.context(context)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderRadius: 40,
              backgroundColor: palette.tertiary,
              paddingTop: 4,
              paddingBottom: 4,
              paddingRight: 8,
              paddingLeft: 6,
            }}>
            <ContextRing pct={context} palette={palette} />
            <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {`${context}%`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
