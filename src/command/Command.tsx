import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { Kbd } from '../kbd';
import { useMenuPalette, type MenuPalette } from '../floating/menu-palette';
import { MENU_FONT_FAMILY } from '../floating/menu-type';
import { ROW_ICON_SIZE } from '../floating/constants';
import { TYPE_SCALE } from '../typography/scale';
import { CloseButton } from '../button/CloseButton';
import type { WebCssStyle } from '../styles/web-view-style';
import type { DialogProps } from '../dialog';
import { useDialogControl } from '../dialog/context';
import type { CommandItem, CommandProps } from './types';

type DialogComponent = React.ComponentType<DialogProps>;

/** Centered command-palette max width (px). Matches the legacy palette card. */
const COMMAND_MAX_WIDTH = 560;

function defaultFilter(item: CommandItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.description?.toLowerCase().includes(q)) return true;
  return (item.keywords ?? []).some((k) => k.toLowerCase().includes(q));
}

interface FlatEntry {
  type: 'header' | 'item';
  group?: string;
  item?: CommandItem;
  /** Index into the flat list of selectable items (only for `type === 'item'`). */
  selectableIndex?: number;
}

/**
 * Build the `Command` palette bound to a platform `Dialog`. The platform entry
 * files (`index.ts` / `index.web.ts`) inject the correct one (native
 * `BottomSheet`-backed surface vs pure-DOM web overlay) — this repo never
 * relies on implicit `.web` resolution. The body is single-source.
 *
 * `Command` is a ⌘K command palette built on `<Dialog placement="center">`,
 * dressed as a floating menu (the palette `floating/menu-palette.ts`
 * resolves), with a bare search field, menu rows and `Kbd` shortcut hints. Items group
 * by their `group` field (ungrouped first). On web the list is
 * keyboard-navigable (Up/Down/Enter); on native, tap to select.
 *
 * Control mode — IMPERATIVE, not controlled. `Command` keeps its public
 * *controlled* API (`visible` boolean + `onClose`) but internally bridges it
 * onto the Dialog's imperative `useDialogControl()` handle, exactly like
 * `AlertDialog`. This makes `Command` the LAST controlled-`open` `Dialog`
 * consumer to move onto the imperative path every other surface uses
 * (`alert()`, `confirm()`, native `Menu`/`Select`/`ContextMenu`, Mention's
 * dialogs), so there is one code path across the ecosystem. It also guarantees
 * the palette's exit animation on the dismiss path even for a consumer that
 * unmounts the palette in response to `onClose` (`{open && <Command …/>}`): the
 * imperative `close()` runs the exit animation FIRST and fires `onClose` only
 * once it settles, whereas the controlled `open` path fires `onClose`
 * synchronously — which, for an unmount-on-close consumer, would tear the
 * surface down before it could animate out.
 */
