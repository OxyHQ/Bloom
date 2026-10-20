import type { ReactNode } from 'react';
import { StyledView } from '../styles/styled-primitives';
import { cx } from './constants';

/** ProjectBoard's original card material, shared by ticket and product-owned content. */
export function ProjectBoardCardSurface({
  children,
  overlay = false,
  wholeCardDrag = true,
}: {
  children: ReactNode;
  overlay?: boolean;
  wholeCardDrag?: boolean;
}) {
  return (
    <StyledView
      className={cx(
        'relative flex w-full flex-col rounded-xl bg-background-primary-default text-start shadow-[0_1px_1px_rgb(0_0_0/0.05)] dark:bg-background-primary-default/60',
        'ring-[2.5px] ring-transparent transition-[box-shadow,opacity] duration-200 ease-out motion-reduce:transition-none',
        overlay
          ? 'cursor-grabbing dark:backdrop-blur-[12px]'
          : 'hover:shadow-sm hover:ring-border-button-hover',
        !overlay && wholeCardDrag && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {children}
    </StyledView>
  );
}
