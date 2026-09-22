import { useBloomAppearance } from '../appearance';
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  MENU_WIDTH,
  ROW_ICON_SIZE,
  ROW_INDICATOR_END_CLASS,
  SELECT_CHEVRON_SIZE,
  SELECT_ITEM_CLASS,
  SELECT_ITEM_SIZE_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_MAX_HEIGHT,
  SELECT_SEPARATOR_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_POPUP,
  SELECT_TRIGGER_SIZE_CLASS,
  SELECT_VALUE_CLASS,
} from '../floating/constants';
import { FloatingPanel } from '../floating/FloatingPanel';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType, menuTypeClass } from '../floating/menu-type';
import { cx } from '../floating/shared';
import { TriggerSlot } from '../floating/TriggerSlot';
import { useAnchorRect } from '../floating/use-anchor-rect';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  StyledPressable,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
import { RiCheckLine as CheckIcon } from '../icons/remix/RiCheckLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  defaultExtractLabel,
  defaultItemValueExtractor,
  ItemContext,
  SelectChevron,
  SelectTriggerStateContext,
  SelectValueRow,
  useSelectItemContext,
  VALUE_TYPE,
} from './shared';
import type {
  SelectContentProps,
  SelectIconProps,
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectProps,
  SelectItemContextValue,
  SelectTriggerProps,
  SelectValueProps,
} from './types';
import { useFieldMembership } from '../field/membership';

/** The trigger's `offset={4}`. */
const SELECT_OFFSET = 4;

/**
 * The trigger's interactive states — `hover:bg-background-primary-hover
 * hover:border-border-button-hover` and `focus-visible:ring-2 ring-offset-2
 * ring-border-focus-ring`, on `transition-[background-color,border-color,
 * box-shadow] duration-200 ease`.
 *
 * A sheet because inline styles have no `:hover`, and every colour arrives as a
 * `--bloom-select-*` custom property set inline, since the ramp stops exist as no
 * CSS variable. The field is the CHILD of `TriggerSlot`'s pressable — the node
 * that is hovered and focused — so the rules select through that parent, and the
 * pressable's own focus outline gives way to the ring.
 */
const TRIGGER_STYLE_ID = 'bloom-select-trigger-web-css';
const FIELD = '[data-bloom-select-field]';
const TRIGGER_CSS = `
${FIELD} {
  background-color: var(--bloom-select-bg);
  border-color: var(--bloom-select-border);
  box-shadow: var(--bloom-select-shadow);
  transition: background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
*:hover > ${FIELD}:not([data-disabled]) {
  background-color: var(--bloom-select-bg-hover);
  border-color: var(--bloom-select-border-hover);
}
*:focus-visible > ${FIELD} {
  box-shadow: 0 0 0 2px var(--bloom-select-ring-offset), 0 0 0 4px var(--bloom-select-ring), var(--bloom-select-shadow);
}
*:has(> ${FIELD}):focus-visible {
  outline: none;
}
*:has(> ${FIELD}[data-disabled]) {
  cursor: not-allowed;
}
@media (prefers-reduced-motion: reduce) {
  ${FIELD} { transition: none; }
}
`;

/** The chevron's `transition-transform duration-200 ease` into `rotate-180`. */
const CHEVRON_TRANSITION: WebCssStyle = {
  transitionProperty: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease',
};

