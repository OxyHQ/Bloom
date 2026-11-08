import { Surface } from '../surface/Surface.web';
import { ScrollArea } from '../layout/ScrollArea.web';
import { createCanvasPanel } from './CanvasPanelBase';
export const CanvasPanel = createCanvasPanel(Surface, ScrollArea);
