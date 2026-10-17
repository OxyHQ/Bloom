import { Button, CloseButton } from '../button/index.web';
import { Dialog } from '../dialog/index.web';
import * as Select from '../select/index.web';
import * as Menu from '../dropdown-menu/index.web';
import { Portal } from '../portal/index.web';
import { ProjectBoardBase } from './ProjectBoardBase';
import { ProjectBoardPlatformContext } from './context';
import type { ProjectBoardProps } from './types';

const platform = { Button, CloseButton, Dialog, Portal, ...Select, ...Menu };
export function ProjectBoard(props: ProjectBoardProps) {
  return <ProjectBoardPlatformContext.Provider value={platform}><ProjectBoardBase {...props} /></ProjectBoardPlatformContext.Provider>;
}
