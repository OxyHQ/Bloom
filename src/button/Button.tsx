import { useSurfaceLayer } from '../surface/use-surface-layer';
import type { LinkButtonProps } from './types';
import React, { forwardRef, useMemo, useRef, useEffect, memo, type ComponentType, createContext, useContext } from 'react';
import { resolveIconSlot } from '../icons/render-icon';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SurfacePaint } from '../surface/SurfacePaint';
import { styled } from 'react-native-css';

import { useBloomAppearance } from '../appearance/context';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { useInteractionState } from '../hooks/use-interaction-state';
import { BUTTON_RADIUS, BUTTON_SHADOW, ICON_BUTTON_ICON_SIZE, LINK_BUTTON_GAP, isIconComponent, resolveLinkButtonPalette, resolveButtonGeometry, resolveButtonPalette, resolveButtonUnderline, type ButtonResolvedSize } from './shared';
import type { ButtonProps } from './types';

/** Raw text descendants need a native Text host; layout content stays unwrapped. */
function isTextContent(node: React.ReactNode): boolean {
  if (node == null || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') return true;
  if (Array.isArray(node)) return node.every(isTextContent);
  return React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment && isTextContent(node.props.children);
}

/** Keep contiguous labels together so the button's gap only separates layout nodes. */
function renderTextContent(node: React.ReactNode, wrap: (text: React.ReactNode) => React.ReactNode): React.ReactNode {
  if (isTextContent(node)) return wrap(node);
  const result: React.ReactNode[] = [];
  let run: React.ReactNode[] = [];
  let runKey = '';
  const flush = () => {
    if (run.length) result.push(<React.Fragment key={runKey}>{wrap(run)}</React.Fragment>);
    run = [];
  };
  const visit = (children: React.ReactNode, path: string) => {
    React.Children.toArray(children).forEach((child, index) => {
      const key = `${path}/${React.isValidElement(child) ? child.key ?? index : index}`;
      if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) {
        visit(child.props.children, key);
      } else if (typeof child === 'string' || typeof child === 'number') {
        if (!run.length) runKey = key;
        run.push(child);
      } else {
        flush();
        result.push(<React.Fragment key={key}>{child}</React.Fragment>);
      }
    });
  };
  visit(node, 'content');
  flush();
  return result;
}

export type {
  ButtonProps, LinkButtonProps,
  ButtonSize,
  ButtonFocusEvent,
  ButtonHoverEvent,
  ButtonIconComponent,
} from './types';

/**
 * Native fork of the button. Geometry and every state's colours come
 * from `./shared`, the same table `Button.web.tsx` reads.
 *
 */

/**
 * Vertical slack that brings each size's native touch target up to 44dp — the
 * floor `Checkbox` derives its own slack from, and the one Apple's HIG asks for.
 * Pinned as literals rather than derived from the height, because a value
 * computed from the thing it is checked against is checked by nothing:
 * `Button.test.tsx` asserts `height + 2 × top >= 44` for every size.
 *
 * Horizontal slack is deliberately ZERO — side slack is what makes two buttons
 * in a row steal each other's presses. Square buttons keep all-round slop.
 *
 * Native only: react-native-web drops `hitSlop`.
 */
const SIZE_HIT_SLOP = {
  xs: { top: 10, bottom: 10, left: 0, right: 0 },
  sm: { top: 6, bottom: 6, left: 0, right: 0 },
  md: { top: 4, bottom: 4, left: 0, right: 0 },
  lg: { top: 0, bottom: 0, left: 0, right: 0 },
} as const satisfies Record<ButtonResolvedSize, NonNullable<ButtonProps['hitSlop']>>;

/** A link hugs its 16–20px line box, so it needs the most vertical slack. */
const LINK_HIT_SLOP = { top: 12, bottom: 12, left: 0, right: 0 } as const;

const SQUARE_HIT_SLOP = {
  xs: { top: 10, bottom: 10, left: 10, right: 10 },
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 4, bottom: 4, left: 4, right: 4 },
  lg: { top: 0, bottom: 0, left: 0, right: 0 },
} as const satisfies Record<ButtonResolvedSize, NonNullable<ButtonProps['hitSlop']>>;

type HitSlop = { top: number; bottom: number; left: number; right: number };

