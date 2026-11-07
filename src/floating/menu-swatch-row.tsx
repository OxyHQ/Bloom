/**
 * A menu row of colour swatches, as a desktop file manager's context menu shows
 * its colour tags: a row of small circles, each a tag the selection can carry,
 * pressed to add it or take it away.
 *
 * ── WHAT EACH SWATCH SAYS ────────────────────────────────────────────────────
 *
 * Its state (`on`, `off`, or `mixed` when only some of the selection has it) is
 * drawn at rest, a tick or a dash inside the circle, and announced as the
 * checked state of a `menuitemcheckbox` named by the swatch's name, so a screen
 * reader says "Red, checked" on the web and on native alike. Under the pointer
 * or the keyboard the swatch grows and shows what pressing it does (`+` for off
 * and mixed, `×` for on) and the row's caption line says it in words, with the
 * text the application gives each swatch: Bloom holds none of an application's
 * strings.
 *
 * ── ONE ROW TO THE MENU'S KEYS ───────────────────────────────────────────────
 *
 * ↓ and ↑ stop on the row once, like any row; ← and → move between its
 * swatches (mirrored right to left), Enter and Space press the one reached.
 * On the web each swatch is a real focusable `menuitemcheckbox` and the row is
 * a group the panel's keys treat as one stop (`menu-keyboard.ts`,
 * `MENU_ROW_GROUP_SELECTOR`); in a platform popup the row is one row of the
 * panel's navigation, with ← and → its own (`popup-navigation.tsx`,
 * `PopupRowAcross`). At either end the arrow is the menu's again, so ← still
 * closes a submenu from the first swatch.
 *
 * In a phone's sheet there is no pointer and no caption: the swatches are a
 * row of 44pt buttons, their state drawn at rest.
 *
 * Pressing a swatch calls `onSelect(key)` and closes the menu like any row,
 * unless `keepOpen`.
 */
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, type View } from 'react-native';

import { FOCUS_SETTLE_MS } from '../hooks/use-accessibility-focus';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiAddLine as AddIcon } from '../icons/remix/RiAddLine';
import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
import { RiCloseLine as RemoveIcon } from '../icons/remix/RiCloseLine';
import { RiSubtractLine as MixedIcon } from '../icons/remix/RiSubtractLine';
import { AA_LARGE_TEXT_CONTRAST, contrastRatio, mixColors } from '../styles/color-contrast';
import { StyledPressable, StyledText, StyledView } from '../styles/styled-primitives';
import { parseRgba } from '../theme/color-utils';
import { useTheme } from '../theme/use-theme';
import { ROW_DISABLED_CLASS, ROW_ENABLED_CLASS } from './constants';
import { useMenuSurface } from './context';
import { useMenuPalette } from './menu-palette';
import { useMenuRowAlignment } from './menu-row-alignment';
import { menuType } from './menu-type';
import { cx } from './shared';
import { type PopupRowAcross, usePopupNavigationRow } from './popup-navigation';
import type { MenuSwatch, MenuSwatchRowProps } from './types';
import { useMenuDensity } from './use-menu-density';

const NO_ROW_TRAITS = { gutter: false, leading: false } as const;

/**
 * The swatch's geometry: the pressable box, the circle at rest, the circle lit
 * (under the pointer or the keyboard), the glyph in each, and the space
 * between boxes. A desktop's is a menu's 14px dot in a 20px box; a sheet's is
 * a 44pt touch target.
 */
export const SWATCH_GEOMETRY = {
  pointer: { box: 20, dot: 14, lit: 20, glyph: 10, litGlyph: 14, gap: 2 },
  touch: { box: 44, dot: 28, lit: 32, glyph: 16, litGlyph: 20, gap: 4 },
} as const;

const GLYPH_LIGHT = '#FFFFFF';
const GLYPH_DARK = '#1C1C1E';

/**
 * The glyph drawn on a swatch: white, as a desktop draws it on its tag colours,
 * wherever white holds the 3:1 a graphical object needs (WCAG 1.4.11) on the
 * colour; near-black on a colour too pale for it (a yellow, an orange).
 */
export function swatchGlyphColor(color: string): string {
  return contrastRatio(color, GLYPH_LIGHT) >= AA_LARGE_TEXT_CONTRAST ? GLYPH_LIGHT : GLYPH_DARK;
}

/** The ring that keeps a pale swatch apart from a pale panel (and a dark one from a dark one). */
const RING_MIX = 0.22;

/** What a swatch's glyph shows: at rest its state, lit what pressing it does. */
export function swatchGlyph(
  state: MenuSwatch['state'],
  lit: boolean,
): 'check' | 'mixed' | 'add' | 'remove' | null {
  if (lit) return state === 'on' ? 'remove' : 'add';
  if (state === 'on') return 'check';
  if (state === 'mixed') return 'mixed';
  return null;
}

