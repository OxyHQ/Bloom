import type { ComponentType, ReactNode } from 'react';
import { useDirectionProps } from '../hooks/use-is-rtl';
import type { ScrollAreaProps } from '../layout/types';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { BoardColumn, BoardProps } from './types';

type BoardFrameProps<Item> = BoardProps<Item> & {
  ScrollArea: ComponentType<ScrollAreaProps>;
  renderColumnContainer: (column: BoardColumn<Item>, children: ReactNode) => ReactNode;
  renderCardContainer: (item: Item, column: BoardColumn<Item>, children: ReactNode) => ReactNode;
  draggedItem?: { itemId: string; fromColumnId: string } | null;
  dropColumnId?: string | null;
};

/** Shared layout; platform wrappers own drag input, never application data. */
export function BoardBase<Item>({
  columns,
  getItemId,
  renderCard,
  renderColumnHeader,
  renderColumnFooter,
  renderEmptyColumn,
  columnWidth = 280,
  columnStyle,
  style,
  className,
  accessibilityLabel,
  testID,
  ScrollArea,
  renderColumnContainer,
  renderCardContainer,
  draggedItem,
  dropColumnId,
}: BoardFrameProps<Item>) {
  const { colors } = useTheme();
  const directionProps = useDirectionProps();
  return (
    <StyledView
      {...directionProps}
      style={[{ minWidth: 0 }, style]}
      className={className}
      testID={testID}
    >
      <ScrollArea
        horizontal
        accessibilityLabel={accessibilityLabel}
        style={{ minWidth: 0 }}
        contentContainerStyle={{ gap: 16, alignItems: 'flex-start', paddingBottom: 12 }}
        testID={testID ? `${testID}-scroller` : undefined}
      >
        {columns.map((column) => {
          const isDropTarget = dropColumnId === column.id;
          return renderColumnContainer(
            column,
            <StyledView
              style={[
                {
                  width: columnWidth,
                  gap: 8,
                  minHeight: 80,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDropTarget ? colors.primary : 'transparent',
                  padding: 4,
                },
                columnStyle,
              ]}
            >
              {renderColumnHeader ? (
                renderColumnHeader(column, { isDropTarget })
              ) : (
                <Text style={{ color: colors.text, fontWeight: '600' }}>{column.title}</Text>
              )}
              {column.items.map((item) =>
                renderCardContainer(
                  item,
                  column,
                  renderCard(item, column, {
                    isDragging:
                      draggedItem?.itemId === getItemId(item) &&
                      draggedItem.fromColumnId === column.id,
                  }),
                ),
              )}
              {column.items.length === 0 ? renderEmptyColumn?.(column) : null}
              {renderColumnFooter?.(column)}
            </StyledView>,
          );
        })}
      </ScrollArea>
    </StyledView>
  );
}
