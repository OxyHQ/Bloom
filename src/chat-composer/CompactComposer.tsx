import { Button } from '../button/Button';
import { Collapsible } from '../collapsible/Collapsible';
import { ScrollArea } from '../layout/ScrollArea';
import { Surface } from '../surface/Surface';
import { createCompactComposer } from './create-compact-composer';

export const CompactComposer = createCompactComposer({ Button, Collapsible, ScrollArea, Surface });