/**
 * Android's floor is 48dp (Material), 4dp above the 44 the tables above reach —
 * so on Android every target grows 2dp at its top and bottom: `lg` (44dp tall,
 * no slack) reaches 48, and every smaller size clears 48 the same way. Squares
 * also grow 2dp at the sides, since they already take all-round slack; row
 * buttons and links do not, because side slack steals presses from a
 * neighbour. Two stacked buttons keep 4dp of every 8dp gap between them.
 */
const ANDROID_TARGET_EXTRA = 2;

function growVertical(slop: HitSlop): HitSlop {
  return { ...slop, top: slop.top + ANDROID_TARGET_EXTRA, bottom: slop.bottom + ANDROID_TARGET_EXTRA };
}

function growAllRound(slop: HitSlop): HitSlop {
  return {
    top: slop.top + ANDROID_TARGET_EXTRA,
    bottom: slop.bottom + ANDROID_TARGET_EXTRA,
    left: slop.left + ANDROID_TARGET_EXTRA,
    right: slop.right + ANDROID_TARGET_EXTRA,
  };
}

function mapSizes(
  table: Record<ButtonResolvedSize, HitSlop>,
  grow: (slop: HitSlop) => HitSlop,
): Record<ButtonResolvedSize, HitSlop> {
  return { xs: grow(table.xs), sm: grow(table.sm), md: grow(table.md), lg: grow(table.lg) };
}

const ANDROID_SIZE_HIT_SLOP = mapSizes(SIZE_HIT_SLOP, growVertical);
const ANDROID_SQUARE_HIT_SLOP = mapSizes(SQUARE_HIT_SLOP, growAllRound);
const ANDROID_LINK_HIT_SLOP = growVertical(LINK_HIT_SLOP);

// ---------------------------------------------------------------------------
//  The button renders ONE node — the same shape the web fork renders (one
//  `<button>`), so a caller's layout `className` lands on the box its parent
//  lays out. `styled()` comes from Bloom's own `react-native-css`, and both
//  wrappers are built ONCE at module scope so the element type is stable.
// ---------------------------------------------------------------------------

/**
 * Exactly the prop surface `Button` hands to the pressable — narrowing keeps
 * `styled()`'s dot-path mapping type from overflowing the checker (`TS2590`).
 */
type ButtonPressableProps = Pick<
  PressableProps,
  | 'accessibilityHint'
  | 'accessibilityLabel'
  | 'accessibilityRole'
  | 'accessibilityState'
  | 'className'
  | 'disabled'
  | 'hitSlop'
  | 'onFocus'
  | 'onBlur'
  | 'onHoverIn'
  | 'onHoverOut'
  | 'onPress'
  | 'onLongPress'
  | 'onLayout'
  | 'accessibilityElementsHidden'
  | 'importantForAccessibility'
  | 'onPressIn'
  | 'onPressOut'
  | 'testID'
> & { children?: React.ReactNode; style?: StyleProp<ViewStyle>; baseStyle?: StyleProp<ViewStyle>; 'aria-hidden'?: boolean; 'aria-expanded'?: boolean; 'aria-pressed'?: boolean; 'aria-current'?: ButtonProps['aria-current'] };

const CONTENT_TEXT_KEYS = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'lineHeight', 'letterSpacing', 'textAlign', 'textDecorationLine'] as const;

const ContentStyleContext = createContext<{ text?: TextStyle; layout?: ViewStyle }>({});

// Resolve utilities without mixing Bloom's defaults into their input. The
// defaults are merged only after interop, so caller classes have final say.
const ButtonPressable = forwardRef<View, ButtonPressableProps>(function ButtonPressable({
  baseStyle, style, children, ...props
}, ref) {
  const resolved = StyleSheet.flatten(style) as TextStyle | undefined;
  const layout: TextStyle = { ...resolved };
  const text: TextStyle = {};
  // Read a copy: the CSS resolver can share its cached style objects with
  // other controls. Moving properties out of that cache changes their styles.
  for (const key of CONTENT_TEXT_KEYS) {
    if (resolved?.[key] !== undefined) Object.assign(text, { [key]: resolved[key] });
    delete layout[key];
  }
  return <Pressable {...props} ref={ref} style={[baseStyle, layout]}>
    <ContentStyleContext.Provider value={{ text, layout }}>
      {children}
    </ContentStyleContext.Provider>
  </Pressable>;
});

