import { MATERIAL_CASES } from './material.cases';
import { describeWebParity } from './support/web';

describeWebParity(
  'Material: Surface, concentric and smooth corners, Divider, Fill, AspectRatio, Grid',
  MATERIAL_CASES,
);
