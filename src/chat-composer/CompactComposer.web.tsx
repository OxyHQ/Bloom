import { Button } from '../button/Button.web';
import { Collapsible } from '../collapsible/Collapsible.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { Surface } from '../surface/Surface.web';
import { createCompactComposer } from './create-compact-composer';

export const CompactComposer = createCompactComposer({ Button, Collapsible, ScrollArea, Surface });
