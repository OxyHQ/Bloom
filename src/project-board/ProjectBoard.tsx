import * as Accordion from '../accordion';
import { Screen, ScreenScrollView } from '../screen';
import { Button, CloseButton } from '../button';
import { AppShellPanels } from '../app-shell';
import { Dialog } from '../dialog';
import * as Menu from '../dropdown-menu';
import { Portal } from '../portal';
import * as Select from '../select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { ProjectBoardBase } from './ProjectBoardBase';
import { TicketCornerGenieSurface, TicketGenieSurface } from './TicketGenieSurface';
import { ProjectBoardPlatformContext } from './context';
import type { ProjectBoardProps } from './types';

const platform = {
  ...Accordion,
  Screen,
  AppShellPanels,
  ScreenScrollView,
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
export function ProjectBoard<Item>(props: ProjectBoardProps<Item>) {
  return (
    <ProjectBoardPlatformContext.Provider value={platform}>
      <ProjectBoardBase {...props} />
    </ProjectBoardPlatformContext.Provider>
  );
}
