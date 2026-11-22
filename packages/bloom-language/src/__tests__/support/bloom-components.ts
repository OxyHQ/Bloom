import { createElement } from 'react';

export const BloomImage = 'BloomImage';
/** Bloom's Button and its `Button.Group`, as Bloom's own object carries the group. */
export const Button = Object.assign(
  (props: Record<string, unknown>) => createElement('BloomButton', props),
  { Group: 'BloomButtonGroup' },
);
export const EngagementAction = 'EngagementAction';
export const EngagementBar = 'EngagementBar';
export const EngagementGroup = 'EngagementGroup';
export const BlurIsland = 'BlurIsland';
export const Surface = 'Surface';
export const Fab = 'BloomFab';
export const PageHeader = 'PageHeader';
export const BottomBar = 'BottomBar';
export const DropdownMenu = 'DropdownMenu';
export const DropdownMenuTrigger = 'DropdownMenuTrigger';
export const DropdownMenuContent = 'DropdownMenuContent';
export const DropdownMenuItem = 'DropdownMenuItem';
export const DropdownMenuCheckboxItem = 'DropdownMenuCheckboxItem';
export const DropdownMenuGroup = 'DropdownMenuGroup';
export const DropdownMenuLabel = 'DropdownMenuLabel';
export const DropdownMenuSeparator = 'DropdownMenuSeparator';
export const DropdownMenuSub = 'DropdownMenuSub';
export const DropdownMenuSubTrigger = 'DropdownMenuSubTrigger';
export const DropdownMenuSubContent = 'DropdownMenuSubContent';
export const AspectRatio = 'AspectRatio';
export const ConcentricView = 'ConcentricView';
export const Divider = 'Divider';
export const Fill = 'Fill';
export const ResponsiveGrid = 'ResponsiveGrid';
export const AvatarGroup = 'AvatarGroup';
export const Badge = 'Badge';
export const AvatarPresence = 'AvatarPresence';
export const IconCircle = 'IconCircle';
export const Loading = 'Loading';
export const PressableScale = 'PressableScale';
export const SubtleHover = 'SubtleHover';
/** The hover group's marker: a web `data-*` attribute (the stand-in names it). */
export const hoverGroupProps = { dataSet: { bloomHoverGroup: '' } };
// Bloom's skeleton shapes (`@oxy.so/bloom/skeleton`).
export const Region = 'SkeletonRegion';
export const Text = 'SkeletonText';
export const Circle = 'SkeletonCircle';
export const Pill = 'SkeletonPill';
export const Box = 'SkeletonBox';