function ButtonContent({ loading, gap, children }: {
  loading: boolean; gap: number; children: (style: TextStyle) => React.ReactNode;
}) {
  const { text, layout } = useContext(ContentStyleContext);
  const contentLayout = layout && {
    ...(layout.flexDirection !== undefined && { flexDirection: layout.flexDirection }),
    ...(layout.flexWrap !== undefined && { flexWrap: layout.flexWrap }),
    ...(layout.alignItems !== undefined && { alignItems: layout.alignItems }),
    ...(layout.justifyContent !== undefined && { justifyContent: layout.justifyContent }),
    ...(layout.gap !== undefined && { gap: layout.gap }),
    ...(layout.rowGap !== undefined && { rowGap: layout.rowGap }),
    ...(layout.columnGap !== undefined && { columnGap: layout.columnGap }),
  };
  return <View pointerEvents={loading ? 'none' : undefined}
    style={[styles.content, { gap }, contentLayout, loading && { opacity: 0 }]}
    importantForAccessibility={loading ? 'no-hide-descendants' : undefined}
    accessibilityElementsHidden={loading || undefined}>
    {children(text ?? {})}
  </View>;
}

function ButtonLoading({ color, fallback }: { color?: string; fallback: string }) {
  const { text } = useContext(ContentStyleContext);
  return <View pointerEvents="none" style={styles.loadingOverlay}>
    <ActivityIndicator size="small" color={color ?? text?.color ?? fallback} />
  </View>;
}

const ButtonInterop: ComponentType<ButtonPressableProps> = ButtonPressable;
const StyledPressable: ComponentType<ButtonPressableProps & React.RefAttributes<View>> = styled(ButtonInterop, {
  className: 'style',
});

