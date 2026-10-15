import React, { memo } from 'react';
import { ScrollView, View, type TextStyle } from 'react-native';

import { CodeBlock } from '../code';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { useMarkdownContext } from './context';
import { MarkdownInlineText } from './MarkdownInline';
import { MARKDOWN_MESSAGES } from './messages';
import type { MarkdownBlock, MarkdownColumnAlign, MarkdownListItem, MarkdownSize } from './types';

const BODY: Record<MarkdownSize, TypeScaleVariant> = {
  sm: 'body-2-regular',
  md: 'body-regular',
  // The ramp has no 16/28 step: `lg` is `headline` with the loose line height set below.
  lg: 'headline-regular',
};

const BODY_LINE_HEIGHT: Record<MarkdownSize, number> = { sm: 18, md: 20, lg: 28 };

/** Only a size whose line height the ramp cannot express carries one of its own. */
const BODY_STYLE: Record<MarkdownSize, TextStyle | undefined> = {
  sm: undefined,
  md: undefined,
  lg: { lineHeight: BODY_LINE_HEIGHT.lg },
};

const HEADING: Record<MarkdownSize, TypeScaleVariant[]> = {
  sm: [
    'title-2-semibold',
    'title-3-semibold',
    'headline-semibold',
    'body-semibold',
    'body-2-semibold',
    'body-2-semibold',
  ],
  md: [
    'title-1-semibold',
    'title-2-semibold',
    'title-3-semibold',
    'headline-semibold',
    'body-semibold',
    'body-semibold',
  ],
  lg: [
    'title-3-semibold',
    'headline-semibold',
    'headline-semibold',
    'headline-semibold',
    'headline-semibold',
    'headline-semibold',
  ],
};

/** The space between blocks, and the tighter space between a list's items. */
const BLOCK_GAP: Record<MarkdownSize, number> = { sm: 8, md: 12, lg: 16 };
const ITEM_GAP = 4;

const BULLETS = ['•', '◦', '▪'];
const TASK_BOX = 16;

interface BlocksProps {
  blocks: MarkdownBlock[];
  /** The text may still grow: only the last block is read as unfinished. */
  streaming: boolean;
  /** How deep in lists this is; picks the bullet. */
  depth?: number;
  gap?: number;
}

/** A column of blocks. */
export function MarkdownBlocks({ blocks, streaming, depth = 0, gap }: BlocksProps) {
  const { size } = useMarkdownContext();
  return (
    <View style={{ gap: gap ?? BLOCK_GAP[size] }}>
      {blocks.map((block, index) => (
        <MarkdownBlockView
          key={index}
          block={block}
          streaming={streaming && index === blocks.length - 1}
          depth={depth}
        />
      ))}
    </View>
  );
}

interface BlockProps {
  block: MarkdownBlock;
  streaming: boolean;
  depth: number;
}

const MarkdownBlockView = memo(function MarkdownBlockView({ block, streaming, depth }: BlockProps) {
  const { size, renderCodeBlock } = useMarkdownContext();
  const { colors } = useTheme();

  switch (block.type) {
    case 'paragraph':
      return (
        <Text variant={BODY[size]} style={BODY_STYLE[size]} selectable>
          <MarkdownInlineText source={block.text} streaming={streaming} />
        </Text>
      );
    case 'heading': {
      // react-native-web turns `role="heading"` into an element only with its level.
      const level = IS_WEB ? { 'aria-level': block.level } : null;
      return (
        <Text variant={HEADING[size][block.level - 1]} role="heading" selectable {...level}>
          <MarkdownInlineText source={block.text} streaming={streaming} />
        </Text>
      );
    }
    case 'code':
      return renderCodeBlock ? (
        renderCodeBlock(block.code, block.language)
      ) : (
        <CodeBlock code={block.code} language={block.language} lineNumbers={false} />
      );
    case 'quote':
      return (
        <View style={{ borderStartWidth: 3, borderStartColor: colors.border, paddingStart: 12 }}>
          <MarkdownBlocks blocks={block.children} streaming={streaming} depth={depth} />
        </View>
      );
    case 'rule':
      return <View role="separator" style={{ height: 1, backgroundColor: colors.border }} />;
    case 'list':
      return (
        <View role="list" style={{ gap: ITEM_GAP }}>
          {block.items.map((item, index) => (
            <MarkdownListItemView
              key={index}
              item={item}
              marker={
                block.ordered ? `${block.start + index}.` : (BULLETS[depth % BULLETS.length] ?? '•')
              }
              ordered={block.ordered}
              streaming={streaming && index === block.items.length - 1}
              depth={depth}
            />
          ))}
        </View>
      );
    case 'table':
      return (
        <MarkdownTable
          align={block.align}
          header={block.header}
          rows={block.rows}
          streaming={streaming}
        />
      );
  }
});

