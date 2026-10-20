import { useId, useRef, useState, type DragEvent } from 'react';
import { ScrollArea } from '../layout/ScrollArea.web';
import { BoardBase } from './BoardBase';
import type { BoardMove, BoardProps } from './types';

const DRAG_TYPE = 'application/x-bloom-board-item';
type DraggedItem = Pick<BoardMove, 'itemId' | 'fromColumnId'>;

/** Controlled board with instance-scoped HTML drag and drop. */
export function Board<Item>(props: BoardProps<Item>) {
  const scope = useId();
  const activeDrag = useRef<DraggedItem | null>(null);
  const blockedDrag = useRef(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);
  const canMove = !props.readOnly && Boolean(props.onMove);

  const clearDrag = () => {
    activeDrag.current = null;
    setDraggedItem(null);
    setDropColumnId(null);
  };
  const validDrag = (event: DragEvent<HTMLDivElement>, toColumnId: string) => {
    const drag = activeDrag.current;
    return (
      canMove &&
      drag !== null &&
      drag.fromColumnId !== toColumnId &&
      Array.from(event.dataTransfer.types).includes(DRAG_TYPE) &&
      props.columns.some(
        (column) =>
          column.id === drag.fromColumnId &&
          column.items.some((item) => props.getItemId(item) === drag.itemId),
      )
    );
  };

  return (
    <BoardBase
      {...props}
      ScrollArea={ScrollArea}
      draggedItem={canMove ? draggedItem : null}
      dropColumnId={canMove ? dropColumnId : null}
      renderColumnContainer={(column, children) => (
        <div
          key={column.id}
          role="group"
          aria-label={column.title}
          data-bloom-board-column={column.id}
          style={{ flexShrink: 0 }}
          onDragOver={(event) => {
            if (!validDrag(event, column.id)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDropColumnId(column.id);
          }}
          onDragLeave={(event) => {
            if (
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
              return;
            setDropColumnId(null);
          }}
          onDrop={(event) => {
            if (!validDrag(event, column.id) || event.dataTransfer.getData(DRAG_TYPE) !== scope)
              return;
            event.preventDefault();
            event.stopPropagation();
            const drag = activeDrag.current;
            clearDrag();
            if (drag) props.onMove?.({ ...drag, toColumnId: column.id });
          }}
        >
          {children}
        </div>
      )}
      renderCardContainer={(item, column, children) => (
        <div
          key={props.getItemId(item)}
          data-bloom-board-item={props.getItemId(item)}
          draggable={canMove}
          onPointerDownCapture={(event) => {
            const target = event.target instanceof Element ? event.target : null;
            const interactive = target?.closest(
              'button, input, textarea, select, a, [role="button"], [role="checkbox"], [role="combobox"], [role="switch"], [contenteditable="true"]',
            );
            // A whole-card Pressable may open the record and still be draggable.
            // Controls nested inside it keep their own selection/input behavior.
            blockedDrag.current = Boolean(
              target?.closest('[data-bloom-board-no-drag]') ||
                (interactive && interactive !== event.currentTarget.firstElementChild),
            );
          }}
          onDragStart={(event) => {
            if (!canMove || blockedDrag.current) {
              event.preventDefault();
              return;
            }
            const drag = { itemId: props.getItemId(item), fromColumnId: column.id };
            activeDrag.current = drag;
            setDraggedItem(drag);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData(DRAG_TYPE, scope);
            event.stopPropagation();
          }}
          onDragEnd={clearDrag}
        >
          {children}
        </div>
      )}
    />
  );
}
