import { BloomScope } from '../appearance';
import Animated from 'react-native-reanimated';
import { PageHeader } from '../page-header';
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
  onItemPress?: (item: Item) => void;
  itemAccessibilityLabel?: (item: Item) => string;
};

/** The original ProjectBoard column/card renderer, with slots for product-owned records. */
export function ProjectBoardCanvas<Item>({
  engine,
  variant,
  columnWidth = 273,
  columnStyle,
  style,
  className,
  accessibilityLabel,
  testID = 'project-board',
  dragMode = 'card',
  fillColumns = true,
  onColumnOrderChange,
  onItemPress,
  itemAccessibilityLabel,
  ...props
}: CanvasProps<Item>) {
  const { colors } = useTheme();
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const { Portal, AppShellPanels, ScreenScrollView } = useProjectBoardPlatform();
  const directionProps = useDirectionProps();
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
                {dragMode === 'card' && (present || retained) && engine.canMove ? (
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
      onLayout={engine.measure}
      className={cx('min-h-0 flex-1', className)}
      style={[{ minWidth: 0 }, style]}
      accessibilityLabel={accessibilityLabel ?? m.board}
      testID={template ? undefined : testID}
    >
      <BloomScope panelRadius={20}>
        <AppShellPanels
          scope={template ? 'region' : 'local'}
          testID={`${testID}-panels`}
          layout={{
            mode: 'deck',
            gap: 8,
            viewportRef: engine.viewport,
            onViewportScroll: engine.measure,
            onPanelOrderChange: !props.readOnly ? onColumnOrderChange : undefined,
            panels: engine.renderedColumns.map((column) => ({
              id: column.id,
              testID: `${testID}-column-${column.id}`,
              width: columnWidth,
              minWidth: columnWidth,
              span: fillColumns ? 1 : 0,
              reorderable: !props.readOnly && !!onColumnOrderChange,
              reorderLabel: column.title,
              chrome: 'none',
              surfaceColor:
                engine.over?.columnId === column.id
                  ? colors.backgroundTertiary
                  : colors.backgroundSecondary,
              surfaceClassName: cx(
                'bg-background-secondary-default ring-2 ring-inset ring-transparent transition-[box-shadow,background-color] duration-150 ease-out',
                engine.over?.columnId === column.id &&
                  'bg-background-secondary-hover ring-border-button-hover',
              ),
              header: (
                <PageHeader
                  density="compact"
                  safeArea={false}
                  scrim="none"
                  title={
                    props.renderColumnHeader ? (
                      props.renderColumnHeader(column, {
                        isDropTarget: engine.over?.columnId === column.id,
                      })
                    ) : (
                      <Text variant="body-medium">{column.title}</Text>
                    )
                  }
                  actions={props.renderColumnActions?.(column)}
                />
              ),
              content: (
                <StyledView
                  ref={(node) => {
                    engine.columnNodes.current[column.id] = node;
                  }}
                  onLayout={engine.measure}
                  {...{ dataSet: { 'bloom-board-column': column.id } }}
                  className="min-h-0 min-w-0 flex-1"
                  style={columnStyle}
                >
                  <StyledView className="relative min-h-0 flex-1">
                    <ScreenScrollView
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
                      {props.renderColumnFooter?.(column)}
                    </ScreenScrollView>
                    {column.items.length === 0 ? props.renderEmptyColumn?.(column) : null}
                  </StyledView>
                </StyledView>
              ),
            })),
          }}
        />
      </BloomScope>
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
