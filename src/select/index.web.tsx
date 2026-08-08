import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal/index.web';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { resolveDropdownPlacement } from '../overlay/dropdown-placement';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { RadioIndicator } from '../radio-indicator';
import { useInteractionState } from '../hooks/useInteractionState';
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
} from '../icons/Chevron';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '../icons/Check';
import { defaultItemValueExtractor, ItemContext, useSelectItemContext } from './common';
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

export { useSelectItemContext };

const VIEWPORT_GUTTER = 8;
const SELECT_OFFSET = 6;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type SelectContextValue = Pick<SelectProps, 'value' | 'onValueChange' | 'disabled'> & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** The trigger element, so `SelectContent` can position itself against it. */
  triggerRef: React.RefObject<unknown>;
};

const SelectContext = createContext<SelectContextValue | null>(null);
SelectContext.displayName = 'SelectContext';

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

export function Select({ children, value, onValueChange, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<unknown>(null);

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange,
      disabled,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      triggerRef,
    }),
    [value, onValueChange, disabled, isOpen],
  );

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

export function SelectTrigger({ children, label }: SelectTriggerProps) {
  const ctx = useSelectContext();
  const theme = useTheme();
  const triggerId = useId();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  if (typeof children === 'function') {
    return children({
      control: {
        id: triggerId,
        ref: { current: null },
        open: ctx.open,
        close: ctx.close,
      },
      state: {
        hovered,
        focused,
        pressed: false,
      },
      props: {
        ref: ctx.triggerRef,
        onPress: ctx.open,
        onFocus,
        onBlur,
        accessibilityLabel: label,
      },
    });
  }

  return (
    <Pressable
      ref={ctx.triggerRef as React.Ref<View>}
      onPress={ctx.open}
      onFocus={onFocus}
      onBlur={onBlur}
      accessibilityLabel={label}
      accessibilityRole="button"
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.trigger,
        {
          backgroundColor: theme.colors.contrast50,
          borderColor: focused ? theme.colors.primary : theme.colors.contrast50,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

export function SelectValue({
  children: extractLabel,
  placeholder,
  style,
}: SelectValueProps) {
  const { value } = useSelectContext();
  const theme = useTheme();

  const display = value ?? placeholder ?? '';

  return (
    <Text
      numberOfLines={1}
      style={[
        styles.valueText,
        { color: value ? theme.colors.text : theme.colors.textSecondary },
        ...(style ? [style] : []),
      ]}
    >
      {extractLabel && value ? extractLabel(value) : display}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// SelectIcon
// ---------------------------------------------------------------------------

export function SelectIcon({ style }: SelectIconProps) {
  const theme = useTheme();
  return <ChevronDownIcon style={style} size="xs" fill={theme.colors.textSecondary} />;
}

// ---------------------------------------------------------------------------
// SelectContent
// ---------------------------------------------------------------------------

export function SelectContent<T>({
  items,
  renderItem,
  label = 'Select an option',
  valueExtractor = defaultItemValueExtractor,
}: SelectContentProps<T>) {
  const ctx = useSelectContext();
  const theme = useTheme();
  const [position, setPosition] = useState<ViewStyle | null>(null);
  // The mounted dropdown node, as STATE rather than a bare ref: positioning has
  // to measure it, and `Portal` renders null on its first pass (it resolves its
  // host in its own layout effect), so the node lands one render after `isOpen`
  // flips. An effect keyed only on `isOpen` would measure nothing.
  const [dropdownNode, setDropdownNode] = useState<HTMLElement | null>(null);

  const attachDropdown = useCallback((node: View | null) => {
    setDropdownNode(node as unknown as HTMLElement | null);
  }, []);

  // Anchored to the trigger, left edges aligned, and never off-screen: sit below
  // when it fits, flip above when it doesn't, clamp when neither. Before this the
  // dropdown had no `top`/`left` at all, so it rendered at the `Portal` root's
  // origin — the viewport's top-left corner — however far from its trigger.
  useLayoutEffect(() => {
    if (!ctx.isOpen || typeof window === 'undefined') return;

    const triggerNode = ctx.triggerRef.current as HTMLElement | null;
    if (!triggerNode?.getBoundingClientRect || !dropdownNode) return;

    const updatePosition = () => {
      const rect = triggerNode.getBoundingClientRect();
      // Measured BEFORE `minWidth` is applied, so the final surface can only be
      // wider than this — and a wider surface wraps less, so the measured height
      // is an upper bound. Erring that way flips early in a tie, never late.
      const surface = dropdownNode.getBoundingClientRect();
      const width = Math.max(surface.width, rect.width);

      setPosition({
        position: WEB_POSITION_FIXED,
        ...resolveDropdownPlacement({
          anchor: rect,
          size: { width, height: surface.height },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          offset: SELECT_OFFSET,
          gutter: VIEWPORT_GUTTER,
          align: 'start',
        }),
        minWidth: width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [ctx.isOpen, ctx.triggerRef, dropdownNode]);

  if (!ctx.isOpen) return null;

  return (
    <Portal>
      {/* `OverlayRoot` takes this surface's place in the open-order overlay
          stack, so it paints above anything opened before it (see
          `src/overlay/stack.ts`). It is `box-none`, so the area outside the
          panel stays click-through and the backdrop below still takes its own
          presses. */}
      <OverlayRoot>
        <Backdrop
          style={styles.backdrop}
          onPress={ctx.close}
          accessibilityLabel="Close selection"
        />
        <View
          ref={attachDropdown}
          accessibilityRole="list"
          accessibilityLabel={label}
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.isDark
                ? theme.colors.backgroundSecondary
                : theme.colors.background,
              borderColor: theme.colors.borderLight,
              ...bloomShadowStyle('m'),
            },
            position,
          ]}
        >
          {items.map((item, index) => (
            <React.Fragment key={valueExtractor(item)}>
              {renderItem(item, index, ctx.value)}
            </React.Fragment>
          ))}
        </View>
      </OverlayRoot>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

export function SelectItem({ ref, value, label, children, style }: SelectItemProps) {
  const theme = useTheme();
  const ctx = useSelectContext();
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState();
  const { state: focused, onIn: onFocus, onOut: onBlur } = useInteractionState();

  const isSelected = ctx.value === value;

  const itemCtx = useMemo<SelectItemContextValue>(
    () => ({ selected: isSelected, hovered, focused, pressed: false }),
    [isSelected, hovered, focused],
  );

  return (
    <Pressable
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
      onPress={() => {
        ctx.onValueChange?.(value);
        ctx.close();
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      {...({
        onMouseEnter,
        onMouseLeave,
      } as Record<string, () => void>)}
      style={[
        styles.item,
        (hovered || focused) && { backgroundColor: theme.colors.primaryLight },
        style,
      ]}
    >
      <ItemContext.Provider value={itemCtx}>{children}</ItemContext.Provider>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// SelectItemText
// ---------------------------------------------------------------------------

export function SelectItemText({ children, style }: SelectItemTextProps) {
  return (
    <Text style={[styles.itemText, ...(style ? [style] : [])]}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// SelectItemIndicator
// ---------------------------------------------------------------------------

export function SelectItemIndicator({ icon: IconComponent = CheckIcon }: SelectItemIndicatorProps) {
  const { selected } = useSelectItemContext();

  if (!selected) {
    return <View style={styles.itemIndicatorPlaceholder} />;
  }

  return (
    <View style={styles.itemIndicatorContainer}>
      <IconComponent size="sm" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SelectSeparator
// ---------------------------------------------------------------------------

export function SelectSeparator() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: theme.colors.borderLight },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    maxWidth: 400,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  valueText: {
    fontSize: 16,
  },
  backdrop: {
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  dropdown: {
    // Fixed from the outset, not only once positioned: the `Portal` root is a
    // block container, so a static child would stretch to the full viewport
    // width and the pre-position measurement would under-read the height (less
    // wrapping at a width the surface never actually has). A fixed box
    // shrink-wraps to the same width it ends up with.
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 4,
    minWidth: 180,
    // Overlay elevation applied at the usage site via `bloomShadowStyle('m')`.
    // Opt back in from the Portal root's `pointer-events: none`.
    pointerEvents: 'auto',
  },
  item: {
    position: 'relative',
    flexDirection: 'row',
    // Matches the native sheet row (`index.tsx`) and the web `Menu` row. Bloom's
    // web build is what renders on touch tablets, where this dropdown — not the
    // sheet — is the select, so the row carries the same 44dp target on both
    // platforms.
    minHeight: 44,
    paddingLeft: 30,
    paddingRight: 8,
    alignItems: 'center',
    borderRadius: 4,
    paddingVertical: 4,
  },
  itemText: {
    fontSize: 14,
  },
  itemIndicatorPlaceholder: {
    position: 'absolute',
    left: 0,
    width: 30,
  },
  itemIndicatorContainer: {
    position: 'absolute',
    left: 0,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 4,
    width: '100%',
  },
});