/** `aria-checked` for a swatch's state. */
export function swatchChecked(state: MenuSwatch['state']): boolean | 'mixed' {
  return state === 'mixed' ? 'mixed' : state === 'on';
}

/**
 * The index ← or → reaches from `from` among the enabled swatches, mirrored
 * right to left; null at the row's end.
 */
export function swatchAcross(
  swatches: readonly MenuSwatch[],
  from: number,
  key: 'ArrowLeft' | 'ArrowRight',
  rtl: boolean,
): number | null {
  const step = (key === 'ArrowRight') !== rtl ? 1 : -1;
  for (let index = from + step; index >= 0 && index < swatches.length; index += step) {
    if (!swatches[index]?.disabled) return index;
  }
  return null;
}

function firstEnabled(swatches: readonly MenuSwatch[]): number {
  return Math.max(
    0,
    swatches.findIndex((swatch) => !swatch.disabled),
  );
}

const GLYPHS = { check: CheckIcon, mixed: MixedIcon, add: AddIcon, remove: RemoveIcon } as const;

interface SwatchProps {
  swatch: MenuSwatch;
  disabled: boolean;
  lit: boolean;
  entry: boolean;
  touch: boolean;
  dark: boolean;
  fallbackRing: string;
  swatchRef: (node: ComponentRef<typeof View> | null) => void;
  onPress: () => void;
  onLight: () => void;
  onDim: () => void;
  testID?: string;
}

function Swatch({
  swatch,
  disabled,
  lit,
  entry,
  touch,
  dark,
  fallbackRing,
  swatchRef,
  onPress,
  onLight,
  onDim,
  testID,
}: SwatchProps) {
  const geometry = touch ? SWATCH_GEOMETRY.touch : SWATCH_GEOMETRY.pointer;
  const [pressed, setPressed] = useState(false);
  const shown = !disabled && (lit || (touch && pressed));
  const size = shown ? geometry.lit : geometry.dot;
  // The application's colour, with what Bloom draws on it read off that colour: a glyph that
  // reads on it, and a ring of the same hue pulled toward the panel's opposite.
  const paint = useMemo(() => {
    const parses = parseRgba(swatch.color) !== null;
    return {
      glyph: parses ? swatchGlyphColor(swatch.color) : GLYPH_LIGHT,
      ring: parses ? mixColors(swatch.color, dark ? '#FFFFFF' : '#000000', RING_MIX) : fallbackRing,
    };
  }, [swatch.color, dark, fallbackRing]);
  const glyph = swatchGlyph(swatch.state, shown);
  const Glyph = glyph ? GLYPHS[glyph] : null;
  const glyphSize = shown ? geometry.litGlyph : geometry.glyph;

  return (
    <StyledPressable
      ref={swatchRef}
      role={Platform.OS === 'web' ? 'menuitemcheckbox' : undefined}
      accessibilityRole="checkbox"
      accessibilityLabel={swatch.name}
      aria-checked={swatchChecked(swatch.state)}
      disabled={disabled}
      {...(Platform.OS === 'web' && entry ? { dataSet: { bloomMenuEntry: 'true' } } : null)}
      className={disabled ? ROW_DISABLED_CLASS : ROW_ENABLED_CLASS}
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : () => setPressed(true)}
      onPressOut={disabled ? undefined : () => setPressed(false)}
      onHoverIn={disabled ? undefined : onLight}
      onHoverOut={disabled ? undefined : onDim}
      onFocus={disabled ? undefined : onLight}
      onBlur={disabled ? undefined : onDim}
      style={{
        width: geometry.box,
        height: geometry.box,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
      testID={testID}
    >
      <StyledView
        pointerEvents="none"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: swatch.color,
          borderWidth: 1,
          borderColor: paint.ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Glyph ? <Glyph width={glyphSize} height={glyphSize} fill={paint.glyph} /> : null}
      </StyledView>
    </StyledPressable>
  );
}

/**
 * The row itself, shared by every family; `createMenuRows` publishes it under
 * each family's prefix (`DropdownMenuSwatchRow`, `ContextMenuSwatchRow`).
 */
