/**
 * The plus/paperclip menu.
 *
 * It is `Popover`, not a hand-rolled surface, and that one choice is the whole
 * platform story: Bloom's popover is already an anchored panel on a pointer and
 * a bottom sheet on a phone, so this family adds no platform fork of its own
 * and inherits the dismissal, stacking and focus behaviour those surfaces were
 * gated for.
 */
import React from 'react';
import { View, type DimensionValue } from 'react-native';

import type { Button as ButtonComponent } from '../button';
import type {
  Popover as PopoverComponent,
  PopoverContent as PopoverContentComponent,
  PopoverTrigger as PopoverTriggerComponent,
} from '../popover';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { attachmentMenuItems, resolveChatComposerPalette } from './shared';
import type { AttachmentMenuItem, AttachmentMenuProps } from './types';
import { useChatComposerWebCss } from './web-hooks';
import { useMessages } from '../locale/messages';
import { CHAT_COMPOSER_MESSAGES } from './messages';

/** Platform dependencies are bound once; shared rendering adds no wrapper. */
export function createAttachmentMenu({
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
}: {
  Button: typeof ButtonComponent;
  Popover: typeof PopoverComponent;
  PopoverContent: typeof PopoverContentComponent;
  PopoverTrigger: typeof PopoverTriggerComponent;
}) {
  /** A 48px tinted disc with its label under it. */
  function GridCell({
    item,
    onPress,
    width,
    testID,
  }: {
    item: AttachmentMenuItem;
    onPress: () => void;
    width: DimensionValue;
    testID?: string;
  }) {
    const theme = useTheme();
    const palette = resolveChatComposerPalette(theme);
    const tint = item.color ?? palette.accent;
    const cell: WebCssStyle = {
      width,
      height: 'auto',
      minHeight: 0,
      minWidth: 0,
      paddingLeft: 0,
      paddingRight: 0,
      // Button hands `alignItems` to its content, which is a ROW: 'center' there
      // centres the disc vertically, so in a row where one caption wraps the
      // other discs sat lower than its. 'flex-start' tops every disc; the
      // content's own `justifyContent` still centres them across the cell.
      alignItems: 'flex-start',
      gap: 6,
      paddingTop: 8,
      paddingBottom: 8,
      borderRadius: 12,
      opacity: item.disabled ? 0.45 : 1,
      cursor: item.disabled ? 'auto' : 'pointer',
    };
    return (
      <Button
        appearance="plain"
        tone="neutral"
        accessibilityLabel={item.label}
        disabled={item.disabled}
        onPress={onPress}
        style={cell}
        testID={testID}
      >
        <View style={{ alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.accentSoft,
            }}
          >
            <item.icon width={22} height={22} fill={tint} />
          </View>
          {/* Two lines, centred: a quarter of a phone is ~90dp, and "Photos and
            videos" cut to "Photos and …" named nothing. */}
          <Text
            variant="caption-1-regular"
            numberOfLines={2}
            style={{ color: palette.textSecondary, textAlign: 'center' }}
          >
            {item.label}
          </Text>
        </View>
      </Button>
    );
  }

  /** A full-width row: glyph, label. */
  function ListRow({
    item,
    onPress,
    testID,
  }: {
    item: AttachmentMenuItem;
    onPress: () => void;
    testID?: string;
  }) {
    const theme = useTheme();
    const palette = resolveChatComposerPalette(theme);
    const tint = item.color ?? palette.accent;
    const row: WebCssStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 40,
      height: 'auto',
      minWidth: 0,
      width: '100%',
      borderRadius: 10,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 6,
      paddingBottom: 6,
      opacity: item.disabled ? 0.45 : 1,
      cursor: item.disabled ? 'auto' : 'pointer',
    };
    return (
      <Button
        appearance="plain"
        tone="neutral"
        accessibilityLabel={item.label}
        disabled={item.disabled}
        onPress={onPress}
        style={row}
        testID={testID}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.accentSoft,
            }}
          >
            <item.icon width={18} height={18} fill={tint} />
          </View>
          <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
            {item.label}
          </Text>
        </View>
      </Button>
    );
  }

  function AttachmentMenu({
    children,
    open,
    defaultOpen,
    onOpenChange,
    items: itemsProp,
    layout = 'grid',
    columns = 4,
    onSelect,
    recent,
    label: labelProp,
    style,
    testID,
  }: AttachmentMenuProps) {
    useChatComposerWebCss();
    const { messages } = useMessages(CHAT_COMPOSER_MESSAGES);
    const localizedItems = React.useMemo(() => attachmentMenuItems(messages), [messages]);
    const items = itemsProp ?? localizedItems;
    const label = labelProp ?? messages.attach;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
    const isOpen = open ?? uncontrolledOpen;

    const setOpen = (next: boolean) => {
      if (open === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    // The grid is explicit ROWS, never one wrapping row. Android's Yoga gave the
    // first line of a wrapped row of Buttons the whole sheet's height and left
    // the second 8dp, so the fifth and sixth items (Contact, Poll) were clipped
    // out of a sheet that had already sized itself for them. A row of fixed
    // percentage cells measures the same on both platforms, and a short last
    // row keeps the columns.
    const perRow = Math.max(1, Math.floor(columns));
    const cellWidth: DimensionValue = `${100 / perRow}%`;
    const rows: AttachmentMenuItem[][] = [];
    for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
    const select = (item: AttachmentMenuItem) => {
      onSelect?.(item.id, item);
      setOpen(false);
    };

    return (
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          label={label}
          side="top"
          align="start"
          minWidth={layout === 'grid' ? Math.max(264, columns * 72) : 220}
          style={style}
          testID={testID}
        >
          {recent ? <View style={{ paddingBottom: 8 }}>{recent}</View> : null}
          {layout === 'grid' ? (
            <View style={{ flexDirection: 'column' }}>
              {rows.map((row) => (
                <View key={row[0]?.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {row.map((item) => (
                    <GridCell
                      key={item.id}
                      item={item}
                      width={cellWidth}
                      onPress={() => select(item)}
                      testID={testID ? `${testID}-${item.id}` : undefined}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'column', gap: 2 }}>
              {items.map((item) => (
                <ListRow
                  key={item.id}
                  item={item}
                  onPress={() => select(item)}
                  testID={testID ? `${testID}-${item.id}` : undefined}
                />
              ))}
            </View>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return AttachmentMenu;
}
