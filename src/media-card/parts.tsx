import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { useImageResolver } from '../image-resolver/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import {
  clampFraction,
  IS_WEB,
  MEDIA_CARD_CSS,
  MEDIA_CARD_STYLE_ID,
  resolveArtworkUri,
  resolveCoverTint,
  type MediaCardPaint,
} from './shared';
import type { MediaCardMenuItem } from './types';

type GlyphComponent = React.ComponentType<{ width?: number; height?: number; fill?: string }>;

export function useMediaCardCss(): void {
  React.useEffect(() => {
    adoptStyleSheet(MEDIA_CARD_STYLE_ID, MEDIA_CARD_CSS);
  }, []);
}

// ---------------------------------------------------------------------------
//  Covers
// ---------------------------------------------------------------------------

let gradientId = 0;

/**
 * A diagonal two-stop gradient filling its parent. Both stops are OPAQUE:
 * react-native-svg discards the alpha inside `stopColor`.
 */
export function CoverGradient({ top, bottom }: { top: string; bottom: string }) {
  const id = useMemo(() => `bloom-media-card-cover-${gradientId++}`, []);
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={top} stopOpacity={1} />
          <Stop offset="1" stopColor={bottom} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export interface ArtworkProps {
  source?: string;
  variant?: string;
  width: number;
  height: number;
  round?: boolean;
  radius: number;
  /** Paints a generated gradient cover when there is no image. */
  color?: string;
  /** Glyph on the generated / placeholder cover. */
  icon?: GlyphComponent;
  /** Replaces the drawn content. */
  children?: React.ReactNode;
  paint: MediaCardPaint;
  testID?: string;
}

/**
 * One cover: the image, or — without one — a gradient from `color` (neutral
 * placeholder without a colour) with a centred glyph. Decorative: the card's
 * name already says what it is.
 */
export function Artwork({
  source,
  variant,
  width,
  height,
  round = false,
  radius,
  color,
  icon: Icon,
  children,
  paint,
  testID,
}: ArtworkProps) {
  const theme = useTheme();
  const resolver = useImageResolver();
  const uri = resolveArtworkUri(source, resolver, variant);
  const tint = useMemo(() => (color ? resolveCoverTint(theme, color) : null), [theme, color]);
  const glyph = Math.round(Math.min(48, Math.max(16, Math.min(width, height) * 0.36)));

  let content: React.ReactNode;
  if (children) content = children;
  else if (uri)
    content = (
      <Image
        source={{ uri }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={{ width: '100%', height: '100%' }}
      />
    );
  else
    content = (
      <>
        {tint ? <CoverGradient top={tint.top} bottom={tint.bottom} /> : null}
        {Icon ? (
          // Positioned, so it paints above the absolutely-positioned gradient on web.
          <View style={{ position: 'relative' }}>
            <Icon width={glyph} height={glyph} fill={tint ? tint.textMuted : paint.placeholderGlyph} />
          </View>
        ) : null}
      </>
    );

  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        width,
        height,
        flexShrink: 0,
        borderRadius: round ? borderRadius.full : radius,
        overflow: 'hidden',
        backgroundColor: paint.placeholder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID={testID}
    >
      {content}
    </View>
  );
}

/**
 * Up to four covers in a 2×2 grid, reading order. Fewer than four: the empty
 * cells are the placeholder colour; one cover fills the whole box.
 */
export function Mosaic({
  sources,
  width,
  height,
  paint,
  testID,
}: {
  sources: ReadonlyArray<string>;
  width: number;
  height: number;
  paint: MediaCardPaint;
  testID?: string;
}) {
  const resolver = useImageResolver();
  const covers = sources.slice(0, 4);
  if (covers.length === 1) {
    const uri = resolveArtworkUri(covers[0], resolver);
    return uri ? (
      <Image source={{ uri }} resizeMode="cover" style={{ width, height }} testID={testID} />
    ) : null;
  }
  const cellW = width / 2;
  const cellH = height / 2;
  return (
    <View
      style={{ width, height, flexDirection: 'row', flexWrap: 'wrap' }}
      testID={testID}
    >
      {[0, 1, 2, 3].map((index) => {
        const uri = resolveArtworkUri(covers[index], resolver);
        return uri ? (
          <Image
            key={index}
            source={{ uri }}
            resizeMode="cover"
            style={{ width: cellW, height: cellH }}
            testID={testID ? `${testID}-${index}` : undefined}
          />
        ) : (
          <View
            key={index}
            style={{ width: cellW, height: cellH, backgroundColor: paint.placeholder }}
            testID={testID ? `${testID}-${index}` : undefined}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Listening progress
// ---------------------------------------------------------------------------

/**
 * How much of an episode or book has been heard: a 4px pill rail, accent fill.
 * A `progressbar` named by `label`, valued 0..100.
 */
export function ListenProgress({
  value,
  paint,
  label = 'Listened',
  width,
  style,
  testID,
}: {
  value: number;
  paint: MediaCardPaint;
  label?: string;
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const pct = Math.round(clampFraction(value) * 100);
  return (
    <View
      role="progressbar"
      accessibilityLabel={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}%`}
      style={[
        {
          height: 4,
          width,
          flexGrow: width === undefined ? 1 : 0,
          flexShrink: 1,
          minWidth: 24,
          borderRadius: borderRadius.full,
          backgroundColor: paint.rail,
          overflow: 'hidden',
        },
        style,
      ]}
      testID={testID}
    >
      <View
        style={{ width: `${pct}%`, height: '100%', borderRadius: borderRadius.full, backgroundColor: paint.fill }}
        testID={testID ? `${testID}-fill` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
//  The link that covers the card
// ---------------------------------------------------------------------------

export interface CardLinkProps {
  name: string;
  onPress?: () => void;
  href?: string;
  onLongPress?: () => void;
  selected?: boolean;
  radius: number;
  paint: MediaCardPaint;
  testID?: string;
}

/**
 * THE CARD'S LINK IS A SIBLING LAID UNDER ITS CONTENT, NOT A WRAPPER AROUND
 * IT. It fills the card absolutely and carries the whole name; the artwork and
 * text are drawn over it with `pointerEvents="none"`, so a press on them falls
 * through to the link, while the play button, the menu trigger, a like button
 * or an artist link are drawn over it as their OWN targets. A button inside an
 * anchor is invalid HTML and would make every inner press open the card.
 */
export function CardLink({ name, onPress, href, onLongPress, selected = false, radius, paint, testID }: CardLinkProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };
  const style: WebCssStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius,
    '--bloom-media-card-ring': paint.ring,
  };
  const interactive = Boolean(onPress || href);
  return (
    <Pressable
      {...webDataSet({ bloomMediaCardLink: '' })}
      {...(IS_WEB && href ? { href } : null)}
      {...(IS_WEB && selected ? { 'aria-current': 'true' } : null)}
      role={href ? 'link' : interactive ? 'button' : undefined}
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPress={onPress || (!IS_WEB && href) ? handlePress : undefined}
      onLongPress={onLongPress}
      style={style}
      testID={testID ? `${testID}-link` : undefined}
    />
  );
}

// ---------------------------------------------------------------------------
//  "More options"
// ---------------------------------------------------------------------------

export function hasMenu(menu: React.ReactNode, items?: ReadonlyArray<MediaCardMenuItem>): boolean {
  return menu != null || (items != null && items.length > 0);
}

/**
 * The "More options" trigger and its menu (a dropdown on web, a sheet on
 * native). Controlled by the card so a right-click or a long press on the card
 * opens the same menu.
 */
export function CardMenu({
  items,
  menu,
  label = 'More options',
  subject,
  open,
  onOpenChange,
  reveal,
  testID,
}: {
  items?: ReadonlyArray<MediaCardMenuItem>;
  menu?: React.ReactNode;
  label?: string;
  subject: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reveal: boolean;
  testID?: string;
}) {
  const name = `${label} for ${subject}`;
  return (
    <View
      {...webDataSet({ bloomMediaCardMenu: '', ...(reveal ? { bloomMediaCardReveal: 'hover' } : null) })}
      style={{ flexShrink: 0 }}
    >
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild label={name}>
          <Button
            variant="ghost"
            size="small"
            iconOnly
            leadingIcon={RiMoreFill}
            accessibilityLabel={name}
            testID={testID ? `${testID}-menu` : undefined}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent label={label} align="end">
          {menu ??
            items?.map((item, index) => (
              <DropdownMenuItem
                key={`${index}-${item.label}`}
                onPress={item.onPress}
                disabled={item.disabled}
                leading={item.icon}
                variant={item.destructive ? 'destructive' : 'default'}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}
