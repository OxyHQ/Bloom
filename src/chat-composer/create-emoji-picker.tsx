import { ScrollBar } from '../layout/ScrollBar';
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
 * The bounded grid is a `FlatList` on BOTH platforms, over pre-chunked ROWS rather than
 * single emoji, with exact `getItemLayout` offsets. A few thousand entries is
 * the normal case: at eight columns that is a few hundred rows, of which a
 * dozen are mounted, and the exact offsets are what let a category tab jump
 * straight to its header instead of estimating.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Button as ButtonComponent } from '../button';
import { FlatList, View } from 'react-native';
import { BloomScope, useBloomAppearance } from '../appearance';
import { BUTTON_GEOMETRY } from '../button/shared';
import { useTouchInput } from '../styles/pointer';
import { useSurfaceFill } from '../styles/surface-levels';
import type { Tabs as TabsComponent, TabsTrigger as TabsTriggerComponent } from '../tabs';
import type { TextFieldInput as TextFieldInputComponent } from '../text-field';

import { RiEmotionLine } from '../icons/remix/RiEmotionLine';
import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  EMOJI_CATEGORY_ICONS,
  PANEL_RADIUS,
  SKIN_TONE_SWATCHES,
  applySkinTone,
  emojiChar,
  filterEmojiGroups,
  resolveChatComposerPalette,
} from './shared';
import type { EmojiEntry, EmojiGroup, EmojiPickerProps } from './types';
import { useChatComposerWebCss } from './web-hooks';
import { useMessages } from '../locale/messages';
import { CHAT_COMPOSER_MESSAGES } from './messages';
import { dataHook } from '../styles/data-hook';

