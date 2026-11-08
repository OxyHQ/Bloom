import { Surface } from '../surface/Surface';
import { ScrollArea } from '../layout/ScrollArea';
import { createCanvasPanel } from './CanvasPanelBase';
export const CanvasPanel = createCanvasPanel(Surface, ScrollArea);
