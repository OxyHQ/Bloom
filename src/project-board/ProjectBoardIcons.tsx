import type { ComponentType } from 'react';
import { styled } from 'react-native-css';
import Svg, { Path } from 'react-native-svg';
import { RiCheckboxBlankCircleLine } from '../icons/remix/RiCheckboxBlankCircleLine';
import { RiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiEyeLine } from '../icons/remix/RiEyeLine';
import type { Props } from '../icons/shared';
import { StyledView } from '../styles/styled-primitives';
import { cx } from './constants';
import { RiInboxArchiveLine } from './RiInboxArchiveLine';
import { RiPieChart2Line } from './RiPieChart2Line';

const STATUS_ICONS = {
  backlog: RiInboxArchiveLine,
  todo: RiCheckboxBlankCircleLine,
  'in-progress': RiPieChart2Line,
  review: RiEyeLine,
  done: RiCheckboxCircleLine,
};
const StyledSvg: ComponentType<Props> = styled(Svg, { className: 'style' });
export function TicketStatusIcon({ status, className }: { status: string; className?: string }) {
  const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] ?? RiCheckboxBlankCircleLine;
  return (
    <StyledView className={cx('size-[18px] shrink-0', className)}>
      <Icon width={18} height={18} fill="currentColor" />
    </StyledView>
  );
}

export function TicketAssigneeIcon({ className }: { className?: string }) {
  return (
    <StyledSvg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      className={cx('inline-block size-[18px] shrink-0', className)}
    >
      <Path
        d="M9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9C16.5 13.1421 13.1421 16.5 9 16.5ZM9 15C12.3137 15 15 12.3137 15 9C15 5.68629 12.3137 3 9 3C5.68629 3 3 5.68629 3 9C3 12.3137 5.68629 15 9 15ZM5.25 9H6.75C6.75 10.2427 7.75732 11.25 9 11.25C10.2427 11.25 11.25 10.2427 11.25 9H12.75C12.75 11.071 11.071 12.75 9 12.75C6.92893 12.75 5.25 11.071 5.25 9Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}

export function TicketUrgencyIcon({ className }: { className?: string }) {
  return (
    <StyledSvg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      className={cx('inline-block size-[18px] shrink-0', className)}
    >
      <Path
        d="M15 9.75C15 11.4068 14.3285 12.9068 13.2427 13.9927L14.3033 15.0533C15.6605 13.6961 16.5 11.821 16.5 9.75C16.5 5.60786 13.1421 2.25 9 2.25C4.85786 2.25 1.5 5.60786 1.5 9.75C1.5 11.821 2.33947 13.6961 3.6967 15.0533L4.75736 13.9927C3.67157 12.9068 3 11.4068 3 9.75C3 6.43629 5.68629 3.75 9 3.75C12.3137 3.75 15 6.43629 15 9.75ZM11.4698 6.21973L7.875 9.375L9.375 10.875L12.5304 7.28039L11.4698 6.21973Z"
        fill="currentColor"
      />
    </StyledSvg>
  );
}

export function TicketFavoriteIcon({
  className,
  selected,
}: {
  className?: string;
  selected?: boolean;
}) {
  return (
    <StyledSvg
      width={17}
      height={17}
      viewBox="0 0 17 17"
      className={cx('size-[17px] shrink-0', className)}
      fill="none"
    >
      <Path
        d="M7.5767 2.7199A1 1 0 0 1 9.4233 2.7199 L10.3815 5.0236A1 1 0 0 0 11.2249 5.6363 L13.7119 5.8357A1 1 0 0 1 14.2825 7.5920 L12.3877 9.2151A1 1 0 0 0 12.0655 10.2066 L12.6444 12.6335A1 1 0 0 1 11.1505 13.7189 L9.0213 12.4184A1 1 0 0 0 7.9787 12.4184 L5.8495 13.7189A1 1 0 0 1 4.3556 12.6335 L4.9345 10.2066A1 1 0 0 0 4.6123 9.2151 L2.7175 7.5920A1 1 0 0 1 3.2881 5.8357 L5.7751 5.6363A1 1 0 0 0 6.6185 5.0236Z"
        fill={selected ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1}
      />
    </StyledSvg>
  );
}
