import { useCardFill } from '../card/use-card-fill';
import type { Surface as SurfaceComponent } from '../surface';
/**
 * A controlled, presentational emoji grid.
 *
 * BLOOM SHIPS NO EMOJI DATASET, and that is the design rather than an omission:
 * a full set with names and keywords is tens of kilobytes that every app with
 * its own would still pay for, and emoji names are localised. `groups` arrives
 * as a prop. The object form of an entry (`{ char, name, keywords }`) is what
 * the built-in search matches on; a dataset of bare glyphs still renders, it
 * just only matches a pasted glyph — which is the honest behaviour, not a
 * silent one.
 *
 * The grid is a `FlatList` on BOTH platforms, over pre-chunked ROWS rather than
 * single emoji, with exact `getItemLayout` offsets. A few thousand entries is
 * the normal case: at eight columns that is a few hundred rows, of which a
 * dozen are mounted, and the exact offsets are what let a category tab jump
 * straight to its header instead of estimating.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Button as ButtonComponent } from '../button';
import { FlatList, Pressable, TextInput, View } from 'react-native';

import { RiEmotionLine } from '../icons/remix/RiEmotionLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import {
  EMOJI_CATEGORY_ICONS,
  EMOJI_CATEGORY_SIZE,
  EMOJI_CELL,
  PANEL_RADIUS,
  SKIN_TONE_SWATCHES,
  applySkinTone,
  emojiChar,
  filterEmojiGroups,
  resolveChatComposerPalette,
} from './shared';
import type { EmojiEntry, EmojiGroup, EmojiPickerProps } from './types';
import { dataHook, useChatComposerWebCss } from './web-hooks';
import { useMessages } from '../locale/messages';
import { CHAT_COMPOSER_MESSAGES } from './messages';

/** Platform dependencies are bound once; shared rendering adds no wrapper. */
export function createEmojiPicker({ Surface, Button }: {
  Surface: typeof SurfaceComponent;
  Button: typeof ButtonComponent;
}) {

  const HEADER_HEIGHT = 26;
  const EMOJI_TAB = '__emoji';

  type Row =
    | { kind: 'header'; key: string; label: string }
    | { kind: 'emojis'; key: string; entries: EmojiEntry[] };

  function chunk(entries: ReadonlyArray<EmojiEntry>, columns: number): EmojiEntry[][] {
    const out: EmojiEntry[][] = [];
    for (let i = 0; i < entries.length; i += columns) out.push(entries.slice(i, i + columns));
    return out;
  }

  function entryName(entry: EmojiEntry, char: string): string {
    return typeof entry === 'string' ? char : (entry.name ?? char);
  }

  function EmojiPicker({
    groups,
    onSelectEmoji,
    activeGroup,
    defaultActiveGroup,
    onActiveGroupChange,
    query,
    defaultQuery = '',
    onQueryChange,
    filter = true,
    frequentlyUsed,
    skinTone,
    defaultSkinTone = 0,
    onSkinToneChange,
    columns = 8,
    height = 288,
    tabs,
    activeTab,
    onActiveTabChange,
    labels: labelOverrides,
    style,
    testID,
    accessibilityLabel: accessibilityLabelProp,
  }: EmojiPickerProps) {
    const theme = useTheme();
    const palette = resolveChatComposerPalette(theme, useCardFill(style));
    useChatComposerWebCss();
    const { messages } = useMessages(CHAT_COMPOSER_MESSAGES);
    const accessibilityLabel = accessibilityLabelProp ?? messages.emojiPicker;
    const labels = {
      search: messages.searchEmoji,
      empty: messages.noEmoji,
      frequent: messages.frequentlyUsed,
      skinTone: messages.skinTone,
      emojiTab: messages.emoji,
      ...labelOverrides,
    };

    const [search, setSearch] = useControllableState<string>({
      value: query,
      defaultValue: defaultQuery,
      onChange: onQueryChange,
    });
    const [tone, setTone] = useControllableState<number>({
      value: skinTone,
      defaultValue: defaultSkinTone,
      onChange: onSkinToneChange,
    });
    const [category, setCategory] = useControllableState<string>({
      value: activeGroup,
      defaultValue: defaultActiveGroup ?? groups[0]?.key ?? '',
      onChange: onActiveGroupChange,
    });
    const [tab, setTab] = useControllableState<string>({
      value: activeTab,
      defaultValue: EMOJI_TAB,
      onChange: onActiveTabChange,
    });
    const [toneOpen, setToneOpen] = useState(false);
    const listRef = useRef<FlatList<Row> | null>(null);

    const visible = useMemo(
      () => (filter ? filterEmojiGroups(groups, search) : groups),
      [filter, groups, search],
    );

    const { rows, offsets, heights, headerIndex } = useMemo(() => {
      const all: EmojiGroup[] = [];
      if (frequentlyUsed && frequentlyUsed.length > 0 && !search.trim()) {
        all.push({ key: 'frequent', label: labels.frequent, emojis: frequentlyUsed });
      }
      all.push(...visible);

      const built: Row[] = [];
      const index: Record<string, number> = {};
      for (const group of all) {
        index[group.key] = built.length;
        built.push({ kind: 'header', key: `h-${group.key}`, label: group.label });
        chunk(group.emojis, columns).forEach((entries, i) =>
          built.push({ kind: 'emojis', key: `${group.key}-${i}`, entries }),
        );
      }
      const rowHeights = built.map((row) => (row.kind === 'header' ? HEADER_HEIGHT : EMOJI_CELL));
      const rowOffsets: number[] = [];
      let running = 0;
      for (const h of rowHeights) {
        rowOffsets.push(running);
        running += h;
      }
      return { rows: built, offsets: rowOffsets, heights: rowHeights, headerIndex: index };
    }, [columns, frequentlyUsed, labels.frequent, search, visible]);

    const jumpTo = useCallback(
      (key: string) => {
        setCategory(key);
        const at = headerIndex[key];
        if (at === undefined) return;
        listRef.current?.scrollToOffset({ offset: offsets[at] ?? 0, animated: true });
      },
      [headerIndex, offsets, setCategory],
    );

    const renderRow = useCallback(
      ({ item }: { item: Row }) => {
        if (item.kind === 'header') {
          return (
            <View style={{ height: HEADER_HEIGHT, justifyContent: 'flex-end', paddingLeft: 6 }}>
              <Text variant="caption-1-medium" style={{ color: palette.textSecondary }}>
                {item.label}
              </Text>
            </View>
          );
        }
        return (
          <View style={{ flexDirection: 'row', height: EMOJI_CELL }}>
            {item.entries.map((entry, i) => {
              const base = emojiChar(entry);
              const char = applySkinTone(base, tone);
              return (
                <Button appearance="plain" tone="neutral"
                  key={`${base}-${i}`}
                  accessibilityLabel={entryName(entry, char)}
                  onPress={() => onSelectEmoji?.(char)}
                  style={{ padding: 0, minWidth: 0, minHeight: 0, flexShrink: 0,
                    width: EMOJI_CELL,
                    height: EMOJI_CELL,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                  }}
                  testID={testID ? `${testID}-emoji-${base}` : undefined}>
                  <Text variant="title-2-regular">{char}</Text>
                </Button>
              );
            })}
          </View>
        );
      },
      [onSelectEmoji, palette.textSecondary, testID, tone],
    );

    const panel: WebCssStyle = {
      borderRadius: PANEL_RADIUS,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 8,
      paddingRight: 8,
      gap: 8,
      '--bloom-chat-composer-ring': palette.focusRing,
    };

    const topTabs = [{ key: EMOJI_TAB, label: labels.emojiTab, icon: RiEmotionLine }, ...(tabs ?? [])];
    const activeCustom = tabs?.find((t) => t.key === tab);

    return (
      <Surface accessibilityLabel={accessibilityLabel} style={[panel, style]} testID={testID}>
        {tabs && tabs.length > 0 ? (
          <View
            accessibilityRole="tablist"
            style={{ flexDirection: 'row', gap: 4 }}
            testID={testID ? `${testID}-tabs` : undefined}>
            {topTabs.map((entry) => {
              const selected = entry.key === tab;
              return (
                <Pressable
                  key={entry.key}
                  {...dataHook('bloomChatComposerRow')}
                  accessibilityRole="tab"
                  accessibilityLabel={entry.label}
                  aria-selected={selected}
                  accessibilityState={{ selected }}
                  onPress={() => setTab(entry.key)}
                  style={{
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 30,
                    borderRadius: 9999,
                    backgroundColor: selected ? palette.accentSoft : 'transparent',
                  }}
                  testID={testID ? `${testID}-tab-${entry.key}` : undefined}>
                  <Text
                    variant="body-2-medium"
                    style={{ color: selected ? palette.accentStrong : palette.textSecondary }}>
                    {entry.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {activeCustom ? (
          <View style={{ height }}>{activeCustom.content}</View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: palette.inset,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}>
                <RiSearchLine width={16} height={16} fill={palette.iconSecondary} />
                <TextInput
                  {...dataHook('bloomChatComposerInput')}
                  accessibilityLabel={labels.search}
                  placeholder={labels.search}
                  placeholderTextColor={palette.textPlaceholder}
                  value={search}
                  onChangeText={setSearch}
                  selectionColor={palette.accent}
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    padding: 0,
                    margin: 0,
                    ...TYPE_SCALE['body-2-regular'],
                    color: palette.text,
                    backgroundColor: 'transparent',
                  }}
                  testID={testID ? `${testID}-search` : undefined}
                />
              </View>
              <Button appearance="plain" tone="neutral"
                accessibilityLabel={labels.skinTone}
                aria-expanded={toneOpen}
                onPress={() => setToneOpen(!toneOpen)}
                style={{ padding: 0, minWidth: 0, minHeight: 0, flexShrink: 0,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  backgroundColor: toneOpen ? palette.hover : palette.inset,
                }}
                testID={testID ? `${testID}-skin-tone` : undefined}>
                <Text variant="body-regular">{SKIN_TONE_SWATCHES[tone] ?? SKIN_TONE_SWATCHES[0]}</Text>
              </Button>
            </View>

            {toneOpen ? (
              <View
                style={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}
                testID={testID ? `${testID}-skin-tones` : undefined}>
                {SKIN_TONE_SWATCHES.map((swatch, index) => {
                  const selected = index === tone;
                  return (
                    <Button appearance="plain" tone="neutral"
                      key={index}
                      accessibilityLabel={`${labels.skinTone} ${index + 1}`}
                      pressed={selected}
                      onPress={() => {
                        setTone(index);
                        setToneOpen(false);
                      }}
                      style={{ padding: 0, minWidth: 0, minHeight: 0, flexShrink: 0,
                        width: 30,
                        height: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 9999,
                        backgroundColor: selected ? palette.accentSoft : 'transparent',
                      }}
                      testID={testID ? `${testID}-skin-tone-${index}` : undefined}>
                      <Text variant="body-regular">{swatch}</Text>
                    </Button>
                  );
                })}
              </View>
            ) : null}

            <View
              accessibilityRole="tablist"
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              testID={testID ? `${testID}-categories` : undefined}>
              {groups.map((group) => {
                const selected = group.key === category;
                const Glyph = group.icon ?? EMOJI_CATEGORY_ICONS[group.key] ?? RiEmotionLine;
                return (
                  <Pressable
                    key={group.key}
                    {...dataHook('bloomChatComposerControl')}
                    accessibilityRole="tab"
                    accessibilityLabel={group.label}
                    aria-selected={selected}
                    accessibilityState={{ selected }}
                    onPress={() => jumpTo(group.key)}
                    style={{
                      width: EMOJI_CATEGORY_SIZE,
                      height: EMOJI_CATEGORY_SIZE,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 9999,
                      backgroundColor: selected ? palette.accentSoft : 'transparent',
                    }}
                    testID={testID ? `${testID}-category-${group.key}` : undefined}>
                    <Glyph
                      width={18}
                      height={18}
                      fill={selected ? palette.accentStrong : palette.iconSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>

            {rows.length === 0 ? (
              <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                  {labels.empty}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                {...dataHook('bloomChatComposerScroll')}
                data={rows}
                keyExtractor={(row) => row.key}
                renderItem={renderRow}
                getItemLayout={(_data, index) => ({
                  length: heights[index] ?? EMOJI_CELL,
                  offset: offsets[index] ?? 0,
                  index,
                })}
                style={{ height }}
                showsVerticalScrollIndicator={false}
                testID={testID ? `${testID}-grid` : undefined}
              />
            )}
          </>
        )}
      </Surface>
    );
  }

  return EmojiPicker;
}