/** The row `transition-colors`. */
const ROW_TRANSITION: WebCssStyle = {
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = Pick<SelectProps, 'value' | 'onValueChange' | 'disabled'> & {
  size: NonNullable<SelectProps['size']>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** The trigger box, so `SelectContent` can anchor itself against it. */
  triggerRef: React.RefObject<View | null>;
};

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = 'SelectContext';

/**
 * The ITEM behind the current value, published by `SelectContent` and read by
 * `SelectValue` — the native fork's store, on web too.
 *
 * `SelectContent` renders (and so resolves the item) while its panel is still
 * closed, so the trigger shows the option's LABEL from the first paint. Web used
 * to show the raw `value` string instead (`apple`, not `Apple`), because its
 * `SelectValue` had nothing but the value to read.
 */
const ValueStoreContext = createContext<
  [unknown, React.Dispatch<React.SetStateAction<unknown>>]
>([undefined, () => {}]);
ValueStoreContext.displayName = 'SelectValueStoreContext';

function useSelectContext(): SelectContextValue {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    throw new Error('Select components must be used within a Select');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export function Select({ children, value, onValueChange, disabled, size: sizeProp }: SelectProps) {
  const {size: inheritedSize} = useBloomAppearance({size: sizeProp}, {size: 'md', tone: 'neutral'});
  const size = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View | null>(null);
  const valueStoreState = useState<unknown>(undefined);

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      disabled,
      size,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      triggerRef,
    }),
    [value, onValueChange, disabled, size, isOpen],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <ValueStoreContext.Provider value={valueStoreState}>{children}</ValueStoreContext.Provider>
    </SelectContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

/**
 * Opens the dropdown, and is the box it anchors to.
 *
 * See the native fork for why the render-prop form is gone: it published a
 * `state` object whose `pressed` was a hardcoded `false` and whose `hovered`
 * the native fork never computed at all, so trigger press and hover styling was
 * dead on one platform and half-dead on the other while the API read as though
 * the feature existed.
 */
export function SelectTrigger({
  children,
  asChild,
  disabled,
  label,
  className,
  style,
  fieldStyle: fieldStyleOverride,
  testID,
}: SelectTriggerProps) {
  const ctx = useSelectContext();
  const palette = useMenuPalette();
  // The trigger IS the select's control — see the native fork.
  const membership = useFieldMembership({
    accessibilityLabel: label,
    disabled: disabled === true || ctx.disabled === true,
  });
  const isDisabled = membership.disabled;
  useEffect(() => {
    adoptStyleSheet(TRIGGER_STYLE_ID, TRIGGER_CSS);
  }, []);

  const t = palette.trigger;
  const fieldStyle: WebCssStyle = {
    borderRadius: borderRadius.full,
    '--bloom-select-bg': isDisabled ? t.disabledBackground : t.background,
    '--bloom-select-bg-hover': t.hoverBackground,
    '--bloom-select-border': t.border,
    '--bloom-select-border-hover': t.hoverBorder,
    '--bloom-select-shadow': isDisabled ? '0 0 #0000' : t.shadow,
    '--bloom-select-ring': t.ring,
    '--bloom-select-ring-offset': t.ringOffset,
  };

  // The select trigger — a bordered white field with the xs contact
  // shadow, `md` 38px / `sm` 28px tall from its padding — as a full pill. The
  // trigger IS the field. It used to render its children into a bare pressable
  // with no border, height or background at all, so the select was a line
  // of text and a chevron floating on the page.
  const field = (
    <StyledView
      {...({
        dataSet: isDisabled
          ? { bloomSelectField: '', disabled: '' }
          : { bloomSelectField: '' },
      } as Record<string, unknown>)}
      className={cx(SELECT_TRIGGER_CLASS, SELECT_TRIGGER_SIZE_CLASS[ctx.size], className)}
      style={[fieldStyle, fieldStyleOverride]}>
      {children}
    </StyledView>
  );

  const triggerState = useMemo(
    () => ({ disabled: isDisabled, open: ctx.isOpen, size: ctx.size }),
    [isDisabled, ctx.isOpen, ctx.size],
  );

  return (
    <SelectTriggerStateContext.Provider value={triggerState}>
      <TriggerSlot
        asChild={asChild}
        anchorRef={ctx.triggerRef}
        style={[styles.triggerSlot, style]}
        testID={testID}
        handle={{
          // A dropdown trigger TOGGLES — pressing an open select's trigger closes
          // it rather than reopening it.
          onPress: () => (ctx.isOpen ? ctx.close() : ctx.open()),
          disabled: isDisabled,
          accessibilityLabel: membership.accessibilityLabel,
          accessibilityRole: 'button',
          'aria-haspopup': SELECT_TRIGGER_POPUP,
          'aria-expanded': ctx.isOpen,
          nativeID: membership.nativeID,
          'aria-describedby': membership.describedBy,
          'aria-invalid': membership.invalid || undefined,
        }}
      >
        {asChild ? children : field}
      </TriggerSlot>
    </SelectTriggerStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

export function SelectValue({
  children: extractLabel = defaultExtractLabel,
  leading,
  placeholder,
  className,
  style,
}: SelectValueProps) {
  const { value } = useSelectContext();
  const [storedItem] = useContext(ValueStoreContext);
  const trigger = useContext(SelectTriggerStateContext);
  const palette = useMenuPalette();

  // The selected ITEM's label (`item => item.label` by default), exactly as the
  // native fork reads it. Before any `SelectContent` has resolved an item the raw
  // value is the fallback, so a select with no content still shows something.
  const display =
    value == null ? (placeholder ?? '') : storedItem !== undefined ? extractLabel(storedItem) : value;
  // `text-text-primary`, `text-placeholder` while nothing is chosen,
  // and `disabled:text-text-tertiary`. Inline only without a caller
  // `className` — an inline colour outranks a caller's `text-*` utility.
  const color = trigger.disabled
    ? palette.trigger.disabledForeground
    : value
      ? palette.text
      : palette.textPlaceholder;

  const text = (
    <StyledText
      numberOfLines={1}
      className={cx(
        SELECT_VALUE_CLASS[trigger.size],
        menuTypeClass(VALUE_TYPE[trigger.size], className),
        className && (value ? 'text-foreground' : 'text-muted-foreground'),
        className,
      )}
      style={[menuType(VALUE_TYPE[trigger.size], className), className ? null : { color }, style]}
    >
      {display}
    </StyledText>
  );
  if (leading === undefined) return text;
  return (
    <SelectValueRow size={trigger.size} leading={typeof leading === 'function' ? leading(storedItem) : leading}>
      {text}
    </SelectValueRow>
  );
}

/** `text-body-medium` on `md`, `text-body-2-medium` on `sm` — trigger value and option label alike. */
// ---------------------------------------------------------------------------
// SelectIcon
// ---------------------------------------------------------------------------

export function SelectIcon({ style }: SelectIconProps) {
  const palette = useMenuPalette();
  const trigger = useContext(SelectTriggerStateContext);
  // `ChevronDownSmall`: `shrink-0 text-text-secondary`, `size-4` /
  // `size-3.5`, turning over (`rotate-180`) while the list is open.
  return (
    <SelectChevron
      size={SELECT_CHEVRON_SIZE[trigger.size]}
      color={palette.textSecondary}
      style={[
        CHEVRON_TRANSITION,
        { flexShrink: 0, transform: [{ rotate: trigger.open ? '180deg' : '0deg' }] },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

export function SelectContent<T>({
  items,
  renderItem,
  label = 'Select an option',
  valueExtractor = defaultItemValueExtractor,
  maxHeight = SELECT_MAX_HEIGHT,
  width,
  className,
}: SelectContentProps<T>) {
  const ctx = useSelectContext();
  const [, setStoredItem] = useContext(ValueStoreContext);
  // Resolve the item behind the value on every change — including while closed,
  // which is what gives the trigger its label on the first paint — and clear it
  // when the value no longer matches an item.
  useLayoutEffect(() => {
    const item = items.find((candidate) => valueExtractor(candidate) === ctx.value);
    setStoredItem(() => item);
  }, [items, ctx.value, valueExtractor, setStoredItem]);
  const anchor = useAnchorRect(ctx.triggerRef, ctx.isOpen);
  const listRef = useRef<ScrollView | null>(null);

  // The list is a plain `max-h-[240px] overflow-auto` box: the native
  // scrollbar and nothing else. It used to carry shadcn's scroll-up/down
  // chevrons, which appeared and disappeared as the list moved and made the
  // whole panel jump in height under the pointer.
  //
  // Like react-aria's listbox, opening scrolls the selected option into view, so
  // a value far down a long list is not hidden below the fold.
  useEffect(() => {
    if (!ctx.isOpen) return undefined;
    const frame = requestAnimationFrame(() => {
      const node = (listRef.current as unknown as { getScrollableNode?: () => HTMLElement | null })
        ?.getScrollableNode?.();
      const selected = node?.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!node || !selected) return;
      const top = selected.offsetTop;
      const bottom = top + selected.offsetHeight;
      if (top < node.scrollTop) node.scrollTop = top;
      else if (bottom > node.scrollTop + node.clientHeight) node.scrollTop = bottom - node.clientHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [ctx.isOpen]);

  // The dropdown is the same anchored surface the four menu families render, so
  // it goes through the same `FloatingPanel`. That deletes this fork's own
  // portal, its own backdrop and its own copy of the measure/flip/clamp effect,
  // and gains the one thing it never had: Escape to dismiss.
  //
  // `minWidth` is the TRIGGER's width, which is what makes a select dropdown
  // line up under its field rather than shrink-wrap its longest option.
  return (
    <FloatingPanel
      open={ctx.isOpen}
      anchor={anchor}
      role="menu"
      label={label}
      align="start"
      sideOffset={SELECT_OFFSET}
      // `w-[266px]` as a floor, so a narrow trigger still opens the
      // standard menu width while a wide one keeps lining up under its field.
      // A number rather than the class: this inline `minWidth` would outrank it.
      minWidth={
        width !== undefined
          ? width
          : anchor
            ? Math.max(MENU_WIDTH, anchor.right - anchor.left)
            : undefined
      }
      style={width !== undefined ? { width } : undefined}
      onDismiss={ctx.close}
      surface="listbox"
      className={className}
    >
      <ScrollView
        ref={listRef}
        style={{ maxHeight }}
        // `flex flex-col gap-1` — the rows sit 4px apart.
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator>
        {items.map((item, index) => (
          <React.Fragment key={valueExtractor(item)}>
            {renderItem(item, index, ctx.value)}
          </React.Fragment>
        ))}
      </ScrollView>
    </FloatingPanel>
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export function SelectItem({
  ref,
  value,
  label,
  disabled = false,
  leading,
  children,
  className,
  style,
}: SelectItemProps) {
  const ctx = useSelectContext();
  const { size } = ctx;
  const palette = useMenuPalette();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isSelected = ctx.value === value;

  // `selected` only. `hovered` and `focused` still drive this row's own
  // background below, but they are no longer PUBLISHED — nothing ever read
  // them, and `pressed` was published as a literal `false`.
  const itemCtx = useMemo<SelectItemContextValue>(
    () => ({ selected: isSelected, disabled, size }),
    [isSelected, disabled, size],
  );
  // `(isFocused || isSelected) && MENU_ITEM_ACTIVE`: hover, keyboard
  // focus and the chosen option share one `dropdown-item-hover-background`.
  const highlighted = !disabled && (hovered || focused || isSelected);

  return (
    <StyledPressable
      ref={ref}
      accessibilityRole="radio"
      // The native fork has always applied this; web declared `label` and then
      // dropped it, leaving every option a `role="radio"` with no accessible
      // name for a screen reader to announce.
      accessibilityLabel={label}
      // `aria-checked` is the state ARIA defines for `role="radio"`, and the
      // only one react-native-web emits — it never reads `accessibilityState`,
      // so this fork's options announced no selection at all.
      aria-checked={isSelected}
      disabled={disabled}
      onPress={
        disabled
          ? undefined
          : () => {
              ctx.onValueChange?.(value);
              ctx.close();
            }
      }
      onFocus={disabled ? undefined : onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter: disabled ? undefined : onMouseEnter,
        onMouseLeave,
      } as Record<string, (() => void) | undefined>)}
      className={cx(
        SELECT_ITEM_CLASS,
        SELECT_ITEM_SIZE_CLASS[ctx.size],
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
      style={[
        ROW_TRANSITION,
        { backgroundColor: highlighted ? palette.rowHighlight : 'transparent' },
        style,
      ]}
    >
      <ItemContext.Provider value={itemCtx}>
        {leading}
        {children}
      </ItemContext.Provider>
    </StyledPressable>
  );
}

// ---------------------------------------------------------------------------
// SelectItemText
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SelectItemIndicator
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // `TriggerSlot`'s wrapper is `alignSelf: 'flex-start'` so an anchored surface
  // lines up with the CONTROL. A select trigger is a full-width field, so it
  // stretches instead. Inline rather
  // than a class because it overrides `TriggerSlot`'s own inline default, and a
  // class cannot outrank one.
  triggerSlot: {
    alignSelf: 'stretch',
  },
  list: {
    gap: 4,
  },
});

export { useSelectItemContext };