const ButtonComponent = forwardRef<View, ButtonProps>(function ButtonComponent({
  onPress,
  onFocus,
  onBlur,
  onHoverIn,
  onHoverOut,
  onLayout,
  'aria-hidden': ariaHidden,
  accessibilityElementsHidden,
  importantForAccessibility,
  colors,
  material = 'surface',
  onLongPress,
  onPressIn,
  onPressOut,
  children,
  disabled = false,
  pressed: togglePressed,
  stopPropagation = false,
  appearance: appearanceProp,
  tone: toneProp,
  size: sizeProp,
  style,
  textStyle,
  icon,
  iconSize: iconSizeProp,
  leading,
  trailing,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  renderLeadingIcon,
  renderTrailingIcon,
  iconOnly = false,
  linkTone,
  underline,
  textVariant,
  numberOfLines,
  href,
  loading = false,
  loadingColor,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  hitSlop,
  testID,
  className,
  'aria-current': ariaCurrent,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
}, ref) {
  const theme = useTheme();
  const layer = useSurfaceLayer();
  const appearance = appearanceProp ?? 'solid';
  const { size, tone } = useBloomAppearance({ size: sizeProp, tone: toneProp }, { size: 'md', tone: 'accent' });
  const geometry = resolveButtonGeometry(size, textVariant);
  const isSquare = iconOnly || (icon != null && children == null);
  const isIconVariant = isSquare;
  const isLink = appearance === 'plain' && (href != null || linkTone != null);
  const isInteractionBlocked = disabled || loading;
  const iconSize = typeof iconSizeProp === 'number' && Number.isFinite(iconSizeProp) && iconSizeProp > 0 ? iconSizeProp : isIconVariant ? ICON_BUTTON_ICON_SIZE[size] : geometry.iconSize;
  const palette = useMemo(
    () => isLink && linkTone != null && toneProp == null ? resolveLinkButtonPalette(theme, linkTone) : resolveButtonPalette(appearance, theme, tone, colors, layer.fill, material),
    [appearance, theme, tone, toneProp, isLink, linkTone, colors, layer.fill, material],
  );
  const underlineMode = resolveButtonUnderline(isLink, underline);

  // Pressed state drives the ACTIVE palette. Tracked through state rather than
  // Pressable's function-form `style`, which NativeWind's css-interop swallows
  // (dropping every base style with it).
  const { state: pressed, onIn: onPressedIn, onOut: onPressedOut } =
    useInteractionState();
  // Hover exists on this fork too: a react-native-web (Metro-web) consumer
  // renders THIS file, and `linkTone="text"` is the first tone whose hover
  // changes the foreground rather than only a background the web fork's
  // stylesheet owned. On a real device no hover event is ever dispatched, so
  // `hovered` stays false and nothing about native changes.
  const { state: hovered, onIn: onHoveredIn, onOut: onHoveredOut } =
    useInteractionState();

  // No press scale: a 0.98 scale-down was deliberately left out, so a press is
  // the active paint alone.
  const previewActive = useRef(false);
  const pressOutCallback = useRef(onPressOut);
  pressOutCallback.current = onPressOut;
  const handlePressIn = isInteractionBlocked ? undefined : () => {
    onPressedIn();
    if (!previewActive.current) { previewActive.current = true; onPressIn?.(); }
  };
  const handlePressOut = () => {
    onPressedOut();
    if (previewActive.current) { previewActive.current = false; pressOutCallback.current?.(); }
  };
  useEffect(() => {
    if (isInteractionBlocked && previewActive.current) {
      previewActive.current = false;
      onPressedOut();
      pressOutCallback.current?.();
    }
  }, [isInteractionBlocked, onPressedOut]);
  useEffect(() => () => {
    if (previewActive.current) { previewActive.current = false; pressOutCallback.current?.(); }
  }, []);

  // A loading button keeps its rest paint under the spinner, like the web fork.
  const paint = disabled
    ? palette.disabled
    : (pressed || togglePressed) && !loading
      ? palette.active
      : hovered && !loading
        ? palette.hover
        : palette.rest;

  const baseStyles = useMemo((): ViewStyle => {
    const styles: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: geometry.gap,
      height: geometry.height,
      paddingHorizontal: geometry.paddingHorizontal,
      borderRadius: BUTTON_RADIUS,
      borderWidth: palette.borderWidth,
      borderColor: paint.border,
      // The gradient is a child layer, so the box itself stays clear of it.
      backgroundColor: paint.surface ? 'transparent' : paint.background,
    };
    if (palette.shadow) {
      styles.boxShadow = BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'];
    }
    if (disabled && palette.disabledOpacity != null) {
      styles.opacity = palette.disabledOpacity;
    }
    if (isSquare) {
      styles.width = geometry.height;
      styles.paddingHorizontal = 0;
    }
    if (isLink && !isSquare) {
      // LinkButton: no container — the label's own line box and a 4px
      // gap. The touch target comes back through `hitSlop`.
      styles.height = undefined;
      styles.paddingHorizontal = 0;
      styles.gap = LINK_BUTTON_GAP;
      styles.borderRadius = 4;
    }
    return styles;
  }, [geometry, palette, paint, theme.isDark, disabled, isSquare, isIconVariant, isLink]);

  // The type ramp step (size, line height, tracking, weight) comes from the
  // typography `Text` through `variant`; only the padding and colour are ours.
  const computedTextStyle = useMemo(
    (): TextStyle => ({
      paddingHorizontal: isLink ? 0 : geometry.labelPaddingHorizontal,
      color: paint.foreground,
      ...(underlineMode === 'rest' || (underlineMode === 'hover' && hovered && !disabled)
        ? { textDecorationLine: 'underline' as const }
        : null),
    }),
    [geometry, paint.foreground, isLink, underlineMode, hovered, disabled],
  );

  const android = Platform.OS === 'android';
  const defaultHitSlop = isSquare
    ? (android ? ANDROID_SQUARE_HIT_SLOP : SQUARE_HIT_SLOP)[size]
    : isLink
      ? (android ? ANDROID_LINK_HIT_SLOP : LINK_HIT_SLOP)
      : (android ? ANDROID_SIZE_HIT_SLOP : SIZE_HIT_SLOP)[size];

  const IconFromProp = icon != null && isIconComponent(icon) ? icon : null;
  const content = (classText: TextStyle) => {
    const foreground = typeof classText.color === 'string' ? classText.color : paint.foreground;
    const iconNode = IconFromProp ? (
      <IconFromProp width={iconSize} height={iconSize} fill={foreground} />
    ) : (
      (icon as React.ReactNode) ?? null
    );

    return (
      <>
        {resolveIconSlot(renderLeadingIcon, iconSize, foreground, () =>
          LeadingIcon ? (
            <LeadingIcon width={iconSize} height={iconSize} fill={foreground} />
          ) : null,
        )}
        {leading}
        {iconNode}
        {children != null && (!isSquare || (!renderLeadingIcon && !LeadingIcon && !iconNode))
          ? renderTextContent(children, text => (
            <Text variant={textVariant ?? geometry.type} numberOfLines={numberOfLines} style={[computedTextStyle, classText, textStyle]}>
              {text}
            </Text>
          )) : null}
        {trailing}
        {!isSquare
          ? resolveIconSlot(renderTrailingIcon, iconSize, foreground, () =>
              TrailingIcon ? (
                <TrailingIcon width={iconSize} height={iconSize} fill={foreground} />
              ) : null,
            )
          : null}
      </>
    );
  };

  // Native has no current-destination trait; selected is its equivalent.
  const selected = togglePressed ?? (ariaCurrent === undefined ? undefined : ariaCurrent !== false && ariaCurrent !== 'false');
  const handlePress = isInteractionBlocked
    ? undefined
    : onPress ?? (href != null ? () => void Linking.openURL(href) : undefined);

  return (
    <StyledPressable
      ref={ref}
      onLayout={onLayout}
      aria-hidden={ariaHidden}
      accessibilityElementsHidden={accessibilityElementsHidden}
      importantForAccessibility={importantForAccessibility}
      className={className}
      baseStyle={baseStyles}
      style={style}
      onLongPress={isInteractionBlocked ? undefined : onLongPress}
      onPress={handlePress ? event => {
        if (stopPropagation) event.stopPropagation();
        handlePress(event);
      } : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={onFocus}
      onBlur={onBlur}
      onHoverIn={isInteractionBlocked ? undefined : event => { onHoveredIn(); onHoverIn?.(event); }}
      onHoverOut={event => { onHoveredOut(); onHoverOut?.(event); }}
      disabled={isInteractionBlocked}
      hitSlop={hitSlop ?? defaultHitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole ?? (href != null ? 'link' : 'button')}
      // `aria-busy` matches what `Button.web.tsx` emits; react-native-web never
      // reads `accessibilityState`, React Native folds `aria-busy` back into it.
      aria-busy={loading || undefined}
      aria-pressed={togglePressed}
      aria-current={Platform.OS === 'web' ? ariaCurrent : undefined}
      accessibilityState={{ disabled: isInteractionBlocked, busy: loading, ...(selected === undefined ? {} : { selected }) }}
      // Forwarded from an anchored family's `asChild` trigger — see
      // `ButtonProps['aria-expanded']`.
      aria-expanded={ariaExpanded}
      {...(ariaHasPopup == null ? {} : { 'aria-haspopup': ariaHasPopup })}
      testID={testID}
    >
      {paint.surface ? (
        <SurfacePaint fill={paint.background} radius={StyleSheet.flatten(style)?.borderRadius ?? BUTTON_RADIUS} />
      ) : null}
      <ButtonContent loading={loading} gap={geometry.gap}>{content}</ButtonContent>
      {loading ? <ButtonLoading color={loadingColor} fallback={paint.foreground} /> : null}
    </StyledPressable>
  );
});

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const Button = memo(ButtonComponent);
Button.displayName = 'Button';