/** Platform dependencies are bound once; shared rendering adds no wrapper. */
export function createEmojiPicker({
  Surface,
  Button,
  Tabs,
  TabsTrigger,
  TextFieldInput,
}: {
  Surface: typeof SurfaceComponent;
  Button: typeof ButtonComponent;
  Tabs: typeof TabsComponent;
  TabsTrigger: typeof TabsTriggerComponent;
  TextFieldInput: typeof TextFieldInputComponent;
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
    skinToneLabel,
    columns = 8,
    height = 288,
    scrollable = true,
    embedded = false,
    size: sizeProp,
    tabs,
    activeTab,
    onActiveTabChange,
    labels: labelOverrides,
    style,
    testID,
    accessibilityLabel: accessibilityLabelProp,
  }: EmojiPickerProps) {
    const theme = useTheme();
    const cardFill = useCardFill(style);
    const parentFill = useSurfaceFill();
    const palette = resolveChatComposerPalette(theme, embedded ? parentFill : cardFill);
    const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
    const touch = useTouchInput();
    const cellSize = Math.max(BUTTON_GEOMETRY[size].height, touch ? 44 : 0);
    const glyphSize = BUTTON_GEOMETRY[size].iconSize + 2;
    const [bodyWidth, setBodyWidth] = useState(0);
    const autoFlow = !scrollable;
    const columnCount =
      columns === 'auto'
        ? Math.max(1, Math.floor(bodyWidth / cellSize))
        : Math.max(1, Number.isFinite(columns) ? Math.floor(columns) : 8);
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
        all.push({
          key: 'frequent',
          label: labels.frequent,
          emojis: frequentlyUsed,
        });
      }
      const selectedCategory = groups.some((group) => group.key === category)
        ? category
        : groups[0]?.key;
      all.push(
        ...(!scrollable && !search.trim()
          ? visible.filter((group) => group.key === selectedCategory)
          : visible),
      );

      const built: Row[] = [];
      const index: Record<string, number> = {};
      for (const group of all) {
        index[group.key] = built.length;
        built.push({
          kind: 'header',
          key: `h-${group.key}`,
          label: group.label,
        });
        chunk(group.emojis, autoFlow ? Math.max(1, group.emojis.length) : columnCount).forEach(
          (entries, i) => {
            built.push({ kind: 'emojis', key: `${group.key}-${i}`, entries });
          },
        );
      }
      const rowHeights = built.map((row) => (row.kind === 'header' ? HEADER_HEIGHT : cellSize));
      const rowOffsets: number[] = [];
      let running = 0;
      for (const h of rowHeights) {
        rowOffsets.push(running);
        running += h;
      }
      return {
        rows: built,
        offsets: rowOffsets,
        heights: rowHeights,
        headerIndex: index,
      };
    }, [
      autoFlow,
      columnCount,
      cellSize,
      category,
      groups,
      scrollable,
      frequentlyUsed,
      labels.frequent,
      search,
      visible,
    ]);

    const jumpTo = useCallback(
      (key: string) => {
        setCategory(key);
        if (!scrollable) return;
        const at = headerIndex[key];
        if (at === undefined) return;
        listRef.current?.scrollToOffset({
          offset: offsets[at] ?? 0,
          animated: true,
        });
      },
      [headerIndex, offsets, setCategory, scrollable],
    );

    const renderRow = useCallback(
      ({ item }: { item: Row }) => {
        if (item.kind === 'header') {
          return (
            <View
              style={{
                height: HEADER_HEIGHT,
                justifyContent: 'flex-end',
                paddingLeft: 6,
              }}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                accessibilityLabel={item.label}
                variant="caption-1-medium"
                style={{ color: palette.textSecondary }}
              >
                {item.label}
              </Text>
            </View>
          );
        }
        return (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: autoFlow ? 'wrap' : undefined,
              height: autoFlow ? undefined : cellSize,
            }}
          >
            {item.entries.map((entry, i) => {
              const base = emojiChar(entry);
              const char = applySkinTone(base, tone);
              return (
                <Button
                  appearance="plain"
                  tone="neutral"
                  key={`${base}-${i}`}
                  accessibilityLabel={entryName(entry, char)}
                  onPress={() => onSelectEmoji?.(char)}
                  iconOnly
                  icon={
                    <Text
                      variant="title-2-regular"
                      style={{ fontSize: glyphSize, lineHeight: glyphSize + 4 }}
                    >
                      {char}
                    </Text>
                  }
                  style={{
                    padding: 0,
                    minWidth: 0,
                    minHeight: 0,
                    flexShrink: 0,
                    width: cellSize,
                    height: cellSize,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                  }}
                  testID={testID ? `${testID}-emoji-${base}` : undefined}
                />
              );
            })}
          </View>
        );
      },
      [autoFlow, cellSize, glyphSize, onSelectEmoji, palette.textSecondary, testID, tone],
    );

    const panel: WebCssStyle = {
      borderRadius: PANEL_RADIUS,
      paddingTop: embedded ? 0 : 8,
      paddingBottom: embedded ? 0 : 8,
      paddingLeft: embedded ? 0 : 8,
      paddingRight: embedded ? 0 : 8,
      gap: 8,
      '--bloom-chat-composer-ring': palette.focusRing,
    };

    const topTabs = [
      { key: EMOJI_TAB, label: labels.emojiTab, icon: RiEmotionLine },
      ...(tabs ?? []),
    ];
    const activeCustom = tabs?.find((t) => t.key === tab);

    const Container = embedded ? View : Surface;
    return (
      <BloomScope size={size}>
        <Container accessibilityLabel={accessibilityLabel} style={[panel, style]} testID={testID}>
          {tabs && tabs.length > 0 ? (
            <Tabs
              value={tab}
              onValueChange={setTab}
              variant="pill"
              fullWidth
              label={accessibilityLabel}
              testID={testID ? `${testID}-tabs` : undefined}
            >
              {topTabs.map((entry) => (
                <TabsTrigger
                  key={entry.key}
                  value={entry.key}
                  label={entry.label}
                  leadingIcon={entry.icon}
                  testID={testID ? `${testID}-tab-${entry.key}` : undefined}
                />
              ))}
            </Tabs>
          ) : null}

          {activeCustom ? (
            <View style={scrollable ? { height } : undefined}>{activeCustom.content}</View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <TextFieldInput
                    label={labels.search}
                    placeholder={labels.search}
                    value={search}
                    onChangeText={setSearch}
                    testID={testID ? `${testID}-search` : undefined}
                  />
                </View>
                <Button
                  appearance="plain"
                  tone="neutral"
                  accessibilityLabel={labels.skinTone}
                  aria-expanded={toneOpen}
                  onPress={() => setToneOpen(!toneOpen)}
                  iconOnly
                  icon={
                    <Text variant="body-regular">
                      {SKIN_TONE_SWATCHES[tone] ?? SKIN_TONE_SWATCHES[0]}
                    </Text>
                  }
                  style={{ minHeight: cellSize, minWidth: cellSize }}
                  testID={testID ? `${testID}-skin-tone` : undefined}
                />
              </View>

              {toneOpen ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'flex-end',
                  }}
                  testID={testID ? `${testID}-skin-tones` : undefined}
                >
                  {SKIN_TONE_SWATCHES.map((swatch, index) => {
                    const selected = index === tone;
                    return (
                      <Button
                        appearance="plain"
                        tone="neutral"
                        key={swatch}
                        accessibilityLabel={
                          skinToneLabel?.(index) ?? `${labels.skinTone} ${index + 1}`
                        }
                        pressed={selected}
                        onPress={() => {
                          setTone(index);
                          setToneOpen(false);
                        }}
                        iconOnly
                        icon={<Text variant="body-regular">{swatch}</Text>}
                        style={{ minHeight: cellSize, minWidth: cellSize }}
                        testID={testID ? `${testID}-skin-tone-${index}` : undefined}
                      />
                    );
                  })}
                </View>
              ) : null}

              <Tabs
                value={category}
                onValueChange={jumpTo}
                variant="filled"
                label={labels.emojiTab}
                testID={testID ? `${testID}-categories` : undefined}
              >
                {groups.map((group) => (
                  <TabsTrigger
                    key={group.key}
                    value={group.key}
                    iconOnly
                    label={group.label}
                    leadingIcon={group.icon ?? EMOJI_CATEGORY_ICONS[group.key] ?? RiEmotionLine}
                    testID={testID ? `${testID}-category-${group.key}` : undefined}
                  />
                ))}
              </Tabs>
              <View
                testID={testID ? `${testID}-body` : undefined}
                onLayout={
                  autoFlow
                    ? undefined
                    : (event) => {
                        const width = event.nativeEvent.layout.width;
                        setBodyWidth(Number.isFinite(width) ? Math.max(0, width) : 0);
                      }
                }
              >
                {rows.length === 0 ? (
                  <View
                    style={{
                      height: scrollable ? height : undefined,
                      minHeight: cellSize,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant="body-2-regular" style={{ color: palette.textSecondary }}>
                      {labels.empty}
                    </Text>
                  </View>
                ) : !scrollable ? (
                  <View testID={testID ? `${testID}-flow` : undefined}>
                    {rows.map((item) => (
                      <View key={item.key}>{renderRow({ item })}</View>
                    ))}
                  </View>
                ) : (
                  <View style={{ position: 'relative', height }}>
                    <FlatList
                      ref={listRef}
                      {...dataHook('bloomChatComposerScroll')}
                      data={rows}
                      keyExtractor={(row) => row.key}
                      renderItem={renderRow}
                      getItemLayout={(_data, index) => ({
                        length: heights[index] ?? cellSize,
                        offset: offsets[index] ?? 0,
                        index,
                      })}
                      style={{ height }}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      testID={testID ? `${testID}-grid` : undefined}
                    />
                    <ScrollBar target={listRef} />
                  </View>
                )}
              </View>
            </>
          )}
        </Container>
      </BloomScope>
    );
  }

  return EmojiPicker;
}
