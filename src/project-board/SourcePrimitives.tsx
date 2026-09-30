import { Children, type ComponentType, type ReactNode, type Ref } from 'react';
import type { View as NativeView, TextProps, ViewProps } from 'react-native';
import { styled } from 'react-native-css';
import { Avatar as BloomAvatar } from '../avatar';
import type { AvatarProps } from '../avatar/types';
import { Chip as BloomChip } from '../chip';
import type { ChipProps } from '../chip/types';
import { RiAddFill as BaseRiAddFill } from '../icons/remix/RiAddFill';
import { RiAddLine as BaseRiAddLine } from '../icons/remix/RiAddLine';
import { RiArrowRightSLine as BaseRiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiArrowUpLine as BaseRiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiCheckLine as BaseRiCheckLine } from '../icons/remix/RiCheckLine';
import { RiCheckboxCircleLine as BaseRiCheckboxCircleLine } from '../icons/remix/RiCheckboxCircleLine';
import { RiEditLine as BaseRiEditLine } from '../icons/remix/RiEditLine';
import { RiEqualizerLine as BaseRiEqualizerLine } from '../icons/remix/RiEqualizerLine';
import { RiFileCopyLine as BaseRiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiFolder6Line as BaseRiFolder6Line } from '../icons/remix/RiFolder6Line';
import { RiInbox2Line as BaseRiInbox2Line } from '../icons/remix/RiInbox2Line';
import { RiKanbanView2 as BaseRiKanbanView2 } from '../icons/remix/RiKanbanView2';
import { RiLinkM as BaseRiLinkM } from '../icons/remix/RiLinkM';
import { RiMenuLine as BaseRiMenuLine } from '../icons/remix/RiMenuLine';
import { RiMore2Fill as BaseRiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiSideBarLine as BaseRiSideBarLine } from '../icons/remix/RiSideBarLine';
import { RiSortDesc as BaseRiSortDesc } from '../icons/remix/RiSortDesc';
import type { Props as IconProps } from '../icons/shared';
import {
  StyledPressable,
  StyledView,
  type StyledPressableProps,
} from '../styles/styled-primitives';
import { Text as BloomText } from '../typography';
import { RiMoreLine as SourceMore } from './RiMoreLine';
import { RiRestartLine as SourceRestart } from './RiRestartLine';
import { CHIP_BASE, cx, PRIORITY_STYLES } from './constants';
import type { TicketPriority } from './types';

/** HTML flex is row by default; Yoga defaults to column. Preserve the source
 * class recipe and add only that platform layout equivalent. */
function rowClass(className?: string) {
  return className &&
    /(?:^|\s)(?:inline-)?flex(?:\s|$)/.test(className) &&
    !/(?:^|\s)flex-col(?:\s|$)/.test(className)
    ? cx(className, 'flex-row')
    : className;
}
function textChildren(children: ReactNode) {
  return Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? (
      <BloomText className="text-body-medium text-text-primary">
        {child}
      </BloomText>
    ) : (
      child
    ),
  );
}
export function SourceView({
  className,
  children,
  ...props
}: ViewProps & { ref?: Ref<NativeView> }) {
  return (
    <StyledView {...props} className={rowClass(className)}>
      {textChildren(children)}
    </StyledView>
  );
}
export function SourceText(props: TextProps) {
  return <BloomText {...props} />;
}
export function SourcePressable({
  className,
  children,
  ...props
}: StyledPressableProps & {
  href?: string;
  target?: string;
  rel?: string;
  dataSet?: Record<string, string>;
}) {
  return (
    <StyledPressable {...props} className={rowClass(className)}>
      {typeof children === 'function' ? children : textChildren(children)}
    </StyledPressable>
  );
}
export function SourceAvatar({
  className,
  ...props
}: AvatarProps & { className?: string }) {
  const explicitSize = className?.match(/size-\[(\d+)px\]/)?.[1];
  return (
    <SourceView className={className}>
      <BloomAvatar
        {...props}
        size={explicitSize ? Number(explicitSize) : props.size}
      />
    </SourceView>
  );
}
export function SourceChip({ className, ...props }: ChipProps) {
  return (
    <BloomChip
      {...props}
      className={cx(
        className &&
          /(?:^|\s)text-(?:body|caption|title|headline|display|large-title)[\w-]*/.test(
            className,
          )
          ? CHIP_BASE.replace(' text-body-medium', '')
          : CHIP_BASE,
        className,
      )}
    />
  );
}
export function PriorityChip({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  return (
    <SourceChip className={cx(PRIORITY_STYLES[priority], className)}>
      {priority}
    </SourceChip>
  );
}
/** Bloom's SVG icon components already read a styled colour; wrap at module
 * scope so the original icon utility classes resolve on both platforms. */
function icon(
  Icon: ComponentType<IconProps>,
): ComponentType<IconProps & { className?: string }> {
  return styled(Icon, { className: 'style' });
}
export const RiAddLine = icon(BaseRiAddLine);
export const RiAddFill = icon(BaseRiAddFill);
export const RiArrowRightSLine = icon(BaseRiArrowRightSLine);
export const RiFolder6Line = icon(BaseRiFolder6Line);
export const RiMoreLine = icon(SourceMore);
export const RiMore2Fill = icon(BaseRiMore2Fill);
export const RiMenuLine = icon(BaseRiMenuLine);
export const RiInbox2Line = icon(BaseRiInbox2Line);
export const RiKanbanView2 = icon(BaseRiKanbanView2);
export const RiCheckLine = icon(BaseRiCheckLine);
export const RiEqualizerLine = icon(BaseRiEqualizerLine);
export const RiSideBarLine = icon(BaseRiSideBarLine);
export const RiSortDesc = icon(BaseRiSortDesc);
export const RiArrowUpLine = icon(BaseRiArrowUpLine);
export const RiLinkM = icon(BaseRiLinkM);
export const RiFileCopyLine = icon(BaseRiFileCopyLine);
export const RiRestartLine = icon(SourceRestart);
export const RiCheckboxCircleLine = icon(BaseRiCheckboxCircleLine);
export const RiEditLine = icon(BaseRiEditLine);