export function createCommand(Dialog: DialogComponent) {
  const Command = function Command({
    visible,
    onClose,
    items,
    placeholder = 'Type a command or search…',
    emptyText = 'No results found.',
    query: queryProp,
    onQueryChange,
    filter = defaultFilter,
    maxListHeight = 360,
    style,
    testID,
  }: CommandProps) {
    const control = useDialogControl();
    const searchRef = useRef<TextInput>(null);
    const [activeIndex, setActiveIndex] = useState(0);

  const [query, setQuery] = useControllableState<string>({
    value: queryProp,
    defaultValue: '',
    onChange: onQueryChange,
  });

  const filtered = useMemo(
    () => items.filter((it) => filter(it, query)),
    [items, filter, query],
  );

  // Build a flattened render list with group headers, and a parallel list of
  // just the selectable items for keyboard navigation.
  const { entries, selectable } = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    const ungrouped: CommandItem[] = [];
    for (const it of filtered) {
      if (it.group) {
        const arr = groups.get(it.group) ?? [];
        arr.push(it);
        groups.set(it.group, arr);
      } else {
        ungrouped.push(it);
      }
    }

    const flat: FlatEntry[] = [];
    const sel: CommandItem[] = [];
    const pushItem = (it: CommandItem) => {
      flat.push({ type: 'item', item: it, selectableIndex: sel.length });
      sel.push(it);
    };

    for (const it of ungrouped) pushItem(it);
    for (const [group, arr] of groups) {
      flat.push({ type: 'header', group });
      for (const it of arr) pushItem(it);
    }
    return { entries: flat, selectable: sel };
  }, [filtered]);

  // Keep the active index in range as the filtered set changes. Reset to the
  // first selectable item whenever the query changes (derive, no effect).
  const prevQueryRef = useRef(query);
  if (prevQueryRef.current !== query) {
    prevQueryRef.current = query;
    if (activeIndex !== 0) setActiveIndex(0);
  }

  // Reset the active index and focus the search field on the closed→open
  // transition, derived from the `visible` prop (no effect). Focusing happens
  // on the next frame so the dialog has mounted.
  const prevVisibleRef = useRef(visible);
  if (prevVisibleRef.current !== visible) {
    prevVisibleRef.current = visible;
    if (visible && activeIndex !== 0) setActiveIndex(0);
  }

  const clampedActive = Math.min(activeIndex, Math.max(0, selectable.length - 1));

  const select = useCallback(
    (item: CommandItem | undefined) => {
      if (!item || item.disabled) return;
      item.onSelect();
      setQuery('');
      onClose();
    },
    [setQuery, onClose],
  );

  // Bridge the public *controlled* `visible` prop onto the Dialog's imperative
  // open/close (mirrors `AlertDialog`). `control` is referentially stable
  // (memoised on its id), so this effect only re-runs when `visible` actually
  // flips. Opening straight from an effect on mount is Bloom's fresh-mount
  // imperative-open pattern. When a consumer flips `visible` to `false` (their own
  // close, or after a select), we imperatively `close()` so the exit animation
  // still plays.
  const closingFromPropRef = useRef(false);
  useEffect(() => {
    if (visible) {
      control.open();
      return;
    }
    closingFromPropRef.current = true;
    control.close();
  }, [visible, control]);

  // The Dialog fires `onClose` after the exit animation settles (imperative
  // mode). Forward ONLY user-initiated dismissals (backdrop / Escape) to the
  // consumer — a consumer-initiated close (they flipped `visible` to `false`,
  // e.g. `select` already called `onClose`) must not re-enter `onClose`,
  // preserving the previous controlled semantics where a programmatic close
  // does not fire `onClose` a second time.
  const handleClose = useCallback(() => {
    if (closingFromPropRef.current) {
      closingFromPropRef.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  // Web keyboard navigation on the search input.
  const webKeyHandler: Record<string, unknown> =
    Platform.OS === 'web'
      ? {
          onKeyDown: (e: { key: string; preventDefault: () => void }) => {
            if (selectable.length === 0) return;
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % selectable.length);
                break;
              case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(
                  (i) => (i - 1 + selectable.length) % selectable.length,
                );
                break;
              case 'Enter':
                e.preventDefault();
                select(selectable[clampedActive]);
                break;
              default:
                break;
            }
          },
        }
      : {};

  // Keep the keyboard-highlighted row inside the scroll viewport (web).
  const listRef = useRef<ScrollView | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const frame = requestAnimationFrame(() => {
      const node = (listRef.current as unknown as { getScrollableNode?: () => HTMLElement | null })
        ?.getScrollableNode?.();
      const active = node?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!node || !active) return;
      const top = active.offsetTop;
      const bottom = top + active.offsetHeight;
      if (top < node.scrollTop) node.scrollTop = top;
      else if (bottom > node.scrollTop + node.clientHeight) node.scrollTop = bottom - node.clientHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [clampedActive]);

  const palette = useMenuPalette();

  return (
    <Dialog
      control={control}
      onClose={handleClose}
      placement="center"
      dismissOnBackdrop
      maxWidth={COMMAND_MAX_WIDTH}
      // The palette owns its insets (full-bleed separator) and its own results
      // ScrollView, so the Dialog adds neither padding nor a wrapping scroller.
      contentPadding={0}
      scrollable={false}
      label="Command palette"
      // The palette is the floating menu surface: card/neutral-800 panel,
      // 1px border, radius 16, `shadow-dropdown`, edge-to-edge content.
      style={[
        styles.panel,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          boxShadow: palette.shadow,
        },
        style,
      ]}
      testID={testID}>
      <View {...webKeyHandler}>
        <View style={styles.searchRow}>
          <RiSearchLine width={20} height={20} fill={palette.textPlaceholder} />
          <TextInput
            ref={searchRef}
            accessibilityLabel={placeholder}
            placeholder={placeholder}
            placeholderTextColor={palette.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            // Focus as the field mounts, on every platform: a focus requested on
            // the closed→open flip runs before the Dialog has mounted the input.
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.searchInput, SEARCH_WEB_RESET, { color: palette.text }]}
          />
          {query ? (
            <CloseButton size="xs" accessibilityLabel="Clear search" onPress={() => setQuery('')} />
          ) : null}
        </View>
        <View style={[styles.separator, { backgroundColor: palette.border }]} />

        {selectable.length === 0 ? (
          <View style={styles.empty}>
            <Text palette={palette} variant="body-medium" color={palette.textSecondary}>
              {emptyText}
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={listRef}
            style={{ maxHeight: maxListHeight }}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled">
            {entries.map((entry, i) => {
              if (entry.type === 'header') {
                return (
                  <View key={`h-${entry.group}-${i}`} style={i === 0 ? styles.groupFirst : styles.group}>
                    <Text palette={palette} variant="body-medium" color={palette.textSecondary}>
                      {entry.group}
                    </Text>
                  </View>
                );
              }
              const item = entry.item;
              if (!item) return null;
              const index = entry.selectableIndex ?? 0;
              return (
                <CommandRow
                  key={item.id}
                  item={item}
                  active={index === clampedActive}
                  palette={palette}
                  onHover={() => setActiveIndex(index)}
                  onPress={() => select(item)}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </Dialog>
    );
  };

  Command.displayName = 'Command';
  return Command;
}

export type CommandType = ReturnType<typeof createCommand>;

/** Text in the menu type step and Inter, coloured from the palette. */
function Text({
  children,
  variant,
  color,
  numberOfLines,
}: {
  children: React.ReactNode;
  palette: MenuPalette;
  variant: 'body-medium' | 'body-regular' | 'body-2-regular';
  color: string;
  numberOfLines?: number;
}) {
  const style: TextStyle = { ...MENU_FONT_FAMILY, ...TYPE_SCALE[variant], color };
  return (
    <RNText numberOfLines={numberOfLines} style={style}>
      {children}
    </RNText>
  );
}

/** One result: 8px padding, 8px gap, radius 10, row highlight. */
function CommandRow({
  item,
  active,
  palette,
  onHover,
  onPress,
}: {
  item: CommandItem;
  active: boolean;
  palette: MenuPalette;
  onHover: () => void;
  onPress: () => void;
}) {
  const { state: pressed, onIn, onOut } = useInteractionState();
  const Icon = item.icon;
  const highlighted = !item.disabled && (active || pressed);
  const label = item.disabled ? palette.textDisabled : palette.text;
  return (
    <Pressable
      role="option"
      accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
      aria-selected={active}
      accessibilityState={{ selected: active, disabled: item.disabled }}
      disabled={item.disabled}
      onPress={item.disabled ? undefined : onPress}
      onPressIn={item.disabled ? undefined : onIn}
      onPressOut={item.disabled ? undefined : onOut}
      onHoverIn={item.disabled ? undefined : onHover}
      style={[
        styles.row,
        ROW_TRANSITION,
        { backgroundColor: highlighted ? palette.rowHighlight : 'transparent' },
      ]}>
      {Icon ? (
        <View style={styles.rowIcon}>
          <Icon width={ROW_ICON_SIZE} height={ROW_ICON_SIZE} fill={item.disabled ? palette.textDisabled : palette.textSecondary} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text palette={palette} variant="body-medium" color={label} numberOfLines={1}>
          {item.label}
        </Text>
        {item.description ? (
          <Text palette={palette} variant="body-2-regular" color={palette.textSecondary} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.shortcut ? <Kbd size="sm">{item.shortcut}</Kbd> : null}
    </Pressable>
  );
}

/** The row's `transition-colors`. */
const ROW_TRANSITION: WebCssStyle = {
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * The browser's focus outline on the bare `<input>` — the palette itself is the
 * focus context, as in `TextField`. `outlineStyle: 'none'` is RN-Web only and
 * absent from RN's types, hence the same cast `TextField` makes.
 */
const SEARCH_WEB_RESET: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle)
    : undefined;

const styles = StyleSheet.create({
  // The floating panel: radius 16, 1px border, content edge to edge.
  panel: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingLeft: 16,
    paddingRight: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 52,
    ...MENU_FONT_FAMILY,
    ...TYPE_SCALE['body-medium'],
  },
  separator: {
    height: 1,
  },
  // The menu panel's `p-[10px]` and `gap-1`.
  list: {
    padding: 10,
    gap: 4,
  },
  // The group label: `pl-2`, 6px above its first row, 4px more than the gap
  // between groups.
  groupFirst: {
    paddingLeft: 8,
    paddingBottom: 2,
  },
  group: {
    paddingLeft: 8,
    paddingTop: 8,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    minHeight: 36,
    borderRadius: 10,
  },
  rowIcon: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
