import { ScrollArea } from '../layout/ScrollArea';
import { StyledView } from '../styles/styled-primitives';
import { BoardBase } from './BoardBase';
import type { BoardProps } from './types';

/**
 * Controlled board composition. Native moves belong in the application's
 * accessible card actions; this frame does not intercept touch scrolling.
 */
export function Board<Item>(props: BoardProps<Item>) {
  return (
    <BoardBase
      {...props}
      ScrollArea={ScrollArea}
      renderColumnContainer={(column, children) => (
        <StyledView key={column.id} accessibilityLabel={column.title}>
          {children}
        </StyledView>
      )}
      renderCardContainer={(item, _column, children) => (
        <StyledView key={props.getItemId(item)}>{children}</StyledView>
      )}
    />
  );
}