export function MenuSwatchRow({
  swatches,
  onSelect,
  keepOpen = false,
  disabled = false,
  accessibilityLabel,
  className,
  style,
  testID,
}: MenuSwatchRowProps) {
  const surface = useMenuSurface();
  const palette = useMenuPalette();
  const density = useMenuDensity();
  const theme = useTheme();
  const rtl = useIsRtl();
  const column = useMenuRowAlignment(NO_ROW_TRAITS);
  const touch = density.touch;
  const geometry = touch ? SWATCH_GEOMETRY.touch : SWATCH_GEOMETRY.pointer;

  // The swatch under the pointer or holding focus; the one the keys last reached (the row's
  // entry to the menu's ↓ and ↑, and the one Enter presses in a platform popup).
  const [lit, setLit] = useState<number | null>(null);
  const [entry, setEntry] = useState(() => firstEnabled(swatches));
  const entryIndex = swatches[entry] && !swatches[entry].disabled ? entry : firstEnabled(swatches);
  const nodes = useRef<(ComponentRef<typeof View> | null)[]>([]);

  const latest = useRef({ swatches, onSelect, keepOpen, entryIndex, rtl, surface });
  latest.current = { swatches, onSelect, keepOpen, entryIndex, rtl, surface };

  const press = (index: number) => {
    const current = latest.current;
    const swatch = current.swatches[index];
    if (!swatch || swatch.disabled) return;
    current.onSelect(swatch.key);
    if (!current.keepOpen) current.surface.close();
  };

  const across = useMemo<PopupRowAcross>(() => {
    const reach = (key: 'ArrowLeft' | 'ArrowRight') => {
      const current = latest.current;
      return swatchAcross(current.swatches, current.entryIndex, key, current.rtl);
    };
    return {
      takes: (key) => reach(key) !== null,
      move: (key) => {
        const to = reach(key);
        if (to !== null) setEntry(to);
      },
    };
  }, []);
  const navigation = usePopupNavigationRow({
    disabled: disabled || swatches.every((swatch) => swatch.disabled),
    label: undefined,
    activate: () => press(latest.current.entryIndex),
    across,
  });

  // In a platform popup the keys make this row active: the screen reader's focus follows the
  // swatch they reached, as it follows a row (`MenuRowShell`).
  useEffect(() => {
    if (!navigation.byKeys || Platform.OS === 'web') return undefined;
    const timer = setTimeout(() => {
      const node = nodes.current[entryIndex];
      if (node) AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
    }, FOCUS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [navigation.byKeys, entryIndex]);

  // The web's ← and →: real focus moves between the swatches, and the key is taken (so a
  // flyout's ← and a menu bar's arrows leave it) only when there is a swatch to move to.
  const rowRef = useRef<ComponentRef<typeof View> | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const element = rowRef.current as unknown as HTMLElement | null;
    if (!element || typeof element.addEventListener !== 'function') return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const from = nodes.current.findIndex(
        (node) => (node as unknown as Element | null) === document.activeElement,
      );
      if (from < 0) return;
      const to = swatchAcross(latest.current.swatches, from, event.key, latest.current.rtl);
      if (to === null) return;
      event.preventDefault();
      (nodes.current[to] as unknown as HTMLElement | null)?.focus();
    };
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, []);

  const shownIndex = lit ?? (navigation.active ? entryIndex : null);
  const caption = shownIndex === null ? undefined : swatches[shownIndex]?.caption;
  const hasCaptions = !touch && swatches.some((swatch) => swatch.caption);
  const captionType = 'caption-1-medium';

  return (
    <StyledView
      ref={rowRef}
      collapsable={false}
      role="group"
      accessibilityLabel={accessibilityLabel}
      {...(Platform.OS === 'web' ? { dataSet: { bloomMenuRowGroup: 'swatches' } } : null)}
      className={cx('rounded-[10px]', className)}
      style={[
        {
          paddingInlineStart: column.gutter ? density.gutter : 8,
          paddingInlineEnd: 8,
          paddingTop: 4,
          paddingBottom: 4,
        },
        style,
      ]}
      testID={testID}
    >
      <StyledView
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: geometry.gap,
          rowGap: geometry.gap,
        }}
      >
        {swatches.map((swatch, index) => (
          <Swatch
            key={swatch.key}
            swatch={swatch}
            disabled={disabled || !!swatch.disabled}
            lit={shownIndex === index}
            entry={index === entryIndex}
            touch={touch}
            dark={theme.isDark}
            fallbackRing={palette.border}
            swatchRef={(node) => {
              nodes.current[index] = node;
            }}
            onPress={() => press(index)}
            onLight={() => {
              setLit(index);
              setEntry(index);
              navigation.hover();
            }}
            onDim={() => setLit((current) => (current === index ? null : current))}
            testID={testID ? `${testID}-${swatch.key}` : undefined}
          />
        ))}
      </StyledView>
      {hasCaptions ? (
        // One line, kept while empty so the menu does not change height under the pointer.
        // Hidden from assistive technology: each swatch's name and checked state say it.
        <StyledText
          aria-hidden
          numberOfLines={1}
          style={[
            menuType(captionType),
            { color: palette.textSecondary, minHeight: 16, marginTop: 2 },
          ]}
        >
          {caption ?? ''}
        </StyledText>
      ) : null}
    </StyledView>
  );
}
