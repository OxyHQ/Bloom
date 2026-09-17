import React, { Fragment, memo, useMemo } from 'react';
import { Image, View, type GestureResponderEvent } from 'react-native';

import { GlyphButton } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiMusic2Line } from '../icons/remix/RiMusic2Line';
import { resolvePhoto } from '../listing-card/shared';
import { useImageResolver } from '../image-resolver/context';
import { borderRadius } from '../styles/tokens';
import type { WebAriaProps } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { IS_WEB, resolveTrackListPaint } from './shared';
import type { TrackIconComponent, TrackMenuItem } from './types';

/** The props `DropdownMenuTrigger asChild` merges onto its child. */
interface TrackIconButtonProps {
  icon: TrackIconComponent;
  accessibilityLabel: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /** A toggle: sets `aria-pressed` and `accessibilityState.selected`, and paints `activeColor`. */
  pressed?: boolean;
  activeColor?: string;
  glyph?: number;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  accessibilityRole?: 'button';
  testID?: string;
}

/**
 * A 32px round glyph button: muted at rest, the text colour under the pointer,
 * `activeColor` while pressed. Colour change only. Its press never reaches the
 * row behind it.
 *
 * `button/GlyphButton` with this family's 32 box, 20 glyph and 0.4 disabled dim
 * — the only thing left here is the row-press guard.
 */
export function TrackIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  pressed,
  activeColor,
  glyph = 20,
  testID,
  accessibilityRole: _role,
  ...aria
}: TrackIconButtonProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  return (
    <GlyphButton
      {...aria}
      icon={Icon}
      size={32}
      glyphSize={glyph}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      pressed={pressed}
      color={paint.textMuted}
      hoverColor={paint.text}
      // No `activeColor` means the toggle keeps the plain colours, which is what
      // this drew before: `pressed && activeColor` was the whole condition.
      activeColor={activeColor ?? paint.textMuted}
      activeHoverColor={activeColor ?? paint.text}
      fill="transparent"
      hoverFill="transparent"
      ring={paint.ring}
      disabledOpacity={0.4}
      onPress={(event: GestureResponderEvent) => {
        if (IS_WEB) event.stopPropagation?.();
        onPress?.(event);
      }}
      testID={testID}
    />
  );
}

/** Artwork with a neutral placeholder and a note glyph when there is none. */
export const TrackCover = memo(function TrackCover({
  cover,
  size,
  radius,
  dimmed,
}: {
  cover?: string;
  size: number;
  radius: number;
  dimmed?: boolean;
}) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  const resolver = useImageResolver();
  const uri = cover ? resolvePhoto(cover, resolver, 'thumb') : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: paint.coverPlaceholder,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityIgnoresInvertColors
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <RiMusic2Line width={size / 2} height={size / 2} fill={paint.textMuted} />
      )}
    </View>
  );
});

/** The "More options" button and the menu it opens. `open` is controlled so a key or a long press can open it too. */
export function TrackMenu({
  items,
  label,
  open,
  onOpenChange,
  testID,
}: {
  items: Array<TrackMenuItem | 'separator'>;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testID?: string;
}) {
  const theme = useTheme();
  const paint = useMemo(() => resolveTrackListPaint(theme), [theme]);
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild label={label}>
        <TrackIconButton icon={RiMore2Fill} accessibilityLabel={label} testID={testID} />
      </DropdownMenuTrigger>
      <DropdownMenuContent label={label} align="end" minWidth={220}>
        {items.map((item, i) =>
          item === 'separator' ? (
            <Fragment key={`separator-${i}`}>
              <DropdownMenuSeparator />
            </Fragment>
          ) : (
            <DropdownMenuItem
              key={item.key}
              onPress={item.onPress}
              disabled={item.disabled}
              variant={item.destructive ? 'destructive' : 'default'}
              leading={
                item.icon ? (
                  <item.icon width={18} height={18} fill={paint.textMuted} />
                ) : undefined
              }
            >
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
