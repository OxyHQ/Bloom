import { useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { BoardDragContext, BoardGesture, type BoardDragBinding } from './BoardGesture';
import { BoardOverlay } from './BoardOverlay';
import { ProjectBoardCardSurface } from './ProjectBoardCardSurface';
import { BoardPresenceList } from './BoardPresence';
import { boardOccurrence } from './board-engine';
import { useProjectBoardPlatform } from './context';
import { cx } from './constants';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { useMessages } from '../locale/messages';
import type { BoardEngine } from './use-board-engine';
import type { ControlledProjectBoardProps } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

type CanvasProps<Item> = Omit<ControlledProjectBoardProps<Item>, 'variant'> & {
  engine: BoardEngine<Item>;
  variant: 'template' | 'embedded';
  onWidthChange?: (width: number) => void;
  onItemPress?: (item: Item) => void;
  itemAccessibilityLabel?: (item: Item) => string;
};

/** The original ProjectBoard column/card renderer, with slots for product-owned records. */
export function ProjectBoardCanvas<Item>({
  engine,
  variant,
  columnWidth = 280,
  columnStyle,
  style,
  className,
  accessibilityLabel,
  testID = 'project-board',
  dragMode = 'card',
  onWidthChange,
  onItemPress,
  itemAccessibilityLabel,
  ...props
}: CanvasProps<Item>) {
  const { colors } = useTheme();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const { Portal, ScrollArea } = useProjectBoardPlatform();
  const directionProps = useDirectionProps();
  const { width } = useWindowDimensions();
  const template = variant === 'template';
  const overlayColumn = props.columns.find(
    (column) => column.id === engine.active?.origin.fromColumnId,
  );
  const columnBody = (column: (typeof props.columns)[number]) => (
    <>
      <BoardPresenceList
        items={column.items}
        getItemId={props.getItemId}
        retainId={
          engine.origin.current?.fromColumnId === column.id
            ? engine.origin.current.itemId
            : undefined
        }
      >
        {({ item, present }, paintStyle, onHeight) => {
          const itemId = props.getItemId(item);
          const key = boardOccurrence(column.id, itemId);
          const from = { itemId, fromColumnId: column.id };
          const isDragging =
            !!engine.active &&
            engine.active.origin.itemId === itemId &&
            (engine.active.origin.fromColumnId === column.id ||
              engine.over?.columnId === column.id);
          const retained =
            engine.origin.current?.itemId === itemId &&
            engine.origin.current.fromColumnId === column.id;
          const binding: BoardDragBinding = {
            nativeID: engine.nativeId(column.id, itemId),
            enabled: engine.canMove && (present || retained),
            allowReorder: engine.allowReorder,
            onStart: (x, y) => engine.beginDrag(from, x, y),
            onUpdate: engine.dragOver,
            onEnd: engine.endDrag,
            onAccessibleMove: (direction) => engine.accessibleMove(from, direction),
            suppressOpen: engine.suppressOpen,
          };
          const card = (
            <AnimatedView style={paintStyle}>
              <ProjectBoardCardSurface wholeCardDrag={dragMode === 'card'}>
                {props.renderCard(item, column, { isDragging })}
              </ProjectBoardCardSurface>
            </AnimatedView>
          );
          const content = (
            <AnimatedView
              className={
                template
                  ? 'shrink-0 touch-manipulation rounded-xl outline-none focus-visible:ring-[2.5px] focus-visible:ring-border-button-hover'
                  : undefined
              }
              style={{
                opacity: engine.droppingKey === key ? 0 : isDragging ? 0.2 : present ? 1 : 0.2,
                borderTopWidth:
                  engine.allowReorder &&
                  engine.over?.columnId === column.id &&
                  engine.over.index ===
                    column.items.findIndex((entry) => props.getItemId(entry) === itemId)
                    ? 3
                    : 0,
                borderTopColor: colors.primary,
              }}
            >
              <StyledView
                ref={(node) => {
                  if (present || !node) engine.itemNodes.current[key] = node;
                }}
                onLayout={(event) => {
                  onHeight(event.nativeEvent.layout.height);
                  engine.measure();
                }}
                {...{ dataSet: { 'bloom-board-item': itemId } }}
              >
                {dragMode === 'card' && present && engine.canMove ? (
                  <StyledPressable
                    nativeID={binding.nativeID}
                    accessibilityRole="button"
                    accessibilityLabel={
                      itemAccessibilityLabel?.(item) ?? props.getItemLabel?.(item) ?? itemId
                    }
                    accessibilityHint={m.keyboardHint}
                    aria-haspopup={onItemPress ? 'dialog' : undefined}
                    onPress={() => {
                      if (!engine.suppressOpen()) onItemPress?.(item);
                    }}
                    accessibilityActions={[
                      ...(engine.allowReorder
                        ? [
                            { name: 'moveUp', label: m.moveUp },
                            { name: 'moveDown', label: m.moveDown },
                          ]
                        : []),
                      { name: 'nextColumn', label: m.nextColumn },
                      { name: 'previousColumn', label: m.previousColumn },
                    ]}
                    onAccessibilityAction={(event) => {
                      const action = event.nativeEvent.actionName;
                      if (
                        action === 'moveUp' ||
                        action === 'moveDown' ||
                        action === 'nextColumn' ||
                        action === 'previousColumn'
                      )
                        binding.onAccessibleMove(
                          action === 'moveUp'
                            ? 'up'
                            : action === 'moveDown'
                              ? 'down'
                              : action === 'nextColumn'
                                ? 'next'
                                : 'previous',
                        );
                    }}
                  >
                    {card}
                  </StyledPressable>
                ) : (
                  card
                )}
              </StyledView>
            </AnimatedView>
          );
          return (
            <BoardDragContext.Provider value={present || retained ? binding : null}>
              {dragMode === 'card' && (present || retained) ? (
                <BoardGesture binding={binding}>{content}</BoardGesture>
              ) : (
                content
              )}
            </BoardDragContext.Provider>
          );
        }}
      </BoardPresenceList>
      {engine.allowReorder &&
        engine.over?.columnId === column.id &&
        engine.over.index >= column.items.length && (
          <StyledView style={{ height: 3, backgroundColor: colors.primary }} />
        )}
    </>
  );
  return (
    <StyledView
      {...directionProps}
      ref={engine.boardNode}
      onLayout={(event) => {
        onWidthChange?.(event.nativeEvent.layout.width);
        engine.measure();
      }}
      className={cx(
        template && '-mx-3 min-h-0 flex-1 overflow-hidden sm:-mx-6 lg:-me-7',
        className,
      )}
      style={[
        { minWidth: 0 },
        template && {
          marginLeft: width >= 640 ? -24 : -12,
          marginRight: width >= 1024 ? -28 : width >= 640 ? -24 : -12,
        },
        style,
      ]}
      testID={template ? undefined : testID}
    >
      <ScrollArea
        ref={engine.scrollView}
        horizontal
        style={template ? { flex: 1 } : { minWidth: 0 }}
        contentContainerStyle={
          template
            ? {
                gap: 8,
                paddingLeft: width >= 640 ? 24 : 12,
                paddingRight: width >= 1024 ? 28 : width >= 640 ? 24 : 12,
              }
            : { gap: 8, alignItems: 'flex-start', paddingBottom: 12 }
        }
        showsHorizontalScrollIndicator
        accessibilityLabel={accessibilityLabel ?? m.columns}
        onScroll={(event) => {
          engine.scrollX.current = event.nativeEvent.contentOffset.x;
          engine.measure();
        }}
        scrollEventThrottle={16}
        testID={`${testID}-scroller`}
      >
        {engine.renderedColumns.map((column) => {
          const isDropTarget = engine.over?.columnId === column.id;
          return (
            <StyledView
              key={column.id}
              ref={(node) => {
                engine.columnNodes.current[column.id] = node;
              }}
              onLayout={engine.measure}
              accessibilityLabel={column.title}
              {...{ dataSet: { 'bloom-board-column': column.id } }}
              testID={`${testID}-column-${column.id}`}
              className={cx(
                'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2-5xl bg-background-secondary-default pt-3',
                template && 'h-full',
                'ring-2 ring-inset ring-transparent transition-[box-shadow,background-color] duration-150 ease-out',
                isDropTarget && 'bg-background-secondary-hover ring-border-button-hover',
              )}
              style={[{ width: columnWidth, minHeight: template ? 300 : 80 }, columnStyle]}
            >
              {props.renderColumnHeader ? (
                props.renderColumnHeader(column, { isDropTarget })
              ) : (
                <Text style={{ color: colors.text, fontWeight: '600' }}>{column.title}</Text>
              )}
              <StyledView className={template ? 'relative min-h-0 flex-1' : undefined}>
                {template ? (
                  <ScrollArea
                    ref={(node) => {
                      engine.columnScrolls.current[column.id] = node;
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 8 }}
                    accessibilityLabel={column.title}
                    onScroll={(event) => {
                      engine.columnScrollY.current[column.id] = event.nativeEvent.contentOffset.y;
                      engine.measure();
                    }}
                    scrollEventThrottle={16}
                  >
                    {columnBody(column)}
                  </ScrollArea>
                ) : (
                  <StyledView style={{ paddingHorizontal: 6, paddingTop: 8 }}>
                    {columnBody(column)}
                  </StyledView>
                )}
                {column.items.length === 0 ? props.renderEmptyColumn?.(column) : null}
              </StyledView>
              {props.renderColumnFooter?.(column)}
            </StyledView>
          );
        })}
      </ScrollArea>
      {engine.active?.pointer && overlayColumn && (
        <BoardOverlay Portal={Portal} style={engine.overlayStyle} testID={`${testID}-drag-overlay`}>
          <ProjectBoardCardSurface overlay wholeCardDrag={dragMode === 'card'}>
            {props.renderCard(engine.active.item, overlayColumn, {
              isDragging: true,
              isOverlay: true,
            })}
          </ProjectBoardCardSurface>
        </BoardOverlay>
      )}
    </StyledView>
  );
}