export const PrimaryButton = memo((props: ButtonProps) => (
  <Button appearance="solid" tone="accent" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const IconButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} iconOnly />
));
IconButton.displayName = 'IconButton';

export const GhostButton = memo((props: ButtonProps) => (
  <Button appearance="subtle" tone="accent" {...props} />
));
GhostButton.displayName = 'GhostButton';

export const InverseButton = memo((props: ButtonProps) => {
  const theme = useTheme();
  return <Button appearance="solid" tone="neutral" colors={props.appearance == null && props.tone == null ? { background: theme.colors.text, foreground: theme.colors.background } : undefined} {...props} />;
});
InverseButton.displayName = 'InverseButton';

export const TextButton = memo((props: ButtonProps) => (
  <Button appearance="plain" tone="accent" {...props} />
));
TextButton.displayName = 'TextButton';

// Named compositions share the canonical appearance and tone axes.
export const OutlineButton = memo((props: ButtonProps) => (
  <Button appearance="outline" tone="neutral" {...props} />
));
OutlineButton.displayName = 'OutlineButton';

/**
 * `LinkButton`: an inline text action — no fill, no border, the label
 * (plus icons) in the accent or secondary colour. `linkTone` is its colour; pass
 * `href` to open a URL.
 */
export const LinkButton = memo(({ linkTone = 'primary', ...props }: LinkButtonProps) => (
  <Button appearance="plain" {...props} linkTone={linkTone} />
));
LinkButton.displayName = 'LinkButton';

export const DestructiveButton = memo((props: ButtonProps) => (
  <Button appearance="solid" tone="danger" {...props} />
));
DestructiveButton.displayName = 'DestructiveButton';
