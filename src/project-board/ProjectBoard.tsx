import { Button, CloseButton } from '../button';
import { Dialog } from '../dialog';
import * as Select from '../select';
import * as Menu from '../dropdown-menu';
import { Portal } from '../portal';
import { ProjectBoardBase } from './ProjectBoardBase';
import { ProjectBoardPlatformContext } from './context';
import type { ProjectBoardProps } from './types';

const platform = { Button, CloseButton, Dialog, Portal, ...Select, ...Menu };
export function ProjectBoard(props: ProjectBoardProps) {
  return <ProjectBoardPlatformContext.Provider value={platform}><ProjectBoardBase {...props} /></ProjectBoardPlatformContext.Provider>;
}
