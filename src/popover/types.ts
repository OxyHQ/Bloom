import type {
  OverlayOpenProps,
  OverlaySurfaceProps,
  OverlayTriggerProps,
} from '../floating/types';

export type PopoverProps = React.PropsWithChildren<OverlayOpenProps>;
export type PopoverTriggerProps = OverlayTriggerProps;
export type PopoverContentProps = OverlaySurfaceProps;
