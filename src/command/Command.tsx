import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useControllableState } from '../hooks/useControllableState';
import { Text } from '../typography';
import { Item } from '../item';
import { Kbd } from '../kbd';
import { SearchInput } from '../search-input';
import { fontSize, space } from '../styles/tokens';
import type { CenteredDialogProps } from '../dialog';
import type { CommandItem, CommandProps } from './types';

type CenteredDialogComponent = React.ComponentType<CenteredDialogProps>;

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
 * Build the `Command` palette bound to a platform `CenteredDialog`. The
 * platform entry files (`index.ts` / `index.web.ts`) inject the correct one
 * (native RN `Modal` vs pure-DOM web overlay) — this repo never relies on
 * implicit `.web` resolution. The body is single-source.
 *
 * `Command` is a ⌘K command palette built on Bloom's `CenteredDialog`,
 * `SearchInput`, an `Item` results list and `Kbd` shortcut hints. Items group
 * by their `group` field (ungrouped first). On web the list is
 * keyboard-navigable (Up/Down/Enter); on native, tap to select.
 */
export function createCommand(CenteredDialog: CenteredDialogComponent) {
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
    const theme = useTheme();
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
    if (visible) {
      if (activeIndex !== 0) setActiveIndex(0);
      if (Platform.OS === 'web') {
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }
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

  return (
    <CenteredDialog
      visible={visible}
      onClose={onClose}
      dismissible
      showClose={false}
      maxWidth={560}
      accessibilityLabel="Command palette"
      cardStyle={style}
      contentStyle={styles.content}
      testID={testID}>
      <View {...webKeyHandler}>
        <View style={[styles.searchWrap, { borderBottomColor: theme.colors.borderLight }]}>
          <SearchInput
            ref={searchRef}
            label={placeholder}
            placeholder={placeholder}
            value={query}
            onChangeText={setQuery}
            onClearText={() => setQuery('')}
            autoFocus={Platform.OS !== 'web'}
          />
        </View>

        {selectable.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: fontSize.sm }}>
              {emptyText}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: maxListHeight }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {entries.map((entry, i) => {
              if (entry.type === 'header') {
                return (
                  <Text
                    key={`h-${entry.group}-${i}`}
                    style={[styles.groupHeader, { color: theme.colors.textTertiary }]}>
                    {entry.group}
                  </Text>
                );
              }
              const item = entry.item;
              if (!item) return null;
              const Icon = item.icon;
              const isActive = entry.selectableIndex === clampedActive;
              return (
                <Item
                  key={item.id}
                  title={item.label}
                  subtitle={item.description}
                  density="compact"
                  disabled={item.disabled}
                  active={isActive}
                  role="option"
                  onPress={() => select(item)}
                  leading={
                    Icon ? (
                      <Icon size="sm" fill={theme.colors.textSecondary} />
                    ) : null
                  }
                  trailing={item.shortcut ? <Kbd size="sm">{item.shortcut}</Kbd> : null}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    </CenteredDialog>
    );
  };

  Command.displayName = 'Command';
  return Command;
}

export type CommandType = ReturnType<typeof createCommand>;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: space.xs,
  },
  searchWrap: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupHeader: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  empty: {
    paddingVertical: space._2xl,
    alignItems: 'center',
  },
});