interface ListItemProps {
  item: MarkdownListItem;
  marker: string;
  ordered: boolean;
  streaming: boolean;
  depth: number;
}

function MarkdownListItemView({ item, marker, ordered, streaming, depth }: ListItemProps) {
  const { size } = useMarkdownContext();
  const { colors } = useTheme();
  const lineHeight = BODY_LINE_HEIGHT[size];
  // The marker column is as wide as the widest number, so the text hangs in line.
  const width = ordered ? 9 * marker.length + 6 : 18;

  return (
    <View role="listitem" style={{ flexDirection: 'row' }}>
      <View
        style={{
          width,
          marginEnd: 6,
          height: lineHeight,
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        {...(ordered || item.checked !== undefined
          ? null
          : { 'aria-hidden': true, importantForAccessibility: 'no-hide-descendants' as const })}
      >
        {item.checked !== undefined ? (
          <TaskBox checked={item.checked} />
        ) : (
          <Text variant={BODY[size]} style={[BODY_STYLE[size], { color: colors.textSecondary }]}>
            {marker}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <MarkdownBlocks
          blocks={item.children}
          streaming={streaming}
          depth={depth + 1}
          gap={ITEM_GAP}
        />
      </View>
    </View>
  );
}

/** A task item's box. Read-only: the document is not a form. */
function TaskBox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();
  const { messages } = useMessages(MARKDOWN_MESSAGES);
  return (
    <View
      role="img"
      accessibilityLabel={checked ? messages.taskDone : messages.taskTodo}
      style={{
        width: TASK_BOX,
        height: TASK_BOX,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: checked ? colors.primary : colors.border,
        backgroundColor: checked ? colors.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <RiCheckLine width={12} height={12} fill={colors.primaryForeground} /> : null}
    </View>
  );
}

interface TableProps {
  align: Array<MarkdownColumnAlign | undefined>;
  header: string[];
  rows: string[][];
  streaming: boolean;
}

const MIN_COLUMN = 96;

function MarkdownTable({ align, header, rows, streaming }: TableProps) {
  const { size } = useMarkdownContext();
  const { colors } = useTheme();

  const cells = (values: string[], isHeader: boolean, isLast: boolean) =>
    values.map((value, column) => {
      const textAlign: TextStyle['textAlign'] = align[column];
      return (
        <View
          key={column}
          role={isHeader ? 'columnheader' : 'cell'}
          style={{ flex: 1, minWidth: MIN_COLUMN, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <Text
            variant={isHeader ? HEADING[size][4] : BODY[size]}
            style={[isHeader ? undefined : BODY_STYLE[size], { textAlign }]}
            selectable
          >
            <MarkdownInlineText source={value} streaming={streaming && isLast} />
          </Text>
        </View>
      );
    });

  return (
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
      <View
        role="table"
        style={{
          flexGrow: 1,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <View
          role="row"
          style={{ flexDirection: 'row', backgroundColor: colors.backgroundSecondary }}
        >
          {cells(header, true, false)}
        </View>
        {rows.map((row, index) => (
          <View
            key={index}
            role="row"
            style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border }}
          >
            {cells(row, false, index === rows.length - 1)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
