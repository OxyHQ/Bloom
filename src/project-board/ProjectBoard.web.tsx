import { Button, CloseButton } from '../button/index.web';
import { Dialog } from '../dialog/index.web';
import * as Menu from '../dropdown-menu/index.web';
import { Portal } from '../portal/index.web';
import * as Select from '../select/index.web';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/index.web';
import { ProjectBoardBase } from './ProjectBoardBase';
import { TicketCornerGenieSurface } from './TicketCornerGenieSurface.web';
import { TicketGenieSurface } from './TicketGenieSurface.web';
import { ProjectBoardPlatformContext } from './context';
import type { ProjectBoardProps } from './types';

const platform = {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TicketGenieSurface,
  TicketCornerGenieSurface,
  Button,
  CloseButton,
  Dialog,
  Portal,
  ...Select,
  ...Menu,
};
export function ProjectBoard(props: ProjectBoardProps) {
  return (
    <ProjectBoardPlatformContext.Provider value={platform}>
      <ProjectBoardBase {...props} />
    </ProjectBoardPlatformContext.Provider>
  );
}
